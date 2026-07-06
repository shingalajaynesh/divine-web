import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Modal, Button, Space, Progress, Typography } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { GET_CONTENT_VIEW_HISTORY_QUERY, RECORD_CONTENT_VIEW_MUTATION } from '../graphql/operations';

const { Text, Title } = Typography;

export default function VideoPlayerModal({ visible, onClose, mediaUrl, contentItemId, dailyContentId, title, isHi }) {
  const videoRef = useRef(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);
  const [progress, setProgress] = useState(0);

  // Fetch watch history if we have content/daily IDs
  const { data, refetch } = useQuery(GET_CONTENT_VIEW_HISTORY_QUERY, {
    variables: { contentItemId: contentItemId || null, dailyContentId: dailyContentId || null },
    skip: !visible || (!contentItemId && !dailyContentId),
    fetchPolicy: 'network-only'
  });

  const [recordContentView] = useMutation(RECORD_CONTENT_VIEW_MUTATION);

  // Handle watch history values once loaded
  useEffect(() => {
    if (data?.getContentViewHistory) {
      const pos = data.getContentViewHistory.lastPositionSeconds;
      if (pos > 5 && !data.getContentViewHistory.completed) {
        setSavedPosition(pos);
        setShowResumePrompt(true);
      }
    }
  }, [data]);

  // Periodic watch progress tracking
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    if (duration > 0) {
      const percent = (current / duration) * 100;
      setProgress(percent);

      // Record progress every 5 seconds to reduce network logs
      if (Math.floor(current) % 5 === 0 && Math.floor(current) > 0) {
        saveProgress(current, percent, percent >= 90);
      }
    }
  };

  const saveProgress = async (pos, percent, isDone) => {
    try {
      await recordContentView({
        variables: {
          input: {
            contentItemId: contentItemId || null,
            dailyContentId: dailyContentId || null,
            lastPositionSeconds: Math.floor(pos),
            progressPercent: parseFloat(percent.toFixed(2)),
            completed: isDone
          }
        }
      });
    } catch (e) {
      console.error('Error saving play position:', e);
    }
  };

  const handleEnded = () => {
    saveProgress(videoRef.current.currentTime, 100, true);
  };

  const handleResume = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = savedPosition;
      videoRef.current.play();
    }
    setShowResumePrompt(false);
  };

  const handleStartFresh = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    setShowResumePrompt(false);
  };

  // Close player safely and write final position
  const handleClose = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        const percent = (current / duration) * 100;
        saveProgress(current, percent, percent >= 90);
      }
    }
    onClose();
  };

  // Format position timestamp helper
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={720}
      title={title || (isHi ? "वीडियो प्लेयर" : "Video Player")}
      destroyOnClose
      style={{ borderRadius: '16px', overflow: 'hidden' }}
      bodyStyle={{ padding: '0px' }}
    >
      <div 
        style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '8px', overflow: 'hidden' }}
        onContextMenu={(e) => e.preventDefault()} // Secure lock preventing right-clicks/saving
      >
        <video
          ref={videoRef}
          src={mediaUrl}
          style={{ width: '100%', display: 'block', maxHeight: '420px' }}
          controls
          controlsList="nodownload noremoteplayback"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />

        {showResumePrompt && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#fff',
              zIndex: 10,
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <InfoCircleOutlined style={{ fontSize: '36px', color: '#f59e0b', marginBottom: '16px' }} />
            <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>
              {isHi ? "वीडियो फिर से शुरू करें?" : "Resume Video?"}
            </Title>
            <Text style={{ color: '#cbd5e1', display: 'block', marginBottom: '24px' }}>
              {isHi 
                ? `आपकी पिछली प्रगति ${formatTime(savedPosition)} पर सहेजी गई थी।`
                : `You left off at ${formatTime(savedPosition)}. Would you like to resume?`
              }
            </Text>
            <Space size="middle">
              <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={handleResume}>
                {isHi ? `यहाँ से शुरू करें (${formatTime(savedPosition)})` : `Resume from ${formatTime(savedPosition)}`}
              </Button>
              <Button ghost size="large" icon={<ReloadOutlined />} onClick={handleStartFresh}>
                {isHi ? "शुरू से देखें" : "Start Fresh"}
              </Button>
            </Space>
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {isHi ? "प्रगति सहेजने के लिए ऑटो-सिंक सक्रिय है" : "Auto-sync view progress enabled"}
          </Text>
          <Text strong style={{ fontSize: '13px', color: '#0f766e' }}>
            {Math.round(progress)}% {isHi ? "देखा गया" : "Watched"}
          </Text>
        </div>
        <Progress percent={Math.round(progress)} strokeColor="#0f766e" showInfo={false} size="small" style={{ marginTop: '8px' }} />
      </div>
    </Modal>
  );
}

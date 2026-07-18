import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Modal, Button, Space, Progress, Typography, Divider, Select, List } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, InfoCircleOutlined, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { GET_CONTENT_VIEW_HISTORY_QUERY, RECORD_CONTENT_VIEW_MUTATION } from '../graphql/operations';

const { Text, Title } = Typography;

export default function VideoPlayerModal({ 
  visible, 
  onClose, 
  mediaUrl, 
  contentItemId, 
  dailyContentId, 
  title, 
  isHi,
  subtitles = [],
  attachments = [] 
}) {
  const videoRef = useRef(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState('off');

  // Fetch watch history if we have content/daily IDs
  const { data, refetch } = useQuery(GET_CONTENT_VIEW_HISTORY_QUERY, {
    variables: { contentItemId: contentItemId || null, dailyContentId: dailyContentId || null },
    skip: !visible || (!contentItemId && !dailyContentId),
    fetchPolicy: 'network-only'
  });

  const [recordContentView] = useMutation(RECORD_CONTENT_VIEW_MUTATION);

  // Default mock attachments & subtitles if none provided
  const sessionAttachments = React.useMemo(() => {
    if (attachments && attachments.length > 0) return attachments;
    return [
      { name: isHi ? 'दैनिक योग अभ्यास चेकलिस्ट.pdf' : 'Daily Yoga Practice Checklist.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      { name: isHi ? 'गर्भावस्था स्वस्थ आहार योजना.pdf' : 'Pregnancy Healthy Diet Plan.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ];
  }, [attachments, isHi]);

  const subtitleTracks = React.useMemo(() => {
    if (subtitles && subtitles.length > 0) return subtitles;
    return [
      { label: 'English CC', srclang: 'en', src: 'https://vtt-creator.com/examples/sample.vtt' },
      { label: 'Hindi (हिंदी)', srclang: 'hi', src: 'https://vtt-creator.com/examples/sample.vtt' }
    ];
  }, [subtitles]);

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

  // Handle manual subtitle toggle
  const handleSubtitleChange = (val) => {
    setSelectedSubtitle(val);
    if (!videoRef.current) return;
    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].language === val) {
        tracks[i].mode = 'showing';
      } else {
        tracks[i].mode = 'disabled';
      }
    }
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
      width={760}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SafetyCertificateOutlined style={{ color: '#be123c' }} />
          <span>{title || (isHi ? "सुरक्षित वीडियो सत्र" : "Secure Video Session")}</span>
        </div>
      }
      destroyOnHidden
      style={{ borderRadius: '24px', overflow: 'hidden' }}
    >
      <div 
        style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
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
          crossOrigin="anonymous"
        >
          {subtitleTracks.map((track, idx) => (
            <track
              key={idx}
              kind="subtitles"
              label={track.label}
              srcLang={track.srclang}
              src={track.src}
              default={track.srclang === selectedSubtitle}
            />
          ))}
        </video>

        {showResumePrompt && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.96)',
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
            <InfoCircleOutlined style={{ fontSize: '40px', color: '#be123c', marginBottom: '16px' }} />
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
              <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={handleResume} style={{ background: '#be123c', borderColor: '#be123c' }}>
                {isHi ? `यहाँ से शुरू करें (${formatTime(savedPosition)})` : `Resume from ${formatTime(savedPosition)}`}
              </Button>
              <Button ghost size="large" icon={<ReloadOutlined />} onClick={handleStartFresh}>
                {isHi ? "शुरू से देखें" : "Start Fresh"}
              </Button>
            </Space>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 0 0 0' }}>
        {/* Watch Analytics Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {isHi ? "सुरक्षित स्ट्रीमिंग · प्रगति सहेजने के लिए ऑटो-सिंक सक्रिय है" : "Secure Streaming · Auto-sync view progress enabled"}
          </Text>
          <Text strong style={{ fontSize: '13px', color: '#be123c' }}>
            {Math.round(progress)}% {isHi ? "देखा गया" : "Watched"}
          </Text>
        </div>
        <Progress percent={Math.round(progress)} strokeColor="#be123c" showInfo={false} size="small" style={{ marginTop: '8px', marginBottom: '16px' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
          {/* Subtitles Track Selection Dropdown */}
          <div>
            <span style={{ fontSize: '12px', marginRight: '8px', fontWeight: 'bold', color: '#475569' }}>
              {isHi ? "उपशीर्षक (Subtitles):" : "Subtitles (CC):"}
            </span>
            <Select 
              value={selectedSubtitle} 
              onChange={handleSubtitleChange} 
              style={{ width: '130px' }}
              options={[
                { value: 'off', label: isHi ? 'बंद' : 'OFF' },
                ...subtitleTracks.map(t => ({ value: t.srclang, label: t.label }))
              ]}
            />
          </div>
        </div>

        {/* Attachments Section */}
        {sessionAttachments.length > 0 && (
          <div style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
            <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px', color: '#be123c' }}>
              {isHi ? "संलग्न पाठ्य सामग्री (Attachments)" : "Session Attachments"}
            </Text>
            <List
              size="small"
              dataSource={sessionAttachments}
              renderItem={file => (
                <List.Item style={{ padding: '6px 0', borderBottom: 'none' }}>
                  <Button 
                    type="link" 
                    icon={<FileTextOutlined style={{ color: '#be123c' }} />} 
                    href={file.url} 
                    target="_blank" 
                    download 
                    style={{ padding: 0, height: 'auto', color: '#334155' }}
                  >
                    {file.name}
                  </Button>
                </List.Item>
              )}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

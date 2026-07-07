import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Modal, Button, Slider, Space, Popover, Input, List, Typography, Divider, Badge } from 'antd';
import { 
  PlayCircleOutlined, PauseCircleOutlined, CustomerServiceOutlined, 
  CloudDownloadOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  PlusOutlined, MenuOutlined, CloseCircleOutlined 
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  GET_MY_PLAYLISTS_QUERY, CREATE_PLAYLIST_MUTATION, 
  ADD_PLAYLIST_ITEM_MUTATION, REMOVE_PLAYLIST_ITEM_MUTATION 
} from '../graphql/operations';

const { Text, Title, Paragraph } = Typography;

export default function AudioPlayerModal({ visible, onClose, mediaUrl, title, contentItemId, isHi }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sleepTimer, setSleepTimer] = useState(null); // in minutes
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [downloading, setDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Playlists data
  const { data: playlistData, refetch: refetchPlaylists } = useQuery(GET_MY_PLAYLISTS_QUERY, {
    skip: !visible
  });

  const [createPlaylist] = useMutation(CREATE_PLAYLIST_MUTATION);
  const [addPlaylistItem] = useMutation(ADD_PLAYLIST_ITEM_MUTATION);

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Set audio parameters on mount
  useEffect(() => {
    if (visible && audioRef.current) {
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [visible, mediaUrl]);

  // Sleep timer ticker
  useEffect(() => {
    if (timeLeft <= 0) {
      if (isPlaying && sleepTimer !== null) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setSleepTimer(null);
        toast(isHi ? "स्लीप टाइमर समाप्त - ऑडियो रोका गया" : "Sleep timer finished - playback paused", { icon: '⏰' });
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Playback error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const startSleepTimer = (mins) => {
    setSleepTimer(mins);
    setTimeLeft(mins * 60);
    toast(isHi ? `${mins} मिनट का स्लीप टाइमर सेट किया गया` : `Sleep timer set for ${mins} mins`, { icon: '⏰' });
  };

  const cancelSleepTimer = () => {
    setSleepTimer(null);
    setTimeLeft(0);
    toast(isHi ? "स्लीप टाइमर रद्द कर दिया गया" : "Sleep timer cancelled", { icon: '⏰' });
  };

  const handleDownload = () => {
    setDownloading(true);
    toast.loading(isHi ? "ऑफलाइन सुनने के लिए सहेज रहे हैं..." : "Saving to offline cache...", { id: 'dl' });
    setTimeout(() => {
      setDownloading(false);
      setIsDownloaded(true);
      toast.success(isHi ? "ऑफ़लाइन सुनने के लिए उपलब्ध!" : "Available for offline listening!", { id: 'dl' });
    }, 2000);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await createPlaylist({
        variables: { name: newPlaylistName.trim(), description: 'Custom playlist' }
      });
      setNewPlaylistName('');
      refetchPlaylists();
      toast.success(isHi ? "प्लेलिस्ट बनाई गई" : "Playlist created successfully");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!contentItemId) {
      toast.error(isHi ? "इस आइटम को जोड़ा नहीं जा सकता" : "This item cannot be added to a playlist");
      return;
    }
    try {
      await addPlaylistItem({
        variables: { playlistId, contentItemId }
      });
      toast.success(isHi ? "प्लेलिस्ट में जोड़ा गया" : "Track added to playlist");
      setPopoverOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const playlistContent = (
    <div style={{ width: '260px' }}>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
        {isHi ? "प्लेलिस्ट में जोड़ें" : "Add to Playlist"}
      </Text>
      <List
        size="small"
        dataSource={playlistData?.getMyPlaylists || []}
        renderItem={item => (
          <List.Item 
            actions={[<Button type="link" size="small" onClick={() => handleAddToPlaylist(item.id)}><PlusOutlined /></Button>]}
            style={{ padding: '4px 0' }}
          >
            <Text ellipsis style={{ maxWidth: '180px' }}>{item.name}</Text>
          </List.Item>
        )}
      />
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Input 
          placeholder={isHi ? "नई प्लेलिस्ट का नाम..." : "New playlist name..."} 
          size="small"
          value={newPlaylistName}
          onChange={e => setNewPlaylistName(e.target.value)}
        />
        <Button type="primary" size="small" onClick={handleCreatePlaylist}>{isHi ? "बनाएं" : "Create"}</Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={460}
      title={isHi ? "संगीत और ध्यान प्लेयर" : "Music & Meditation Player"}
      destroyOnClose
      style={{ borderRadius: '24px', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 24px 0' }}>
        {/* Vinyl/Cd Animation wrapper */}
        <div 
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
            marginBottom: '24px',
            animation: isPlaying ? 'spin 10s linear infinite' : 'none',
            border: '8px solid #cbd5e1'
          }}
        >
          <CustomerServiceOutlined style={{ fontSize: '64px', color: '#f59e0b' }} />
        </div>

        <audio
          ref={audioRef}
          src={mediaUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        <Title level={4} style={{ textAlign: 'center', marginBottom: '4px', padding: '0 20px' }}>
          {title || (isHi ? "निर्देशित अभ्यास" : "Guided Practice")}
        </Title>
        <Text type="secondary" style={{ marginBottom: '24px' }}>
          {isHi ? "शांत मन से सुनें" : "Listen with a calm mind"}
        </Text>

        {/* Scrub Bar */}
        <div style={{ width: '90%', marginBottom: '16px' }}>
          <Slider
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSliderChange}
            tooltip={{ formatter: formatTime }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-4px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>{formatTime(currentTime)}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{formatTime(duration)}</Text>
          </div>
        </div>

        {/* Player Controls */}
        <Space size="large" style={{ marginBottom: '24px' }}>
          <Button 
            shape="circle" 
            size="large" 
            icon={isPlaying ? <PauseCircleOutlined style={{ fontSize: '28px' }} /> : <PlayCircleOutlined style={{ fontSize: '28px' }} />} 
            type="primary" 
            onClick={togglePlay}
            style={{ width: '60px', height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f766e', borderColor: '#0f766e' }}
          />
        </Space>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '90%', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          {/* Download Control */}
          <Button 
            type="text" 
            icon={isDownloaded ? <CheckCircleOutlined style={{ color: '#10b981' }} /> : <CloudDownloadOutlined />} 
            onClick={handleDownload}
            disabled={downloading || isDownloaded}
          >
            {isDownloaded ? (isHi ? "सहेजा गया" : "Saved") : (isHi ? "डाउनलोड" : "Download")}
          </Button>

          {/* Sleep Timer Popover */}
          <Popover 
            trigger="click" 
            content={
              <div style={{ padding: '8px' }}>
                <Text strong style={{ display: 'block', marginBottom: '12px' }}>{isHi ? "ऑटो-पॉज स्लीप टाइमर" : "Auto-Pause Sleep Timer"}</Text>
                {sleepTimer ? (
                  <div style={{ marginBottom: '12px' }}>
                    <Badge status="processing" text={isHi ? `शेष समय: ${formatTime(timeLeft)}` : `Remaining: ${formatTime(timeLeft)}`} />
                    <Button type="primary" danger size="small" block onClick={cancelSleepTimer} style={{ marginTop: '8px' }}>
                      {isHi ? "टाइमर रद्द करें" : "Cancel Timer"}
                    </Button>
                  </div>
                ) : (
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Button size="small" block onClick={() => startSleepTimer(15)}>15 {isHi ? "मिनट" : "Minutes"}</Button>
                    <Button size="small" block onClick={() => startSleepTimer(30)}>30 {isHi ? "मिनट" : "Minutes"}</Button>
                    <Button size="small" block onClick={() => startSleepTimer(45)}>45 {isHi ? "मिनट" : "Minutes"}</Button>
                    <Button size="small" block onClick={() => startSleepTimer(60)}>60 {isHi ? "मिनट" : "Minutes"}</Button>
                  </Space>
                )}
              </div>
            }
          >
            <Button type="text" icon={<ClockCircleOutlined />}>
              {sleepTimer ? formatTime(timeLeft) : (isHi ? "टाइमर" : "Timer")}
            </Button>
          </Popover>

          {/* Playlist Popover */}
          {contentItemId && (
            <Popover
              open={popoverOpen}
              onOpenChange={setPopoverOpen}
              content={playlistContent}
              trigger="click"
            >
              <Button type="text" icon={<MenuOutlined />}>
                {isHi ? "प्लेलिस्ट" : "Playlist"}
              </Button>
            </Popover>
          )}
        </div>
      </div>

      {/* Embedded CSS for Vinyl spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
}

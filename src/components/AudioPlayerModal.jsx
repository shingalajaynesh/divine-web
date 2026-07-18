import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Modal, Button, Slider, Space, Popover, Input, List, Typography, Divider, Badge, Card, Tooltip } from 'antd';
import { 
  PlayCircleOutlined, PauseCircleOutlined, CustomerServiceOutlined, 
  CloudDownloadOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  PlusOutlined, MenuOutlined, CloseCircleOutlined, SwapOutlined, 
  RetweetOutlined, StepForwardOutlined, StepBackwardOutlined,
  CompassOutlined, LaptopOutlined
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  GET_MY_PLAYLISTS_QUERY, CREATE_PLAYLIST_MUTATION, 
  ADD_PLAYLIST_ITEM_MUTATION 
} from '../graphql/operations';

const { Text, Title, Paragraph } = Typography;

export default function AudioPlayerModal({ visible, onClose, mediaUrl, title, contentItemId, tracks = [], initialTrackIndex = 0, isHi }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Sleep Timer
  const [sleepTimer, setSleepTimer] = useState(null); // in minutes
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  
  // Queue & Loop Settings
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // off, one, all

  // Download Simulation
  const [downloading, setDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Playlists
  const { data: playlistData, refetch: refetchPlaylists } = useQuery(GET_MY_PLAYLISTS_QUERY, {
    skip: !visible
  });
  const [createPlaylist] = useMutation(CREATE_PLAYLIST_MUTATION);
  const [addPlaylistItem] = useMutation(ADD_PLAYLIST_ITEM_MUTATION);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Normalise tracks to handle either a list of tracks or a single track prop fallback
  const playlistTracks = React.useMemo(() => {
    if (tracks && tracks.length > 0) return tracks;
    if (mediaUrl) {
      return [{
        id: contentItemId || 'temp-id',
        url: mediaUrl,
        title: title || (isHi ? "निर्देशित अभ्यास" : "Guided Practice"),
        description: isHi ? "शांत मन से सुनें" : "Listen with a calm mind"
      }];
    }
    return [];
  }, [tracks, mediaUrl, title, contentItemId, isHi]);

  const currentTrack = playlistTracks[currentTrackIndex] || null;

  // Set audio parameters when index or visible state changes
  useEffect(() => {
    if (visible && audioRef.current && currentTrack) {
      audioRef.current.load();
      // If we were already playing, keep playing the new track
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log('Autoplay blocked:', err));
      } else {
        setIsPlaying(false);
      }
      setCurrentTime(0);
    }
  }, [currentTrackIndex, visible, currentTrack]);

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
  }, [timeLeft, isPlaying, sleepTimer]);

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

  const handleTrackEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log(e));
      }
    } else {
      playNext();
    }
  };

  const playNext = () => {
    if (playlistTracks.length <= 1) {
      if (repeatMode === 'all') {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log(e));
        }
      } else {
        setIsPlaying(false);
      }
      return;
    }

    if (isShuffle) {
      const randIndex = Math.floor(Math.random() * playlistTracks.length);
      setCurrentTrackIndex(randIndex);
    } else {
      const nextIndex = currentTrackIndex + 1;
      if (nextIndex < playlistTracks.length) {
        setCurrentTrackIndex(nextIndex);
      } else if (repeatMode === 'all') {
        setCurrentTrackIndex(0);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const playPrev = () => {
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    } else {
      if (currentTrackIndex > 0) {
        setCurrentTrackIndex(currentTrackIndex - 1);
      } else {
        // Wrap around to end
        setCurrentTrackIndex(playlistTracks.length - 1);
      }
    }
  };

  const toggleRepeatMode = () => {
    const modes = ['off', 'one', 'all'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
    toast(
      isHi 
        ? `रिपीट मोड: ${nextMode === 'one' ? 'एक ट्रैक' : nextMode === 'all' ? 'सभी' : 'बंद'}`
        : `Repeat mode: ${nextMode.toUpperCase()}`,
      { icon: '🔁' }
    );
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    toast(
      isHi 
        ? `शफल: ${!isShuffle ? 'शुरू' : 'बंद'}`
        : `Shuffle: ${!isShuffle ? 'ON' : 'OFF'}`,
      { icon: '🔀' }
    );
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
    const targetItemId = currentTrack?.id;
    if (!targetItemId || targetItemId.startsWith('temp')) {
      toast.error(isHi ? "इस आइटम को जोड़ा नहीं जा सकता" : "This item cannot be added to a playlist");
      return;
    }
    try {
      await addPlaylistItem({
        variables: { playlistId, contentItemId: targetItemId }
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
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        width={460}
        title={isHi ? "संगीत और ध्यान प्लेयर" : "Music & Meditation Player"}
        destroyOnHidden
        style={{ borderRadius: '24px', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 12px 0' }}>
          {/* Vinyl/Cd Animation wrapper */}
          <div 
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
              marginBottom: '20px',
              animation: isPlaying ? 'spin 12s linear infinite' : 'none',
              border: '6px solid #e2e8f0',
              position: 'relative'
            }}
          >
            <CustomerServiceOutlined style={{ fontSize: '56px', color: '#be123c' }} />
            <div style={{
              position: 'absolute',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#f8fafc',
              border: '4px solid #475569'
            }} />
          </div>

          <audio
            ref={audioRef}
            src={currentTrack?.url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleTrackEnded}
          />

          <Title level={4} style={{ textAlign: 'center', marginBottom: '4px', padding: '0 20px' }}>
            {currentTrack?.title || (isHi ? "निर्देशित अभ्यास" : "Guided Practice")}
          </Title>
          <Text type="secondary" style={{ marginBottom: '16px', fontSize: 13 }}>
            {currentTrack?.description || (isHi ? "शांत मन से सुनें" : "Listen with a calm mind")}
          </Text>

          {/* Queue Index Indicator */}
          {playlistTracks.length > 1 && (
            <Tag color="volcano" style={{ marginBottom: '16px' }}>
              Track {currentTrackIndex + 1} of {playlistTracks.length}
            </Tag>
          )}

          {/* Scrub Bar */}
          <div style={{ width: '90%', marginBottom: '12px' }}>
            <Slider
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSliderChange}
              tooltip={{ formatter: formatTime }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-8px' }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>{formatTime(currentTime)}</Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>{formatTime(duration)}</Text>
            </div>
          </div>

          {/* Player Navigation & Play Controls */}
          <Space size="middle" style={{ marginBottom: '20px' }}>
            <Button 
              shape="circle" 
              icon={<StepBackwardOutlined />} 
              onClick={playPrev}
              disabled={playlistTracks.length <= 1}
            />
            <Button 
              shape="circle" 
              icon={isShuffle ? <SwapOutlined style={{ color: '#be123c' }} /> : <SwapOutlined />} 
              onClick={toggleShuffle}
              disabled={playlistTracks.length <= 1}
            />
            <Button 
              shape="circle" 
              size="large" 
              icon={isPlaying ? <PauseCircleOutlined style={{ fontSize: '28px' }} /> : <PlayCircleOutlined style={{ fontSize: '28px' }} />} 
              type="primary" 
              onClick={togglePlay}
              style={{ width: '56px', height: '56px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#be123c', borderColor: '#be123c' }}
            />
            <Button 
              shape="circle" 
              icon={
                repeatMode === 'one' ? <Badge dot><RetweetOutlined style={{ color: '#be123c' }} /></Badge> :
                repeatMode === 'all' ? <RetweetOutlined style={{ color: '#be123c' }} /> : <RetweetOutlined />
              } 
              onClick={toggleRepeatMode}
            />
            <Button 
              shape="circle" 
              icon={<StepForwardOutlined />} 
              onClick={playNext}
              disabled={playlistTracks.length <= 1}
            />
          </Space>

          {/* Action Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '90%', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <Button 
              type="text" 
              icon={isDownloaded ? <CheckCircleOutlined style={{ color: '#10b981' }} /> : <CloudDownloadOutlined />} 
              onClick={handleDownload}
              disabled={downloading || isDownloaded}
              style={{ fontSize: '12px' }}
            >
              {isDownloaded ? (isHi ? "सहेजा गया" : "Saved") : (isHi ? "डाउनलोड" : "Download")}
            </Button>

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
                    <Space orientation="vertical" style={{ width: '150px' }}>
                      <Button size="small" block onClick={() => startSleepTimer(5)}>5 {isHi ? "मिनट" : "Minutes"}</Button>
                      <Button size="small" block onClick={() => startSleepTimer(15)}>15 {isHi ? "मिनट" : "Minutes"}</Button>
                      <Button size="small" block onClick={() => startSleepTimer(30)}>30 {isHi ? "मिनट" : "Minutes"}</Button>
                      <Button size="small" block onClick={() => startSleepTimer(60)}>60 {isHi ? "मिनट" : "Minutes"}</Button>
                    </Space>
                  )}
                </div>
              }
            >
              <Button type="text" icon={<ClockCircleOutlined />} style={{ fontSize: '12px' }}>
                {sleepTimer ? formatTime(timeLeft) : (isHi ? "टाइमर" : "Timer")}
              </Button>
            </Popover>

            {currentTrack?.id && !currentTrack.id.startsWith('temp') && (
              <Popover
                open={popoverOpen}
                onOpenChange={setPopoverOpen}
                content={playlistContent}
                trigger="click"
              >
                <Button type="text" icon={<MenuOutlined />} style={{ fontSize: '12px' }}>
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

      {/* Simulated Smartphone Lock Screen Background Notification Card */}
      {visible && isPlaying && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '320px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            color: '#f8fafc',
            zIndex: 9999,
            border: '1px solid #334155',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Space size={6}>
              <LaptopOutlined style={{ color: '#be123c' }} />
              <Text style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>
                {isHi ? "लॉक स्क्रीन प्लेबैक" : "BACKGROUND AUDIO ACTIVATED"}
              </Text>
            </Space>
            <CompassOutlined style={{ color: '#10b981', animation: 'spin 4s linear infinite' }} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#be123c', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CustomerServiceOutlined style={{ fontSize: '20px', color: '#f8fafc' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text strong style={{ color: '#f8fafc', display: 'block', fontSize: '13px' }} ellipsis>
                {currentTrack?.title}
              </Text>
              <Text style={{ color: '#94a3b8', display: 'block', fontSize: '11px' }} ellipsis>
                {isHi ? "गर्भ संस्कारbackground.mp3" : "Playing background audio loop..."}
              </Text>
            </div>
          </div>

          {/* Lock Screen Progress Bar */}
          <div style={{ width: '100%', height: '3px', background: '#334155', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
            <div 
              style={{ 
                height: '100%', 
                background: '#be123c', 
                width: `${(currentTime / (duration || 100)) * 100}%`,
                transition: 'width 0.2s linear' 
              }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{formatTime(currentTime)}</span>
            <Space size="middle">
              <Button size="small" type="text" shape="circle" icon={<StepBackwardOutlined style={{ color: '#94a3b8' }} />} onClick={playPrev} disabled={playlistTracks.length <= 1} />
              <Button size="small" shape="circle" icon={isPlaying ? <PauseCircleOutlined style={{ color: '#f8fafc' }} /> : <PlayCircleOutlined style={{ color: '#f8fafc' }} />} onClick={togglePlay} style={{ background: '#be123c', border: 'none' }} />
              <Button size="small" type="text" shape="circle" icon={<StepForwardOutlined style={{ color: '#94a3b8' }} />} onClick={playNext} disabled={playlistTracks.length <= 1} />
            </Space>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </>
  );
}

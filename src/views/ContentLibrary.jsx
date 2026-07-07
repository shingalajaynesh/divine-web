import React, { useMemo, useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Button, Card, Col, Empty, Input, Row, Segmented, Skeleton, Tag, Typography, List, Modal, Space, Divider } from 'antd';
import { 
  AudioOutlined, BookOutlined, ClockCircleOutlined, HeartOutlined, 
  PlayCircleOutlined, SearchOutlined, StarOutlined, PlusOutlined, 
  DeleteOutlined, CustomerServiceOutlined 
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  CLEAR_RECENT_CONTENT_SEARCHES_MUTATION, 
  CONTENT_FEED_QUERY, 
  RECENT_CONTENT_SEARCHES_QUERY, 
  SAVED_CONTENT_QUERY, 
  SEARCH_CONTENT_QUERY, 
  SET_CONTENT_BOOKMARK_MUTATION,
  GET_MY_PLAYLISTS_QUERY,
  CREATE_PLAYLIST_MUTATION,
  DELETE_PLAYLIST_MUTATION,
  REMOVE_PLAYLIST_ITEM_MUTATION
} from '../graphql/operations';
import VideoPlayerModal from '../components/VideoPlayerModal';
import AudioPlayerModal from '../components/AudioPlayerModal';
import ReadingModeModal from '../components/ReadingModeModal';

const { Title, Paragraph, Text } = Typography;
const filters = [{ label: 'All', value: '' }, { label: 'Stories', value: 'story' }, { label: 'Audio', value: 'audio' }, { label: 'Video', value: 'video' }, { label: 'Meditation', value: 'meditation' }, { label: 'Yoga', value: 'yoga' }, { label: 'Affirmations', value: 'affirmation' }];
const views = [
  { label: 'Explore', value: 'explore' }, 
  { label: 'Bookmarks', value: 'bookmark' }, 
  { label: 'Watch Later', value: 'watch_later' },
  { label: 'My Playlists', value: 'playlists' }
];

const iconFor = (type) => type === 'audio' ? <AudioOutlined /> : type === 'video' ? <PlayCircleOutlined /> : type === 'affirmation' ? <HeartOutlined /> : <BookOutlined />;

export default function ContentLibrary({ lang = 'en' }) {
  const [type, setType] = useState('');
  const [view, setView] = useState('explore');
  const [query, setQuery] = useState('');
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [readingItem, setReadingItem] = useState(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [notice, setNotice] = useState('');

  // Queue playback states
  const [playbackTracks, setPlaybackTracks] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  // Queries
  const feed = useQuery(CONTENT_FEED_QUERY, { variables: { language: lang, contentType: type || null }, skip: view !== 'explore' || Boolean(activeQuery) });
  const [search, searchState] = useLazyQuery(SEARCH_CONTENT_QUERY, { fetchPolicy: 'network-only' });
  const recent = useQuery(RECENT_CONTENT_SEARCHES_QUERY, { fetchPolicy: 'cache-and-network' });
  const saved = useQuery(SAVED_CONTENT_QUERY, { variables: { language: lang, kind: view }, skip: ['explore', 'playlists'].includes(view), fetchPolicy: 'cache-and-network' });
  
  // Playlists operations
  const { data: playlistData, loading: playlistLoading, refetch: refetchPlaylists } = useQuery(GET_MY_PLAYLISTS_QUERY, {
    skip: view !== 'playlists',
    fetchPolicy: 'cache-and-network'
  });
  const [createPlaylist] = useMutation(CREATE_PLAYLIST_MUTATION);
  const [deletePlaylist] = useMutation(DELETE_PLAYLIST_MUTATION);
  const [removePlaylistItem] = useMutation(REMOVE_PLAYLIST_ITEM_MUTATION);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  const [setBookmark, bookmarkState] = useMutation(SET_CONTENT_BOOKMARK_MUTATION);
  const [clearRecent] = useMutation(CLEAR_RECENT_CONTENT_SEARCHES_MUTATION);

  const runSearch = (value = query) => {
    const clean = value.trim();
    if (clean.length < 2) return;
    setQuery(clean); setActiveQuery(clean); setView('explore');
    search({ variables: { query: clean, language: lang, contentType: type || null } }).then(() => recent.refetch());
  };

  const items = useMemo(() => {
    if (view === 'playlists') return [];
    return view !== 'explore' ? saved.data?.savedContent : activeQuery ? searchState.data?.searchContent : feed.data?.contentFeed;
  }, [view, saved.data, activeQuery, searchState.data, feed.data]);

  const loading = view === 'playlists' ? playlistLoading : (view !== 'explore' ? saved.loading : activeQuery ? searchState.loading : feed.loading);
  const error = view === 'playlists' ? null : (view !== 'explore' ? saved.error : activeQuery ? searchState.error : feed.error);

  const save = async (contentItemId, kind, savedValue = true) => {
    await setBookmark({ variables: { input: { contentItemId, kind, saved: savedValue } } });
    setNotice(savedValue ? (kind === 'watch_later' ? 'Added to Watch Later.' : 'Bookmarked for you.') : 'Removed from your saved list.');
    if (view !== 'explore') saved.refetch();
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await createPlaylist({
        variables: { name: newPlaylistName.trim(), description: 'Personal audio playlist' }
      });
      setNewPlaylistName('');
      refetchPlaylists();
      toast.success('Playlist created successfully.');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeletePlaylist = async (id) => {
    Modal.confirm({
      title: 'Delete Playlist?',
      content: 'Are you sure you want to delete this playlist? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deletePlaylist({ variables: { id } });
          refetchPlaylists();
          if (selectedPlaylistId === id) setSelectedPlaylistId(null);
          toast.success('Playlist deleted.');
        } catch (e) {
          toast.error(e.message);
        }
      }
    });
  };

  const handleRemoveTrack = async (playlistId, contentItemId) => {
    try {
      await removePlaylistItem({ variables: { playlistId, contentItemId } });
      refetchPlaylists();
      toast.success('Track removed from playlist.');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const playEntirePlaylist = (playlist) => {
    if (!playlist.items || playlist.items.length === 0) {
      toast.error("This playlist has no audio tracks.");
      return;
    }
    const tracksToPlay = playlist.items.map(item => ({
      id: item.contentItem.id,
      url: item.contentItem.translation?.body?.startsWith('http') 
        ? item.contentItem.translation.body 
        : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      title: item.contentItem.translation?.title,
      description: item.contentItem.slug
    }));
    
    setPlaybackTracks(tracksToPlay);
    setPlaybackIndex(0);
    setPlayingAudio(tracksToPlay[0]);
  };

  const selectedPlaylist = useMemo(() => {
    return playlistData?.getMyPlaylists?.find(p => p.id === selectedPlaylistId);
  }, [playlistData, selectedPlaylistId]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Tag color="rose" style={{ borderRadius: '12px', padding: '4px 12px' }}>DIVINE LIBRARY</Tag>
        <Title level={1} style={{ margin: '12px 0 8px 0', color: 'var(--brand-maroon-dark)' }}>Learn, Listen & Practice</Title>
        <Paragraph type="secondary" style={{ fontSize: '16px' }}>Search original pregnancy exercises, audio wellness collection, and customized playlists.</Paragraph>
        
        <Input.Search 
          style={{ maxWidth: '600px', margin: '20px auto 0 auto', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
          size="large" 
          value={query} 
          onChange={(event) => setQuery(event.target.value)} 
          onSearch={runSearch} 
          enterButton={<SearchOutlined />} 
          placeholder="Search meditation, stories, yoga…" 
        />
        
        {recent.data?.recentContentSearches?.length ? (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Recent searches:</span>
            {recent.data.recentContentSearches.slice(0, 5).map((item) => (
              <Button size="small" shape="round" key={item.id} onClick={() => runSearch(item.query)}>{item.query}</Button>
            ))}
            <Button size="small" type="text" onClick={async () => { await clearRecent(); recent.refetch(); }}>Clear</Button>
          </div>
        ) : null}
        
        <div style={{ marginTop: '24px', maxWidth: '500px', margin: '24px auto 0 auto' }}>
          <Segmented block options={views} value={view} onChange={(value) => { setView(value); if (value !== 'explore') setActiveQuery(''); }} />
        </div>
        
        {view === 'explore' ? (
          <div style={{ marginTop: '16px', overflowX: 'auto', whiteSpace: 'nowrap', padding: '4px 0' }}>
            <Segmented options={filters} value={type} onChange={(value) => { setType(value); if (activeQuery) search({ variables: { query: activeQuery, language: lang, contentType: value || null } }); }} />
          </div>
        ) : null}
        
        {notice ? <div style={{ marginTop: '12px', color: '#be123c', fontWeight: '500' }}>{notice}</div> : null}
      </div>

      {loading ? (
        <Card style={{ borderRadius: '16px' }}><Skeleton active /></Card>
      ) : error ? (
        <Empty description="Library could not be loaded." />
      ) : view === 'playlists' ? (
        // Playlist Workspace
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card title="My Playlists" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Input 
                  placeholder="Create new playlist..." 
                  value={newPlaylistName} 
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onPressEnter={handleCreatePlaylist}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePlaylist} style={{ background: '#be123c', borderColor: '#be123c' }} />
              </div>
              <List
                dataSource={playlistData?.getMyPlaylists || []}
                renderItem={playlist => (
                  <List.Item 
                    actions={[
                      <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeletePlaylist(playlist.id)} />
                    ]}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                    style={{ 
                      cursor: 'pointer', 
                      borderRadius: '8px', 
                      padding: '8px 12px',
                      background: selectedPlaylistId === playlist.id ? '#fff1f2' : 'transparent',
                      borderBottom: 'none'
                    }}
                  >
                    <List.Item.Meta 
                      avatar={<CustomerServiceOutlined style={{ fontSize: '20px', color: '#be123c' }} />}
                      title={<Text strong>{playlist.name}</Text>}
                      description={`${playlist.items?.length || 0} tracks`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={16}>
            {selectedPlaylist ? (
              <Card 
                title={selectedPlaylist.name} 
                extra={
                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />} 
                    disabled={!selectedPlaylist.items?.length}
                    onClick={() => playEntirePlaylist(selectedPlaylist)}
                    style={{ background: '#be123c', borderColor: '#be123c' }}
                  >
                    Play Entire Playlist
                  </Button>
                }
                style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}
              >
                <Paragraph>{selectedPlaylist.description || 'Personal audio playlist'}</Paragraph>
                <Divider />
                <List
                  dataSource={selectedPlaylist.items || []}
                  locale={{ emptyText: 'No tracks added to this playlist yet. Browse content and click "+" to add.' }}
                  renderItem={(item, index) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="primary" 
                          shape="circle" 
                          icon={<PlayCircleOutlined />} 
                          onClick={() => {
                            const tracksToPlay = selectedPlaylist.items.map(t => ({
                              id: t.contentItem.id,
                              url: t.contentItem.translation?.body?.startsWith('http') 
                                ? t.contentItem.translation.body 
                                : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                              title: t.contentItem.translation?.title,
                              description: t.contentItem.slug
                            }));
                            setPlaybackTracks(tracksToPlay);
                            setPlaybackIndex(index);
                            setPlayingAudio(tracksToPlay[index]);
                          }}
                        />,
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveTrack(selectedPlaylist.id, item.contentItem.id)} />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Tag color="volcano">{index + 1}</Tag>}
                        title={<Text strong>{item.contentItem.translation?.title}</Text>}
                        description={`${item.contentItem.slug} · ${item.contentItem.contentType}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ) : (
              <Card style={{ borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <Empty description="Select a playlist from the left panel to manage or play tracks." />
              </Card>
            )}
          </Col>
        </Row>
      ) : items?.length ? (
        <Row gutter={[20, 20]}>
          {items.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.id}>
              <Card 
                className="library-content-card"
                style={{ 
                  borderRadius: '16px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.01)', 
                  border: '1px solid #f1f5f9',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff1f2', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#be123c' }}>
                    {iconFor(item.contentType)}
                  </div>
                  <Tag color="rose">{item.category?.name || item.contentType.toUpperCase()}</Tag>
                </div>
                
                <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '16px', minHeight: '44px' }}>
                  {item.translation?.title}
                </Title>
                <Paragraph ellipsis={{ rows: 3 }} type="secondary" style={{ fontSize: '13px', marginBottom: '16px' }}>
                  {item.translation?.summary || item.translation?.body}
                </Paragraph>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {item.visibility === 'free' ? 'Free access' : `${item.visibility} access`}
                  </Text>
                  
                  <Space size={4}>
                    {view === 'explore' ? (
                      <>
                        <Button size="small" shape="circle" disabled={bookmarkState.loading} icon={<StarOutlined />} onClick={() => save(item.id, 'bookmark')} />
                        {['video', 'audio'].includes(item.contentType) && (
                          <Button size="small" shape="circle" disabled={bookmarkState.loading} icon={<ClockCircleOutlined />} onClick={() => save(item.id, 'watch_later')} />
                        )}
                      </>
                    ) : (
                      <Button size="small" danger onClick={() => save(item.id, view, false)}>Remove</Button>
                    )}
                    
                    {['video', 'audio'].includes(item.contentType) ? (
                      <Button size="small" type="primary" style={{ background: '#be123c', borderColor: '#be123c' }} icon={<PlayCircleOutlined />} onClick={() => { if (item.contentType === 'video') setPlayingVideo(item); else { setPlaybackTracks([]); setPlayingAudio(item); } }}>Play</Button>
                    ) : (
                      <Button size="small" type="primary" style={{ background: '#0f766e', borderColor: '#0f766e' }} icon={<BookOutlined />} onClick={() => setReadingItem(item)}>Read</Button>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description={activeQuery ? `No results for “${activeQuery}”.` : 'No items yet.'} />
      )}

      {playingVideo && (
        <VideoPlayerModal
          visible={!!playingVideo}
          onClose={() => setPlayingVideo(null)}
          mediaUrl={playingVideo.translation?.body?.startsWith('http') ? playingVideo.translation.body : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
          contentItemId={playingVideo.id}
          title={playingVideo.translation?.title}
          isHi={lang === 'hi'}
        />
      )}

      {playingAudio && (
        <AudioPlayerModal
          visible={!!playingAudio}
          onClose={() => setPlayingAudio(null)}
          mediaUrl={playingAudio.url || (playingAudio.translation?.body?.startsWith('http') ? playingAudio.translation.body : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3')}
          contentItemId={playingAudio.id}
          title={playingAudio.title || playingAudio.translation?.title}
          tracks={playbackTracks}
          initialTrackIndex={playbackIndex}
          isHi={lang === 'hi'}
        />
      )}

      {readingItem && (
        <ReadingModeModal
          visible={!!readingItem}
          onClose={() => setReadingItem(null)}
          contentItemId={readingItem.id}
          title={readingItem.translation?.title}
          body={readingItem.translation?.body}
          translations={readingItem.translations}
          lang={lang}
          isPdf={readingItem.contentType === 'pdf' || readingItem.slug.includes('pdf')}
        />
      )}
    </div>
  );
}

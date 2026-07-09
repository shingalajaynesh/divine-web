import React, { useMemo, useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Button, Card, Col, Empty, Input, Row, Skeleton, Tag, Typography, List, Modal, Space, Divider, Badge } from 'antd';
import { 
  AudioOutlined, BookOutlined, ClockCircleOutlined, HeartOutlined, 
  PlayCircleOutlined, SearchOutlined, StarOutlined, PlusOutlined, 
  DeleteOutlined, CustomerServiceOutlined, DownloadOutlined,
  FilePdfOutlined
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
  REMOVE_PLAYLIST_ITEM_MUTATION,
  GET_RECOMMENDED_CONTENT_FEED_QUERY,
  GET_MY_LEARNING_PATHS_QUERY
} from '../graphql/operations';
import VideoPlayerModal from '../components/VideoPlayerModal';
import AudioPlayerModal from '../components/AudioPlayerModal';
import ReadingModeModal from '../components/ReadingModeModal';

const { Title, Paragraph, Text } = Typography;
const filters = [{ label: 'All', value: '' }, { label: 'Stories', value: 'story' }, { label: 'Audio', value: 'audio' }, { label: 'Video', value: 'video' }, { label: 'Meditation', value: 'meditation' }, { label: 'Yoga', value: 'yoga' }, { label: 'Affirmations', value: 'affirmation' }];
const views = [
  { label: 'Explore', value: 'explore' }, 
  { label: '🎓 Learning Paths', value: 'paths' }, 
  { label: 'Bookmarks', value: 'bookmark' }, 
  { label: 'Watch Later', value: 'watch_later' },
  { label: 'My Playlists', value: 'playlists' },
  { label: '📥 Downloads', value: 'downloads' }
];

const downloadableResources = [
  {
    id: 'res-1',
    title: 'Garbh Sanskar Daily Checklist',
    description: 'A comprehensive daily activity log for tracking physical, cognitive, emotional, and spiritual quotient milestones.',
    category: 'printable',
    fileSize: '1.2 MB',
    fileType: 'PDF Document',
    tags: ['General', 'Checklist', 'Daily Routine'],
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'res-2',
    title: 'Trimester 1 Diet Chart & Meal Planner',
    description: 'Nutritional food checklists, meal timings, healthy snack options, and hydration indexes for the first trimester.',
    category: 'pdf',
    fileSize: '2.4 MB',
    fileType: 'PDF Guidebook',
    tags: ['Trimester 1', 'Diet', 'Nutrition'],
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'res-3',
    title: 'Prenatal Yoga Guide & Safety Posters',
    description: 'Illustrated guides showcasing safe prenatal postures, breathing techniques, and trimester-wise precautions.',
    category: 'yoga',
    fileSize: '4.8 MB',
    fileType: 'PDF Poster',
    tags: ['Yoga', 'Asanas', 'Illustrated'],
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'res-4',
    title: 'Baby Kick Count Logging Chart',
    description: 'Printable log sheet designed to record fetal kick counts, movement frequencies, and activity bursts.',
    category: 'printable',
    fileSize: '850 KB',
    fileType: 'PDF Sheet',
    tags: ['Trimester 3', 'Tracker', 'Fetal Movement'],
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'res-5',
    title: 'Garbhini Postpartum Care Kit',
    description: 'A complete checklist guide details postpartum recovery rules, lactation tips, and maternal mental wellness tools.',
    category: 'kit',
    fileSize: '5.2 MB',
    fileType: 'PDF Toolkit',
    tags: ['Postpartum', 'Toolkit', 'Mother Care'],
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
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
  
  // Downloads center states
  const [selectedDownloadCategory, setSelectedDownloadCategory] = useState('');
  const [downloadCount, setDownloadCount] = useState(() => parseInt(localStorage.getItem('total_downloads_count') || '0'));

  // Queue playback states
  const [playbackTracks, setPlaybackTracks] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  // Queries
  const feed = useQuery(CONTENT_FEED_QUERY, { variables: { language: lang, contentType: type || null }, skip: view !== 'explore' || Boolean(activeQuery) });
  const [search, searchState] = useLazyQuery(SEARCH_CONTENT_QUERY, { fetchPolicy: 'network-only' });
  const recent = useQuery(RECENT_CONTENT_SEARCHES_QUERY, { fetchPolicy: 'cache-and-network' });
  const saved = useQuery(SAVED_CONTENT_QUERY, { variables: { language: lang, kind: view }, skip: ['explore', 'playlists', 'downloads', 'paths'].includes(view), fetchPolicy: 'cache-and-network' });
  
  const recommendedFeed = useQuery(GET_RECOMMENDED_CONTENT_FEED_QUERY, {
    variables: { language: lang, limit: 10 },
    skip: view !== 'explore',
    fetchPolicy: 'cache-and-network'
  });
  const learningPaths = useQuery(GET_MY_LEARNING_PATHS_QUERY, {
    variables: { language: lang },
    skip: view !== 'paths',
    fetchPolicy: 'cache-and-network'
  });
  
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
    if (['playlists', 'downloads', 'paths'].includes(view)) return [];
    return view !== 'explore' ? saved.data?.savedContent : activeQuery ? searchState.data?.searchContent : feed.data?.contentFeed;
  }, [view, saved.data, activeQuery, searchState.data, feed.data]);

  const loading = ['playlists', 'downloads', 'paths'].includes(view) ? false : (view !== 'explore' ? saved.loading : activeQuery ? searchState.loading : feed.loading);
  const error = ['playlists', 'downloads', 'paths'].includes(view) ? null : (view !== 'explore' ? saved.error : activeQuery ? searchState.error : feed.error);

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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
      {/* ─── Premium Hero Banner ─── */}
      <div style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(190, 18, 60, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%), linear-gradient(135deg, #fefce8 0%, #fff7ed 30%, #fff1f2 70%, #fdf2f8 100%)',
        borderRadius: 28,
        padding: 'clamp(24px, 5vw, 48px)',
        marginBottom: 32,
        border: '1px solid rgba(234, 223, 216, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(190, 18, 60, 0.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(190, 18, 60, 0.08)', borderRadius: 20, padding: '6px 16px', marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>📚</span>
            <Text strong style={{ color: 'var(--brand-maroon)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Divine Library</Text>
          </div>

          <Title level={2} style={{ margin: '0 0 8px 0', color: 'var(--brand-maroon-dark)', fontWeight: 900, fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Learn, Listen & Practice
          </Title>
          <Paragraph style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 520, margin: '0 auto 24px auto', lineHeight: 1.6 }}>
            Explore pregnancy exercises, curated audio wellness, guided meditations, and customized playlists for your journey.
          </Paragraph>

          {/* Search Bar */}
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <Input.Search
              size="large"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onSearch={runSearch}
              enterButton={<SearchOutlined />}
              placeholder="Search meditation, stories, yoga…"
              style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(63, 10, 17, 0.06)' }}
            />
          </div>

          {/* Recent Searches */}
          {recent.data?.recentContentSearches?.length ? (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Recent:</Text>
              {recent.data.recentContentSearches.slice(0, 5).map((item) => (
                <Button size="small" shape="round" key={item.id} onClick={() => runSearch(item.query)} style={{ fontSize: 11, borderColor: 'var(--line)' }}>{item.query}</Button>
              ))}
              <Button size="small" type="text" danger onClick={async () => { await clearRecent(); recent.refetch(); }} style={{ fontSize: 11 }}>Clear</Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ─── Navigation & Filters ─── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* View Navigation Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {views.map(v => (
            <button
              key={v.value}
              onClick={() => { setView(v.value); if (v.value !== 'explore') setActiveQuery(''); }}
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                border: view === v.value ? '2px solid var(--brand-maroon)' : '1px solid var(--line)',
                background: view === v.value ? 'var(--soft-maroon)' : '#fff',
                color: view === v.value ? 'var(--brand-maroon)' : 'var(--muted)',
                fontWeight: view === v.value ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Category Filter Chips (only on Explore) */}
        {view === 'explore' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => { setType(f.value); if (activeQuery) search({ variables: { query: activeQuery, language: lang, contentType: f.value || null } }); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 10,
                  border: type === f.value ? '2px solid var(--brand-saffron)' : '1px solid var(--line)',
                  background: type === f.value ? 'var(--soft-saffron)' : '#fff',
                  color: type === f.value ? '#b45309' : 'var(--muted)',
                  fontWeight: type === f.value ? 800 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {notice && <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fef2f2', borderRadius: 12, color: '#be123c', fontWeight: 600, fontSize: 13 }}>{notice}</div>}

      {/* ─── Content Area ─── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[1,2,3].map(i => <Card key={i} style={{ borderRadius: 20, border: '1px solid var(--line)' }}><Skeleton active paragraph={{ rows: 4 }} /></Card>)}
        </div>
      ) : error ? (
        <Card style={{ borderRadius: 24, padding: 48, textAlign: 'center', border: '1px solid var(--line)' }}>
          <Empty description="Library could not be loaded. Please try again." />
        </Card>
      ) : view === 'playlists' ? (
        /* ─── Playlists Workspace ─── */
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card style={{ borderRadius: 24, border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }} styles={{ body: { padding: 20 } }}>
              <Title level={5} style={{ margin: '0 0 16px 0', color: 'var(--brand-maroon-dark)' }}>My Playlists</Title>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Input
                  placeholder="New playlist name…"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onPressEnter={handleCreatePlaylist}
                  style={{ borderRadius: 10 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePlaylist} style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 10 }} />
              </div>
              <List
                dataSource={playlistData?.getMyPlaylists || []}
                renderItem={playlist => (
                  <List.Item
                    actions={[<Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeletePlaylist(playlist.id)} />]}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      padding: '10px 14px',
                      background: selectedPlaylistId === playlist.id ? 'var(--soft-maroon)' : 'transparent',
                      border: selectedPlaylistId === playlist.id ? '1px solid rgba(190, 18, 60, 0.15)' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      marginBottom: 4
                    }}
                  >
                    <List.Item.Meta
                      avatar={<CustomerServiceOutlined style={{ fontSize: 20, color: 'var(--brand-maroon)' }} />}
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
                title={<Title level={5} style={{ margin: 0, color: 'var(--brand-maroon-dark)' }}>{selectedPlaylist.name}</Title>}
                extra={
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    disabled={!selectedPlaylist.items?.length}
                    onClick={() => playEntirePlaylist(selectedPlaylist)}
                    style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 10 }}
                  >
                    Play All
                  </Button>
                }
                style={{ borderRadius: 24, border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}
              >
                <Paragraph type="secondary">{selectedPlaylist.description || 'Personal audio playlist'}</Paragraph>
                <Divider />
                <List
                  dataSource={selectedPlaylist.items || []}
                  locale={{ emptyText: 'No tracks yet. Browse content and click "+" to add.' }}
                  renderItem={(item, index) => (
                    <List.Item
                      actions={[
                        <Button
                          type="primary"
                          shape="circle"
                          icon={<PlayCircleOutlined />}
                          style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)' }}
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
                        avatar={<Tag color="volcano" style={{ borderRadius: 8 }}>{index + 1}</Tag>}
                        title={<Text strong>{item.contentItem.translation?.title}</Text>}
                        description={`${item.contentItem.slug} · ${item.contentItem.contentType}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ) : (
              <Card style={{ borderRadius: 24, border: '1px solid var(--line)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                <Empty description="Select a playlist from the left to manage or play tracks." />
              </Card>
            )}
          </Col>
        </Row>
      ) : view === 'downloads' ? (
        /* ─── Downloads Center ─── */
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #bbf7d0',
            marginBottom: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DownloadOutlined style={{ fontSize: 22, color: '#16a34a' }} />
              </div>
              <div>
                <Text strong style={{ color: '#15803d', fontSize: 15, display: 'block' }}>Garbh Sanskar Material Center</Text>
                <Text style={{ color: '#4ade80', fontSize: 12 }}>Premium downloadable guides & worksheets</Text>
              </div>
            </div>
            <Badge count={downloadCount} style={{ backgroundColor: '#16a34a' }}>
              <Tag color="green" style={{ borderRadius: 10, padding: '4px 12px', fontWeight: 700 }}>Downloads</Tag>
            </Badge>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {[
              { label: 'All Resources', value: '' },
              { label: 'PDF E-Books', value: 'pdf' },
              { label: 'Printable Worksheets', value: 'printable' },
              { label: 'Yoga Safety Guides', value: 'yoga' },
              { label: 'Wellness Kits', value: 'kit' }
            ].map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedDownloadCategory(cat.value)}
                style={{
                  padding: '6px 14px', borderRadius: 10,
                  border: selectedDownloadCategory === cat.value ? '2px solid #16a34a' : '1px solid var(--line)',
                  background: selectedDownloadCategory === cat.value ? '#f0fdf4' : '#fff',
                  color: selectedDownloadCategory === cat.value ? '#15803d' : 'var(--muted)',
                  fontWeight: selectedDownloadCategory === cat.value ? 800 : 500,
                  fontSize: 12, cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit'
                }}
              >{cat.label}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {downloadableResources
              .filter(res => !selectedDownloadCategory || res.category === selectedDownloadCategory)
              .map(res => (
                <Card
                  key={res.id}
                  hoverable
                  className="quick-action-card-premium"
                  style={{ borderRadius: 22, border: '1px solid var(--line)', background: '#fff' }}
                  styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', height: '100%' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fdf2f8', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#be123c' }}>
                      <FilePdfOutlined style={{ fontSize: 22 }} />
                    </div>
                    <Tag style={{ borderRadius: 8, fontSize: 10, fontWeight: 600 }}>{res.fileSize} · {res.fileType}</Tag>
                  </div>
                  <Title level={5} style={{ fontSize: 15, color: 'var(--brand-maroon-dark)', margin: '0 0 8px 0', lineHeight: 1.4 }}>{res.title}</Title>
                  <Paragraph type="secondary" style={{ fontSize: 12, flex: 1, marginBottom: 16, lineHeight: 1.6 }}>{res.description}</Paragraph>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                    {res.tags.map(tag => <Tag key={tag} style={{ borderRadius: 6, fontSize: 10 }}>{tag}</Tag>)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                    <Button style={{ flex: 1, borderRadius: 10 }} onClick={() => setReadingItem({ id: res.id, contentType: 'pdf', slug: res.title.toLowerCase().replace(/ /g, '-') + '.pdf', translation: { title: res.title, body: res.description }, translations: [{ language: 'en', title: res.title, body: res.description }] })}>Preview</Button>
                    <Button type="primary" icon={<DownloadOutlined />} style={{ flex: 1, background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 10 }} onClick={() => { const n = downloadCount + 1; setDownloadCount(n); localStorage.setItem('total_downloads_count', n.toString()); toast.success(`Downloading ${res.title}...`); window.open(res.url, '_blank'); }}>Download</Button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ) : view === 'paths' ? (
        /* ─── Learning Paths ─── */
        <div>
          {learningPaths.loading ? (
            <Card style={{ borderRadius: 24, border: '1px solid var(--line)' }}><Skeleton active /></Card>
          ) : learningPaths.data?.myLearningPaths?.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 24 }}>
              {learningPaths.data.myLearningPaths.map((path) => (
                <Card
                  key={path.id}
                  className="quick-action-card-premium"
                  style={{ borderRadius: 24, border: '1px solid var(--line)', background: '#fff' }}
                  styles={{ body: { padding: 24 } }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 32, background: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%)', width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {path.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <Title level={4} style={{ margin: 0, color: 'var(--brand-maroon-dark)', fontSize: 18 }}>{path.title}</Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>{path.items.length} structured milestones</Text>
                    </div>
                  </div>

                  <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{path.description}</Paragraph>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text strong style={{ fontSize: 12 }}>Curriculum Progress</Text>
                      <Text strong style={{ color: 'var(--brand-maroon)', fontSize: 12 }}>{path.progressPercent}%</Text>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${path.progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-maroon), #fda4af)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  <Divider style={{ margin: '16px 0' }} />
                  <Title level={5} style={{ fontSize: 13, marginBottom: 12, color: '#475569' }}>Learning Path Steps:</Title>

                  <List
                    dataSource={path.items}
                    renderItem={(item, index) => (
                      <List.Item
                        actions={[
                          ['video', 'audio'].includes(item.contentType) ? (
                            <Button size="small" type="primary" style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 8 }} icon={<PlayCircleOutlined />} onClick={() => { if (item.contentType === 'video') setPlayingVideo(item); else { setPlaybackTracks([]); setPlayingAudio(item); } }}>Play</Button>
                          ) : (
                            <Button size="small" type="primary" style={{ background: '#0f766e', borderColor: '#0f766e', borderRadius: 8 }} icon={<BookOutlined />} onClick={() => setReadingItem(item)}>Read</Button>
                          )
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Tag color={item.completed ? 'success' : 'default'} style={{ borderRadius: 8 }}>{item.completed ? '✓' : index + 1}</Tag>}
                          title={<Text strong style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#94a3b8' : '#1e293b' }}>{item.translation?.title}</Text>}
                          description={
                            <Space size={6}>
                              <Tag color="rose" style={{ fontSize: 10, borderRadius: 6 }}>{item.category?.name || item.contentType.toUpperCase()}</Tag>
                              {item.trimester1Safe && <Tag color="blue" style={{ fontSize: 10, borderRadius: 6 }}>T1 Safe</Tag>}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="No learning paths currently configured." />
          )}
        </div>
      ) : (
        /* ─── Explore / Saved Content ─── */
        <div>
          {/* Personalized Recommendations Rail */}
          {view === 'explore' && !activeQuery && recommendedFeed.data?.recommendedContentFeed?.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <Title level={4} style={{ margin: 0, color: 'var(--brand-maroon-dark)', fontSize: 18, fontWeight: 800 }}>✨ Recommended for You</Title>
                <Tag style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%)', color: 'var(--brand-maroon)', border: '1px solid rgba(190,18,60,0.15)', borderRadius: 8, fontWeight: 700, fontSize: 10 }}>Personalized</Tag>
              </div>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'thin' }}>
                {recommendedFeed.data.recommendedContentFeed.map(item => (
                  <div key={item.id} style={{ minWidth: 300, width: 300, flexShrink: 0 }}>
                    <Card
                      hoverable
                      className="quick-action-card-premium"
                      style={{ borderRadius: 20, border: '1px solid var(--line)', background: '#fff', height: '100%' }}
                      styles={{ body: { padding: 18, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: 'var(--brand-maroon)' }}>{iconFor(item.contentType)}</span>
                            <Tag color="rose" style={{ borderRadius: 6, fontSize: 10 }}>{item.category?.name || item.contentType.toUpperCase()}</Tag>
                          </div>
                          {item.completed && <Tag color="success" style={{ borderRadius: 6, fontSize: 10 }}>✓ Done</Tag>}
                        </div>
                        <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 14, lineHeight: 1.4 }}>{item.translation?.title}</Title>
                        <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ fontSize: 12, margin: 0, lineHeight: 1.5 }}>{item.translation?.summary || item.translation?.body}</Paragraph>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 14 }}>
                        <Space size={4}>
                          <Button size="small" shape="circle" disabled={bookmarkState.loading} icon={<StarOutlined />} onClick={() => save(item.id, 'bookmark')} />
                          {['video', 'audio'].includes(item.contentType) && (
                            <Button size="small" shape="circle" disabled={bookmarkState.loading} icon={<ClockCircleOutlined />} onClick={() => save(item.id, 'watch_later')} />
                          )}
                        </Space>
                        {['video', 'audio'].includes(item.contentType) ? (
                          <Button size="small" type="primary" style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 8 }} icon={<PlayCircleOutlined />} onClick={() => { if (item.contentType === 'video') setPlayingVideo(item); else { setPlaybackTracks([]); setPlayingAudio(item); } }}>Play</Button>
                        ) : (
                          <Button size="small" type="primary" style={{ background: '#0f766e', borderColor: '#0f766e', borderRadius: 8 }} icon={<BookOutlined />} onClick={() => setReadingItem(item)}>Read</Button>
                        )}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
              <Divider style={{ margin: '28px 0 0 0' }} />
            </div>
          )}

          {/* Main Content Grid */}
          {items?.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {items.map((item) => (
                <Card
                  key={item.id}
                  hoverable
                  className="quick-action-card-premium"
                  style={{ borderRadius: 22, border: '1px solid var(--line)', background: '#fff' }}
                  styles={{ body: { padding: 20, display: 'flex', flexDirection: 'column', height: '100%' } }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #fff1f2 0%, #fdf2f8 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--brand-maroon)' }}>
                      {iconFor(item.contentType)}
                    </div>
                    <Tag color="rose" style={{ borderRadius: 8, fontSize: 10 }}>{item.category?.name || item.contentType.toUpperCase()}</Tag>
                    <div style={{ flex: 1 }} />
                    <Text type="secondary" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.visibility === 'free' ? '🔓 Free' : `🔒 ${item.visibility}`}
                    </Text>
                  </div>

                  {/* Card Body */}
                  <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 15, lineHeight: 1.4, color: 'var(--brand-maroon-dark)' }}>
                    {item.translation?.title}
                  </Title>
                  <Paragraph ellipsis={{ rows: 3 }} type="secondary" style={{ fontSize: 12, flex: 1, marginBottom: 16, lineHeight: 1.6 }}>
                    {item.translation?.summary || item.translation?.body}
                  </Paragraph>

                  {/* Card Footer Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                    <Space size={4}>
                      {view === 'explore' ? (
                        <>
                          <Button size="small" shape="circle" disabled={bookmarkState.loading} icon={<StarOutlined />} onClick={() => save(item.id, 'bookmark')} />
                          {['video', 'audio'].includes(item.contentType) && (
                            <Button size="small" shape="circle" disabled={bookmarkState.loading} icon={<ClockCircleOutlined />} onClick={() => save(item.id, 'watch_later')} />
                          )}
                        </>
                      ) : (
                        <Button size="small" danger style={{ borderRadius: 8 }} onClick={() => save(item.id, view, false)}>Remove</Button>
                      )}
                    </Space>

                    {['video', 'audio'].includes(item.contentType) ? (
                      <Button size="small" type="primary" style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 8, fontWeight: 700 }} icon={<PlayCircleOutlined />} onClick={() => { if (item.contentType === 'video') setPlayingVideo(item); else { setPlaybackTracks([]); setPlayingAudio(item); } }}>Play</Button>
                    ) : (
                      <Button size="small" type="primary" style={{ background: '#0f766e', borderColor: '#0f766e', borderRadius: 8, fontWeight: 700 }} icon={<BookOutlined />} onClick={() => setReadingItem(item)}>Read</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card style={{ borderRadius: 24, padding: 48, textAlign: 'center', border: '1px solid var(--line)' }}>
              <Empty description={activeQuery ? `No results for "${activeQuery}".` : 'No items yet.'} />
            </Card>
          )}
        </div>
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

import React, { useMemo, useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Button, Card, Col, Empty, Input, Row, Segmented, Skeleton, Tag, Typography } from 'antd';
import { AudioOutlined, BookOutlined, ClockCircleOutlined, HeartOutlined, PlayCircleOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons';
import { CLEAR_RECENT_CONTENT_SEARCHES_MUTATION, CONTENT_FEED_QUERY, RECENT_CONTENT_SEARCHES_QUERY, SAVED_CONTENT_QUERY, SEARCH_CONTENT_QUERY, SET_CONTENT_BOOKMARK_MUTATION } from '../graphql/operations';
import VideoPlayerModal from '../components/VideoPlayerModal';
import AudioPlayerModal from '../components/AudioPlayerModal';
import ReadingModeModal from '../components/ReadingModeModal';

const { Title, Paragraph } = Typography;
const filters = [{ label: 'All', value: '' }, { label: 'Stories', value: 'story' }, { label: 'Audio', value: 'audio' }, { label: 'Video', value: 'video' }, { label: 'Meditation', value: 'meditation' }, { label: 'Yoga', value: 'yoga' }, { label: 'Affirmations', value: 'affirmation' }];
const views = [{ label: 'Explore', value: 'explore' }, { label: 'Bookmarks', value: 'bookmark' }, { label: 'Watch later', value: 'watch_later' }];
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
  const feed = useQuery(CONTENT_FEED_QUERY, { variables: { language: lang, contentType: type || null }, skip: view !== 'explore' || Boolean(activeQuery) });
  const [search, searchState] = useLazyQuery(SEARCH_CONTENT_QUERY, { fetchPolicy: 'network-only' });
  const recent = useQuery(RECENT_CONTENT_SEARCHES_QUERY, { fetchPolicy: 'cache-and-network' });
  const saved = useQuery(SAVED_CONTENT_QUERY, { variables: { language: lang, kind: view }, skip: view === 'explore', fetchPolicy: 'cache-and-network' });
  const [setBookmark, bookmarkState] = useMutation(SET_CONTENT_BOOKMARK_MUTATION);
  const [clearRecent] = useMutation(CLEAR_RECENT_CONTENT_SEARCHES_MUTATION);

  const runSearch = (value = query) => {
    const clean = value.trim();
    if (clean.length < 2) return;
    setQuery(clean); setActiveQuery(clean); setView('explore');
    search({ variables: { query: clean, language: lang, contentType: type || null } }).then(() => recent.refetch());
  };
  const items = useMemo(() => view !== 'explore' ? saved.data?.savedContent : activeQuery ? searchState.data?.searchContent : feed.data?.contentFeed, [view, saved.data, activeQuery, searchState.data, feed.data]);
  const loading = view !== 'explore' ? saved.loading : activeQuery ? searchState.loading : feed.loading;
  const error = view !== 'explore' ? saved.error : activeQuery ? searchState.error : feed.error;
  const save = async (contentItemId, kind, savedValue = true) => {
    await setBookmark({ variables: { input: { contentItemId, kind, saved: savedValue } } });
    setNotice(savedValue ? (kind === 'watch_later' ? 'Added to watch later.' : 'Bookmarked for you.') : 'Removed from your saved list.');
    if (view !== 'explore') saved.refetch();
  };

  return <div className="modern-library">
    <div className="library-heading"><Tag>DIVINE LIBRARY</Tag><Title>Learn, listen and connect</Title><Paragraph>Search original practices and save useful guidance for later.</Paragraph>
      <Input.Search className="library-search" size="large" value={query} onChange={(event) => setQuery(event.target.value)} onSearch={runSearch} enterButton={<SearchOutlined />} placeholder="Search meditation, stories, yoga…" />
      {recent.data?.recentContentSearches?.length ? <div className="recent-searches"><span>Recent</span>{recent.data.recentContentSearches.slice(0, 5).map((item) => <Button size="small" shape="round" key={item.id} onClick={() => runSearch(item.query)}>{item.query}</Button>)}<Button size="small" type="text" onClick={async () => { await clearRecent(); recent.refetch(); }}>Clear</Button></div> : null}
      <Segmented block options={views} value={view} onChange={(value) => { setView(value); if (value !== 'explore') setActiveQuery(''); }} />
      {view === 'explore' ? <Segmented block options={filters} value={type} onChange={(value) => { setType(value); if (activeQuery) search({ variables: { query: activeQuery, language: lang, contentType: value || null } }); }} /> : null}
      {notice ? <div className="library-notice" role="status">{notice}</div> : null}
    </div>
    {loading ? <Card><Skeleton active /></Card> : error ? <Empty description="Library could not be loaded." /> : items?.length ? <Row gutter={[16, 16]}>{items.map((item) => <Col xs={24} sm={12} lg={8} key={item.id}><Card className="library-content-card"><div className="library-content-icon">{iconFor(item.contentType)}</div><Tag>{item.category?.name || item.contentType}</Tag><Title level={4}>{item.translation?.title}</Title><Paragraph ellipsis={{ rows: 3 }}>{item.translation?.summary || item.translation?.body}</Paragraph><small>{item.visibility === 'free' ? 'Included' : `${item.visibility} access`}</small><div className="library-card-actions">{view === 'explore' ? <><Button disabled={bookmarkState.loading} icon={<StarOutlined />} onClick={() => save(item.id, 'bookmark')}>Save</Button>{['video', 'audio'].includes(item.contentType) ? <Button disabled={bookmarkState.loading} icon={<ClockCircleOutlined />} onClick={() => save(item.id, 'watch_later')}>Later</Button> : null}{['video', 'audio'].includes(item.contentType) ? <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => { if (item.contentType === 'video') setPlayingVideo(item); else setPlayingAudio(item); }}>Play</Button> : null}{['story', 'prayer', 'affirmation', 'article'].includes(item.contentType) ? <Button type="primary" icon={<BookOutlined />} onClick={() => setReadingItem(item)}>Read</Button> : null}</> : <><Button danger disabled={bookmarkState.loading} onClick={() => save(item.id, view, false)}>Remove</Button>{['video', 'audio'].includes(item.contentType) ? <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => { if (item.contentType === 'video') setPlayingVideo(item); else setPlayingAudio(item); }}>Play</Button> : null}{['story', 'prayer', 'affirmation', 'article'].includes(item.contentType) ? <Button type="primary" icon={<BookOutlined />} onClick={() => setReadingItem(item)}>Read</Button> : null}</>}</div></Card></Col>)}</Row> : <Empty description={activeQuery ? `No results for “${activeQuery}”.` : 'No saved content yet.'} />}

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
        mediaUrl={playingAudio.translation?.body?.startsWith('http') ? playingAudio.translation.body : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}
        contentItemId={playingAudio.id}
        title={playingAudio.translation?.title}
        isHi={lang === 'hi'}
      />
    )}

    {readingItem && (
      <ReadingModeModal
        visible={!!readingItem}
        onClose={() => setReadingItem(null)}
        title={readingItem.translation?.title}
        body={readingItem.translation?.body}
        translations={readingItem.translations}
        lang={lang}
      />
    )}
  </div>;
}

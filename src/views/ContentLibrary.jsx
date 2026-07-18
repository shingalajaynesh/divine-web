import React, { useMemo, useState, useEffect } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Col, Empty, Input, Row, Skeleton, Tag, Typography, List, Modal, Space, Divider, Badge } from 'antd';
import { 
  AudioOutlined, BookOutlined, ClockCircleOutlined, HeartOutlined, 
  PlayCircleOutlined, SearchOutlined, StarOutlined, PlusOutlined, 
  DeleteOutlined, CustomerServiceOutlined, DownloadOutlined,
  FilePdfOutlined, WifiOutlined
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
import {
  EnterpriseCard,
  EnterprisePageHeader,
  EnterpriseLoading,
  EnterpriseEmptyState,
  EnterpriseErrorState,
  getRoleTheme
} from '../shared/components';
import { enterpriseTokens } from '../shared/theme/enterpriseTokens';

const { Title, Paragraph, Text } = Typography;

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
  }
];

const iconFor = (type) => type === 'audio' ? <AudioOutlined /> : type === 'video' ? <PlayCircleOutlined /> : type === 'affirmation' ? <HeartOutlined /> : <BookOutlined />;

export default function ContentLibrary({ lang = 'en' }) {
  const isHi = lang === 'hi';
  const theme = getRoleTheme('MOTHER');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab can be: 'meditation', 'music', 'videos'
  const activeTab = searchParams.get('tab') || 'meditation';
  const [view, setView] = useState('explore');
  const [query, setQuery] = useState('');
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [readingItem, setReadingItem] = useState(null);

  // Map activeTab to type variable for GraphQL Content Feed
  const type = useMemo(() => {
    if (activeTab === 'meditation') return 'meditation';
    if (activeTab === 'music') return 'audio';
    if (activeTab === 'videos') return 'video';
    return '';
  }, [activeTab]);

  const { data: feedData, loading: feedLoading, error: feedError } = useQuery(CONTENT_FEED_QUERY, {
    variables: { type, search: query || null }
  });

  const { data: savedData, refetch: refetchSaved } = useQuery(SAVED_CONTENT_QUERY);
  const [setBookmark] = useMutation(SET_CONTENT_BOOKMARK_MUTATION, {
    onCompleted: () => refetchSaved()
  });

  const contentItems = feedData?.contentFeed || [];
  const bookmarks = savedData?.getMySavedContent || [];

  const handleToggleBookmark = async (id, isBookmarked) => {
    try {
      await setBookmark({
        variables: { contentItemId: id, bookmarkType: isBookmarked ? 'NONE' : 'BOOKMARK' }
      });
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <EnterprisePageHeader
        activeRole="MOTHER"
        kicker="Calming Media Hub"
        title="Garbh Sanskar Media Library"
        subtitle="Spotify-like auditory and visual guide for positive development"
      />

      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'meditation', label: isHi ? 'ध्यान (Meditation)' : 'Meditation' },
          { key: 'music', label: isHi ? 'संगीत (Music)' : 'Music Library' },
          { key: 'videos', label: isHi ? 'वीडियो (Videos)' : 'Videos' }
        ].map((t) => (
          <Button
            key={t.key}
            type={activeTab === t.key ? 'primary' : 'default'}
            onClick={() => setSearchParams({ tab: t.key })}
            style={{ borderRadius: '8px', fontWeight: 'bold' }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {feedLoading ? (
        <EnterpriseLoading type="card" count={3} />
      ) : feedError ? (
        <EnterpriseErrorState error={feedError} activeRole="MOTHER" />
      ) : contentItems.length > 0 ? (
        <Row gutter={[16, 16]}>
          {contentItems.map((item) => {
            const isBookmarked = bookmarks.some(b => b.id === item.id);
            return (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <EnterpriseCard activeRole="MOTHER">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <Tag color="rose" style={{ backgroundColor: '#fff1f2', borderColor: '#ffe4e6', color: theme.primaryColor }}>
                      {item.category || item.type}
                    </Tag>
                    <Button 
                      type="text" 
                      icon={isBookmarked ? <StarOutlined style={{ color: theme.accentColor }} /> : <StarOutlined />} 
                      onClick={() => handleToggleBookmark(item.id, isBookmarked)}
                    />
                  </div>

                  <Title level={5} style={{ margin: '0 0 8px 0', color: theme.textPrimary }}>
                    {item.title}
                  </Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px', height: '40px', overflow: 'hidden' }}>
                    {item.description || item.body}
                  </Paragraph>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      block
                      onClick={() => {
                        if (item.type === 'video') setPlayingVideo(item);
                        else if (item.type === 'audio' || item.type === 'meditation') setPlayingAudio(item);
                        else setReadingItem(item);
                      }}
                      style={{ borderRadius: '8px' }}
                    >
                      Play Now
                    </Button>
                  </div>
                </EnterpriseCard>
              </Col>
            );
          })}
        </Row>
      ) : (
        <EnterpriseEmptyState 
          title="No tracks found" 
          description="There are no items listed under this category at the moment." 
        />
      )}

      {/* Modals for media playback */}
      {playingVideo && (
        <VideoPlayerModal
          visible={!!playingVideo}
          onClose={() => setPlayingVideo(null)}
          mediaUrl={playingVideo.mediaUrl}
          dailyContentId={playingVideo.id}
          title={playingVideo.title}
          isHi={isHi}
        />
      )}

      {playingAudio && (
        <AudioPlayerModal
          visible={!!playingAudio}
          onClose={() => setPlayingAudio(null)}
          mediaUrl={playingAudio.mediaUrl}
          contentItemId={playingAudio.id}
          title={playingAudio.title}
          isHi={isHi}
        />
      )}

      {readingItem && (
        <ReadingModeModal
          visible={!!readingItem}
          onClose={() => setReadingItem(null)}
          title={readingItem.title}
          body={readingItem.body}
          lang={lang}
        />
      )}
    </div>
  );
}

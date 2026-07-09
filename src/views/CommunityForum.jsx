import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_FORUM_POSTS_QUERY, 
  GET_FORUM_GROUPS_QUERY,
  CREATE_FORUM_GROUP_MUTATION,
  ADD_FORUM_POST_MUTATION, 
  ADD_FORUM_COMMENT_MUTATION, 
  REACT_TO_POST_MUTATION,
  REPORT_POST_MUTATION, 
  REPORT_COMMENT_MUTATION 
} from '../graphql/operations';
import toast from 'react-hot-toast';
import { Card, Form, Input, Button, Avatar, Spin, Typography, Space, Divider, Select, Tag, Modal, Row, Col, List, Checkbox, Tabs } from 'antd';
import { MessageOutlined, SendOutlined, FlagOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const REACTION_TYPES = [
  { emoji: '👍', label: 'Like', value: 'LIKE' },
  { emoji: '❤️', label: 'Love', value: 'HEART' },
  { emoji: '😮', label: 'Wow', value: 'WOW' },
  { emoji: '😢', label: 'Sad', value: 'SAD' }
];

export default function CommunityForum({ t, lang }) {
  const isHi = lang === 'hi';

  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Groups and Posts Queries
  const { data: groupsData, loading: loadingGroups, refetch: refetchGroups } = useQuery(GET_FORUM_GROUPS_QUERY);
  const { data: postsData, loading: loadingPosts, refetch: refetchPosts } = useQuery(GET_FORUM_POSTS_QUERY, {
    variables: { 
      category: activeCategory === 'All' ? null : activeCategory,
      groupId: selectedGroupId
    }
  });

  // Mutations
  const [createForumGroup, { loading: creatingGroup }] = useMutation(CREATE_FORUM_GROUP_MUTATION, { onCompleted: () => refetchGroups() });
  const [addForumPost] = useMutation(ADD_FORUM_POST_MUTATION, { onCompleted: () => refetchPosts() });
  const [addForumComment] = useMutation(ADD_FORUM_COMMENT_MUTATION, { onCompleted: () => refetchPosts() });
  const [reactToPost] = useMutation(REACT_TO_POST_MUTATION, { onCompleted: () => refetchPosts() });
  const [reportPost] = useMutation(REPORT_POST_MUTATION, { onCompleted: () => refetchPosts() });
  const [reportComment] = useMutation(REPORT_COMMENT_MUTATION, { onCompleted: () => refetchPosts() });

  // Dialog / Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);

  // Report Modal States
  const [reportTarget, setReportTarget] = useState(null); // { type: 'POST'|'COMMENT', id: ID }
  const [reportReason, setReportReason] = useState('');

  // Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [commentText, setCommentText] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const categories = [
    { key: 'All', label: isHi ? 'सभी' : 'All' },
    { key: 'General', label: isHi ? 'सामान्य' : 'General' },
    { key: 'Trimester 1 Support', label: isHi ? 'तिमाही 1 सहायता' : 'Trimester 1 Support' },
    { key: 'Yoga & Fitness', label: isHi ? 'योग और फिटनेस' : 'Yoga & Fitness' },
    { key: 'Diet & Recipes', label: isHi ? 'आहार और रेसिपी' : 'Diet & Recipes' },
    { key: 'Baby Names', label: isHi ? 'बच्चों के नाम' : 'Baby Names' }
  ];

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      await createForumGroup({
        variables: {
          name: newGroupName,
          description: newGroupDesc,
          isPrivate: newGroupPrivate,
          coverUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74'
        }
      });
      setIsGroupModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupPrivate(false);
      toast.success(isHi ? "नया समुदाय समूह बनाया गया!" : "New community group channel created!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePostSubmit = async () => {
    if (!title || !content) return;
    setSubmitLoading(true);
    try {
      await addForumPost({ 
        variables: { 
          title, 
          content, 
          category: postCategory,
          groupId: selectedGroupId 
        } 
      });
      setTitle('');
      setContent('');
      toast.success(isHi ? "पोस्ट सफलतापूर्वक साझा की गई!" : "Community post shared successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentText[postId];
    if (!text) return;
    try {
      await addForumComment({ variables: { postId, content: text } });
      setCommentText({ ...commentText, [postId]: '' });
      toast.success(isHi ? "टिप्पणी पोस्ट की गई!" : "Comment posted successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReactToPost = async (postId, reaction) => {
    try {
      await reactToPost({ variables: { postId, reactionType: reaction } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitAbuseReport = async () => {
    if (!reportTarget) return;
    try {
      if (reportTarget.type === 'POST') {
        await reportPost({ variables: { postId: reportTarget.id, reason: reportReason } });
      } else {
        await reportComment({ variables: { commentId: reportTarget.id, reason: reportReason } });
      }
      toast.success(isHi ? "रिपोर्ट दर्ज की गई।" : "Content reported successfully.");
      setReportTarget(null);
      setReportReason('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getReactionCount = (stats, type) => {
    const item = (stats || []).find(s => s.type === type);
    return item ? item.count : 0;
  };

  const groups = groupsData?.getForumGroups || [];
  const posts = postsData?.getForumPosts || [];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <Row gutter={[24, 24]}>
        
        {/* SIDEBAR: COMMUNITY CHANNELS / GROUPS */}
        <Col xs={24} md={6}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '13px', color: '#1e293b' }}>
                👥 {isHi ? "समुदाय समूह" : "Forum Groups"}
              </Text>
              <Button 
                type="text" 
                size="small" 
                icon={<PlusOutlined />} 
                onClick={() => setIsGroupModalOpen(true)}
                style={{ color: '#be123c' }}
              />
            </div>

            <List
              loading={loadingGroups}
              dataSource={[{ id: null, name: isHi ? '🌐 सार्वजनिक मंच (General)' : '🌐 All Discussions' }, ...groups]}
              renderItem={group => (
                <List.Item 
                  onClick={() => setSelectedGroupId(group.id)}
                  style={{ 
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    border: 0,
                    background: selectedGroupId === group.id ? '#ffe4e6' : 'transparent',
                    color: selectedGroupId === group.id ? '#be123c' : '#475569',
                    fontWeight: selectedGroupId === group.id ? 'bold' : 'normal'
                  }}
                >
                  <Text style={{ fontSize: '12px', color: selectedGroupId === group.id ? '#be123c' : '#475569' }}>
                    {group.name}
                  </Text>
                </List.Item>
              )}
            />
          </div>
        </Col>

        {/* MAIN CHAT FEED */}
        <Col xs={24} md={18}>
          <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ margin: 0 }}>💬 {isHi ? "मातृ समुदाय मंच" : "Mother-to-Mother Community Forum"}</Title>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
              {isHi 
                ? "अन्य गर्भवती माताओं से जुड़ें, अपनी यात्रा साझा करें और सलाह लें।" 
                : "Connect with other expecting mothers, share your journey, and seek advice."}
            </Paragraph>
          </div>

          {/* Ask the Community Form */}
          <Card 
            style={{ 
              borderRadius: 16, 
              background: '#f8fafc', 
              border: '1px solid #f1f5f9',
              marginBottom: '32px' 
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <Title level={5} style={{ margin: '0 0 16px 0', fontSize: '14px' }}>💬 {isHi ? "समुदाय से पूछें" : "Ask the Community"}</Title>
            <Form layout="vertical" onFinish={handlePostSubmit}>
              <Form.Item required style={{ marginBottom: '12px' }}>
                <Select 
                  value={postCategory} 
                  onChange={setPostCategory} 
                  style={{ width: '100%' }}
                  size="large"
                >
                  {categories.filter(c => c.key !== 'All').map(c => (
                    <Option key={c.key} value={c.key}>{c.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item required style={{ marginBottom: '12px' }}>
                <Input 
                  placeholder={isHi ? "आपकी पोस्ट का शीर्षक..." : "What is on your mind?"} 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  size="large"
                />
              </Form.Item>
              <Form.Item required>
                <TextArea 
                  placeholder={isHi ? "अपनी गर्भावस्था का अनुभव यहाँ साझा करें..." : "Describe your query or share your pregnancy experience..."} 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  rows={3} 
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitLoading}
                  icon={<SendOutlined />}
                  style={{ background: '#be123c', borderColor: '#be123c' }}
                >
                  {isHi ? "प्रश्न पोस्ट करें" : "Post Question"}
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Category Tabs filter */}
          <Tabs 
            activeKey={activeCategory} 
            onChange={setActiveCategory}
            style={{ marginBottom: '24px' }}
            items={categories.map(c => ({
              key: c.key,
              label: c.label
            }))}
          />

          {/* Posts List */}
          {loadingPosts ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin description={isHi ? "चर्चाएं लोड हो रही हैं..." : "Loading community conversations..."} />
            </div>
          ) : posts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {posts.map((post) => (
                <Card key={post.id} style={{ borderRadius: 20, border: '1px solid #e2e8f0' }} styles={{ body: { padding: '24px' } }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <Space align="center">
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#ffe4e6', color: '#be123c' }} />
                      <div>
                        <Text strong style={{ display: 'block', fontSize: '13px' }}>{post.user?.displayName || 'Mother'}</Text>
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </div>
                    </Space>

                    <Space>
                      {post.group && <Tag color="blue">👥 {post.group.name}</Tag>}
                      <Tag color="magenta">{post.category}</Tag>
                      <Button 
                        type="text" 
                        icon={<FlagOutlined />} 
                        onClick={() => setReportTarget({ type: 'POST', id: post.id })}
                        danger
                        title={isHi ? "रिपोर्ट करें" : "Report"}
                      />
                    </Space>
                  </div>

                  <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#881337' }}>{post.title}</Title>
                  <Paragraph style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', margin: '0 0 16px 0' }}>
                    {post.content}
                  </Paragraph>

                  {/* Emoji Reactions bar */}
                  <Space size="middle" style={{ marginBottom: '16px', background: '#f8fafc', padding: '8px 16px', borderRadius: '12px' }}>
                    {REACTION_TYPES.map((react) => {
                      const count = getReactionCount(post.reactionStats, react.value);
                      const active = post.userReaction === react.value;
                      return (
                        <Button 
                          key={react.value}
                          type={active ? 'primary' : 'text'}
                          onClick={() => handleReactToPost(post.id, react.value)}
                          style={{
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            background: active ? '#ffe4e6' : 'transparent',
                            borderColor: active ? '#f43f5e' : 'transparent',
                            color: active ? '#be123c' : '#475569'
                          }}
                        >
                          {react.emoji} {count > 0 ? count : ''}
                        </Button>
                      );
                    })}
                  </Space>

                  <Divider style={{ margin: '16px 0' }} />

                  {/* Comments Block */}
                  <div>
                    <Text strong type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                      {isHi ? `टिप्पणियाँ (${post.comments?.length || 0})` : `Comments (${post.comments?.length || 0})`}
                    </Text>

                    {post.comments && post.comments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        {post.comments.map((comment) => (
                          <div key={comment.id} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', marginLeft: '16px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <Text strong style={{ fontSize: '12px', color: '#1e293b' }}>
                                {comment.user?.displayName || 'Mother'}
                              </Text>
                              <Button 
                                type="text" 
                                size="small" 
                                icon={<FlagOutlined style={{ fontSize: '10px' }} />} 
                                onClick={() => setReportTarget({ type: 'COMMENT', id: comment.id })}
                                danger
                              />
                            </div>
                            <Text style={{ fontSize: '12px', color: '#475569', display: 'block' }}>
                              {comment.content}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write Comment */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', marginTop: '12px' }}>
                      <Input 
                        placeholder={isHi ? "एक टिप्पणी लिखें..." : "Write a comment..."} 
                        value={commentText[post.id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                        onPressEnter={() => handleCommentSubmit(post.id)}
                      />
                      <Button 
                        type="primary" 
                        onClick={() => handleCommentSubmit(post.id)}
                        icon={<MessageOutlined />}
                        style={{ background: '#be123c', borderColor: '#be123c' }}
                      >
                        {isHi ? "टिप्पणी दें" : "Reply"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0', margin: 0, fontStyle: 'italic' }}>
              {isHi ? "कोई पोस्ट उपलब्ध नहीं है।" : "No posts available yet. Be the first to start the discussion!"}
            </Paragraph>
          )}
        </Col>
      </Row>

      {/* CREATE GROUP MODAL */}
      <Modal
        title={isHi ? "नया समुदाय समूह जोड़ें" : "Add New Forum Group Channel"}
        open={isGroupModalOpen}
        onCancel={() => setIsGroupModalOpen(false)}
        onOk={handleCreateGroup}
        confirmLoading={creatingGroup}
        okButtonProps={{ style: { background: '#be123c', borderColor: '#be123c' } }}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Group Channel Name *" required>
            <Input 
              placeholder="e.g. Trimester 3 Mothers" 
              value={newGroupName} 
              onChange={e => setNewGroupName(e.target.value)} 
            />
          </Form.Item>
          <Form.Item label="Description">
            <TextArea 
              placeholder="Explain the purpose of this sub-community..." 
              value={newGroupDesc} 
              onChange={e => setNewGroupDesc(e.target.value)} 
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Access Mode">
            <Checkbox 
              checked={newGroupPrivate} 
              onChange={e => setNewGroupPrivate(e.target.checked)}
            >
              Private Channel (Invitation Only)
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* ABUSE REPORT MODAL */}
      <Modal
        title={isHi ? "अभद्र / गलत सामग्री रिपोर्ट करें" : "Report Content Violation"}
        open={reportTarget !== null}
        onCancel={() => { setReportTarget(null); setReportReason(''); }}
        onOk={submitAbuseReport}
        okText="Submit Report"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 16 }}>
          <Paragraph style={{ fontSize: '13px' }}>
            Please describe the violation reason (e.g. spam, abuse, incorrect medical advice) so that our moderation team can review this item.
          </Paragraph>
          <TextArea 
            placeholder="Type reason here..." 
            value={reportReason} 
            onChange={e => setReportReason(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </Card>
  );
}

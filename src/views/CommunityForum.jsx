import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_FORUM_POSTS_QUERY, 
  ADD_FORUM_POST_MUTATION, 
  ADD_FORUM_COMMENT_MUTATION, 
  TOGGLE_POST_LIKE_MUTATION, 
  REPORT_POST_MUTATION, 
  REPORT_COMMENT_MUTATION 
} from '../graphql/operations';
import toast from 'react-hot-toast';
import { Card, Form, Input, Button, Avatar, Spin, Typography, Space, Divider, Select, Tabs, Tag } from 'antd';
import { MessageOutlined, SendOutlined, LikeOutlined, LikeFilled, FlagOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function CommunityForum({ t, lang }) {
  const isHi = lang === 'hi';

  const [activeCategory, setActiveCategory] = useState('All');
  
  const { data, loading, refetch } = useQuery(GET_FORUM_POSTS_QUERY, {
    variables: { category: activeCategory }
  });

  const [addForumPost] = useMutation(ADD_FORUM_POST_MUTATION, { onCompleted: () => refetch() });
  const [addForumComment] = useMutation(ADD_FORUM_COMMENT_MUTATION, { onCompleted: () => refetch() });
  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE_MUTATION, { onCompleted: () => refetch() });
  const [reportPost] = useMutation(REPORT_POST_MUTATION, { onCompleted: () => refetch() });
  const [reportComment] = useMutation(REPORT_COMMENT_MUTATION, { onCompleted: () => refetch() });

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

  const handlePostSubmit = async () => {
    if (!title || !content) return;
    setSubmitLoading(true);
    try {
      await addForumPost({ 
        variables: { title, content, category: postCategory } 
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

  const handleLikeToggle = async (postId) => {
    try {
      await togglePostLike({ variables: { postId } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReportPost = async (postId) => {
    try {
      await reportPost({ variables: { postId } });
      toast.success(isHi ? "सामग्री रिपोर्ट की गई" : "Post flagged for moderation review.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReportComment = async (commentId) => {
    try {
      await reportComment({ variables: { commentId } });
      toast.success(isHi ? "टिप्पणी रिपोर्ट की गई" : "Comment flagged for moderation review.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
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
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin description={isHi ? "चर्चाएं लोड हो रही हैं..." : "Loading community conversations..."} />
        </div>
      ) : data?.getForumPosts && data.getForumPosts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {data.getForumPosts.map((post) => (
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
                  <Tag color="magenta">{post.category}</Tag>
                  <Button 
                    type="text" 
                    icon={<FlagOutlined />} 
                    onClick={() => handleReportPost(post.id)}
                    danger
                    title={isHi ? "रिपोर्ट करें" : "Report"}
                  />
                </Space>
              </div>

              <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#881337' }}>{post.title}</Title>
              <Paragraph style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', margin: '0 0 16px 0' }}>
                {post.content}
              </Paragraph>

              {/* Likes/Reactions bar */}
              <Space style={{ marginBottom: '16px' }}>
                <Button 
                  type="text" 
                  onClick={() => handleLikeToggle(post.id)}
                  icon={post.isLiked ? <LikeFilled style={{ color: '#be123c' }} /> : <LikeOutlined />}
                  style={{ fontWeight: 'bold' }}
                >
                  {post.likesCount} {isHi ? "पसंद" : "Likes"}
                </Button>
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
                            onClick={() => handleReportComment(comment.id)}
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
    </Card>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_FORUM_POSTS_QUERY, ADD_FORUM_POST_MUTATION, ADD_FORUM_COMMENT_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';
import { Card, Form, Input, Button, Avatar, Spin, Typography, Space, Divider } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function CommunityForum({ t }) {
  const { data, loading, refetch } = useQuery(GET_FORUM_POSTS_QUERY);
  const [addForumPost] = useMutation(ADD_FORUM_POST_MUTATION, { onCompleted: () => refetch() });
  const [addForumComment] = useMutation(ADD_FORUM_COMMENT_MUTATION, { onCompleted: () => refetch() });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [commentText, setCommentText] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const handlePostSubmit = async () => {
    if (!title || !content) return;
    setSubmitLoading(true);
    try {
      await addForumPost({ variables: { title, content } });
      setTitle('');
      setContent('');
      toast.success("Community post shared successfully!");
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
      toast.success("Comment posted successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>💬 Mother-to-Mother Community Forum</Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          Connect with other expecting mothers, share your journey, and seek advice
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
        <Title level={5} style={{ margin: '0 0 16px 0', fontSize: '14px' }}>💬 Ask the Community</Title>
        <Form layout="vertical" onFinish={handlePostSubmit}>
          <Form.Item required>
            <Input 
              placeholder="What is on your mind?" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              size="large"
            />
          </Form.Item>
          <Form.Item required>
            <TextArea 
              placeholder="Describe your query or share your pregnancy experience..." 
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
            >
              Post Question
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Posts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin description="Loading community conversations..." />
        </div>
      ) : data?.getForumPosts && data.getForumPosts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {data.getForumPosts.map((post) => (
            <Card key={post.id} style={{ borderRadius: 16, border: '1px solid #f1f5f9' }} styles={{ body: { padding: '24px' } }}>
              <Space style={{ marginBottom: '16px' }} align="center">
                <Avatar style={{ backgroundColor: '#f97316' }}>
                  {post.user?.displayName?.[0]?.toUpperCase() || 'M'}
                </Avatar>
                <div>
                  <Text strong style={{ display: 'block', fontSize: '13px' }}>{post.user?.displayName || 'Mother'}</Text>
                  <Text type="secondary" style={{ fontSize: '10px' }}>
                    {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </div>
              </Space>

              <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{post.title}</Title>
              <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569' }}>
                {post.content}
              </Paragraph>

              <Divider style={{ margin: '16px 0' }} />

              {/* Comments Block */}
              <div>
                <Text strong type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  Comments ({post.comments?.length || 0})
                </Text>

                {post.comments && post.comments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {post.comments.map((comment) => (
                      <div key={comment.id} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', marginLeft: '16px' }}>
                        <Text strong style={{ fontSize: '12px', display: 'block', color: '#1e293b' }}>
                          {comment.user?.displayName || 'Mother'}
                        </Text>
                        <Text style={{ fontSize: '12px', color: '#475569', marginTop: '2px', display: 'block' }}>
                          {comment.content}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write Comment */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', marginTop: '12px' }}>
                  <Input 
                    placeholder="Write a comment..." 
                    value={commentText[post.id] || ''}
                    onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                    onPressEnter={() => handleCommentSubmit(post.id)}
                  />
                  <Button 
                    type="primary" 
                    onClick={() => handleCommentSubmit(post.id)}
                    icon={<MessageOutlined />}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0', margin: 0, fontStyle: 'italic' }}>
          No posts available yet. Be the first to start the discussion!
        </Paragraph>
      )}
    </Card>
  );
}

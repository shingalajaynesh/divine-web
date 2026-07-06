import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CONTENT_LIBRARY_QUERY } from '../graphql/operations';
import { Card, Tabs, Spin, Button, Typography, Tag, Row, Col } from 'antd';
import { BookOutlined, PlayCircleOutlined, CustomerServiceOutlined, MessageOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function ContentLibrary({ t }) {
  const [category, setCategory] = useState('story');
  const { data, loading } = useQuery(GET_CONTENT_LIBRARY_QUERY, {
    variables: { category }
  });

  const categories = [
    { key: 'story', label: '📖 Stories' },
    { key: 'video', label: '🎥 Videos' },
    { key: 'music', label: '🎵 Lullabies' },
    { key: 'yoga', label: '🧘‍♀️ Yoga' },
    { key: 'recipe', label: '🥗 Recipes' },
    { key: 'mantra', label: '🕉️ Mantras' },
    { key: 'article', label: '📚 Articles' }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>📚 Content Library</Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          Explore curated prenatal resources, daily logs, and meditation material
        </Paragraph>
      </div>

      <Tabs 
        activeKey={category} 
        onChange={(key) => setCategory(key)}
        items={categories}
        type="card"
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin description="Loading library resources..." />
        </div>
      ) : data?.getContentLibrary && data.getContentLibrary.length > 0 ? (
        <Row gutter={[16, 16]}>
          {data.getContentLibrary.map((item) => (
            <Col xs={24} sm={12} key={item.id}>
              <Card 
                style={{ borderRadius: 16, height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' } }}
              >
                <div>
                  <Tag color="orange" style={{ fontWeight: 'bold', marginBottom: '8px' }}>Day {item.dayNumber}</Tag>
                  <Title level={5} style={{ margin: '4px 0 8px 0', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0, lineHeight: 1.5 }} ellipsis={{ rows: 3 }}>
                    {item.body}
                  </Paragraph>
                </div>
                {item.mediaUrl && (
                  <Button 
                    type="link" 
                    href={item.mediaUrl} 
                    target="_blank" 
                    style={{ padding: 0, textAlign: 'left', fontWeight: 'bold' }}
                  >
                    View Attachment →
                  </Button>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0', margin: 0, fontStyle: 'italic' }}>
          No library items uploaded under this category yet.
        </Paragraph>
      )}
    </Card>
  );
}

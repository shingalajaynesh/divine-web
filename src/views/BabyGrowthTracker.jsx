import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_BABY_DEVELOPMENT_QUERY } from '../graphql/operations';
import { Card, Select, Typography, Row, Col, Tag, Spin, Image, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function BabyGrowthTracker({ user, t }) {
  const [selectedWeek, setSelectedWeek] = useState(user.currentWeek || 1);
  const { data, loading } = useQuery(GET_BABY_DEVELOPMENT_QUERY, {
    variables: { weekNumber: selectedWeek }
  });

  const baby = data?.getBabyDevelopment;

  const weekOptions = Array.from({ length: 40 }, (_, i) => i + 1).map((w) => ({
    value: w,
    label: `Week ${w} ${w === user.currentWeek ? '(Current)' : ''}`
  }));

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>👶 Weekly Baby Development Tracker</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
            Follow your baby's physical development and growth milestones week-by-week
          </Paragraph>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Text strong type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Select Week:</Text>
          <Select 
            value={selectedWeek} 
            onChange={setSelectedWeek} 
            options={weekOptions} 
            style={{ width: 160 }}
            size="large"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin description="Loading baby development milestones..." />
        </div>
      ) : baby ? (
        <Card 
          style={{ 
            borderRadius: 20, 
            background: 'linear-gradient(135deg, #fffcf9 0%, #fffbf0 100%)',
            border: '1px solid #fef3c7' 
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <Row align="middle" gutter={[24, 24]}>
            <Col xs={24} md={14}>
              <Tag color="orange" style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px' }}>Week {baby.weekNumber}</Tag>
              
              <Title level={3} style={{ margin: '16px 0 4px 0', color: '#1e293b' }}>
                Size: {baby.size}
              </Title>
              {baby.weight && (
                <Text strong style={{ color: '#f97316', fontSize: '14px' }}>
                  Average Weight: {baby.weight}
                </Text>
              )}
              
              <Divider style={{ margin: '16px 0' }} />
              
              <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Development Milestones:</Title>
              <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                {baby.milestone}
              </Paragraph>
            </Col>

            <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'center' }}>
              {baby.imageUrl ? (
                <Image 
                  src={baby.imageUrl} 
                  alt="Baby growth milestone illustration" 
                  style={{ maxHeight: 200, objectFit: 'contain', borderRadius: 16 }}
                  preview={false}
                />
              ) : (
                <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#fffbeb', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                  🌱
                </div>
              )}
            </Col>
          </Row>
        </Card>
      ) : (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0', margin: 0, fontStyle: 'italic' }}>
          No weekly milestone details saved for Week {selectedWeek} yet.
        </Paragraph>
      )}
    </Card>
  );
}

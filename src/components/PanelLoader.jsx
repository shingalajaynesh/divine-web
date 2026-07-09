import React from 'react';
import { Card, Col, Row, Skeleton, Space, Typography } from 'antd';

const { Text } = Typography;

export default function PanelLoader({
  title = 'Loading dashboard',
  subtitle = 'Preparing your workspace...',
  cards = 4,
}) {
  return (
    <div style={{ padding: '8px 0 24px' }}>
      <Space orientation="vertical" size={18} style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 12px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6A1320 0%, #B45309 100%)',
              boxShadow: '0 10px 24px rgba(106, 19, 32, 0.18)',
            }}
          />
          <Text strong style={{ display: 'block', fontSize: 16, color: '#1f2937' }}>{title}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>{subtitle}</Text>
        </div>

        <Row gutter={[16, 16]}>
          {Array.from({ length: cards }).map((_, index) => (
            <Col xs={24} sm={12} md={cards >= 4 ? 6 : 12} key={index}>
              <Card style={{ borderRadius: 18 }}>
                <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ borderRadius: 18 }}>
          <Skeleton active paragraph={{ rows: 5 }} title={{ width: '35%' }} />
        </Card>
      </Space>
    </div>
  );
}

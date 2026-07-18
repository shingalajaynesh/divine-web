import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_BABY_DEVELOPMENT_QUERY } from '../graphql/operations';
import { Select, Typography, Row, Col, Tag, Image, Divider } from 'antd';
import {
  EnterpriseCard,
  EnterprisePageHeader,
  EnterpriseLoading,
  EnterpriseEmptyState,
  getRoleTheme
} from '../shared/components';
import { enterpriseTokens } from '../shared/theme/enterpriseTokens';

const { Title, Paragraph, Text } = Typography;

export default function BabyGrowthTracker({ user, t }) {
  const [selectedWeek, setSelectedWeek] = useState(user.currentWeek || 1);
  const theme = getRoleTheme('MOTHER');

  const { data, loading } = useQuery(GET_BABY_DEVELOPMENT_QUERY, {
    variables: { weekNumber: selectedWeek }
  });

  const baby = data?.getBabyDevelopment;

  const weekOptions = Array.from({ length: 40 }, (_, i) => i + 1).map((w) => ({
    value: w,
    label: `Week ${w} ${w === user.currentWeek ? '(Current)' : ''}`
  }));

  const weekSelect = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Text strong style={{ color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.xs }}>
        SELECT WEEK:
      </Text>
      <Select 
        value={selectedWeek} 
        onChange={setSelectedWeek} 
        options={weekOptions} 
        style={{ width: 150 }}
      />
    </div>
  );

  return (
    <div>
      <EnterprisePageHeader
        activeRole="MOTHER"
        title="My Pregnancy Growth"
        subtitle="Follow your baby's weekly development and important milestones."
        actions={weekSelect}
      />

      {loading ? (
        <EnterpriseLoading type="card" count={1} />
      ) : baby ? (
        <EnterpriseCard activeRole="MOTHER" hoverable={false}>
          <Row align="middle" gutter={[24, 24]}>
            <Col xs={24} md={14}>
              <Tag color="rose" style={{ fontWeight: 'bold', color: theme.primaryColor, backgroundColor: '#fff1f2', borderColor: '#ffe4e6', borderRadius: '8px' }}>
                Week {baby.weekNumber}
              </Tag>
              
              <Title level={3} style={{ margin: '16px 0 4px 0', color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.bold }}>
                Size: {baby.size}
              </Title>
              {baby.weight && (
                <Text strong style={{ color: theme.accentColor, fontSize: enterpriseTokens.typography.sizes.sm }}>
                  Average Weight: {baby.weight}
                </Text>
              )}
              
              <Divider style={{ margin: '16px 0' }} />
              
              <Title level={5} style={{ margin: '0 0 8px 0', fontSize: enterpriseTokens.typography.sizes.sm, color: theme.textPrimary }}>
                Development Milestones:
              </Title>
              <Paragraph style={{ fontSize: enterpriseTokens.typography.sizes.sm, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
                {baby.milestone || baby.description}
              </Paragraph>
              
              <div style={{ marginTop: '20px' }}>
                <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                  * This content is for general wellness education and does not replace advice from your doctor.
                </Text>
              </div>
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
                <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#fff5f5', border: '1px solid #ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                  👶
                </div>
              )}
            </Col>
          </Row>
        </EnterpriseCard>
      ) : (
        <EnterpriseEmptyState
          activeRole="MOTHER"
          title={`No data for Week ${selectedWeek}`}
          description="Development guidance is not available for this week."
        />
      )}
    </div>
  );
}

import React from 'react';
import { Skeleton, Row, Col } from 'antd';
import EnterpriseCard from './EnterpriseCard';
import { enterpriseTokens } from '../theme/enterpriseTokens';

export default function EnterpriseLoading({ type = 'card', count = 1, activeRole = 'MOTHER' }) {
  if (type === 'card') {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: count }).map((_, idx) => (
          <Col xs={24} sm={12} md={8} key={idx}>
            <EnterpriseCard activeRole={activeRole} hoverable={false}>
              <Skeleton active paragraph={{ rows: 2 }} title={{ width: '40%' }} />
            </EnterpriseCard>
          </Col>
        ))}
      </Row>
    );
  }

  if (type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: enterpriseTokens.spacing.md }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} style={{ padding: enterpriseTokens.spacing.md, borderBottom: '1px solid #f3f4f6' }}>
            <Skeleton active paragraph={{ rows: 1 }} avatar title={{ width: '20%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: enterpriseTokens.spacing.xl, textAlign: 'center' }}>
      <Skeleton active />
    </div>
  );
}

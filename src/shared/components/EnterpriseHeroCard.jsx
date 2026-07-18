import React from 'react';
import { Typography, Row, Col } from 'antd';
import EnterpriseCard from './EnterpriseCard';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

const { Title, Paragraph } = Typography;

export default function EnterpriseHeroCard({
  greeting = 'Welcome back',
  title,
  subtitle,
  illustration,
  activeRole = 'MOTHER',
  gradient,
  ...props
}) {
  const theme = getRoleTheme(activeRole);
  
  // Custom calming pastel gradients for Mother layout
  const background = gradient || (activeRole === 'MOTHER' 
    ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' 
    : theme.bgContainer);

  return (
    <EnterpriseCard
      activeRole={activeRole}
      style={{
        background,
        border: 'none',
        marginBottom: enterpriseTokens.spacing.lg
      }}
      hoverable={false}
      {...props}
    >
      <Row align="middle" gutter={[24, 24]}>
        <Col xs={24} md={illustration ? 16 : 24}>
          <span style={{ 
            color: theme.primaryColor, 
            fontWeight: enterpriseTokens.typography.weights.semiBold, 
            fontSize: enterpriseTokens.typography.sizes.sm,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {greeting}
          </span>
          <Title level={2} style={{ margin: '4px 0 8px 0', color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.bold }}>
            {title}
          </Title>
          {subtitle && (
            <Paragraph style={{ margin: 0, color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.md }}>
              {subtitle}
            </Paragraph>
          )}
        </Col>
        {illustration && (
          <Col xs={24} md={8} style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="hero-illustration-wrapper" style={{ maxHeight: '120px' }}>
              {illustration}
            </div>
          </Col>
        )}
      </Row>
    </EnterpriseCard>
  );
}

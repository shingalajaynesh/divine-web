import React from 'react';
import { Typography, Row, Col } from 'antd';
import EnterpriseCard from './EnterpriseCard';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';
import { useViewport } from '../hooks/useViewport';

const { Title, Paragraph } = Typography;

export default function EnterpriseHeroCard({
  greeting = 'Welcome back',
  title,
  subtitle,
  quote,
  illustration,
  activeRole = 'MOTHER',
  gradient,
  ...props
}) {
  const theme = getRoleTheme(activeRole);
  const { isMobile } = useViewport();

  // Custom calming pastel gradients for Mother layout
  const background = gradient || (activeRole === 'MOTHER'
    ? 'radial-gradient(circle at top right, rgba(255,182,193,0.18), transparent 35%), radial-gradient(circle at bottom left, rgba(255,228,196,0.22), transparent 40%), linear-gradient(135deg, #fffefb 0%, #fff7f2 30%, #ffe9e6 70%, #ffdbe3 100%)'
    : theme.bgContainer);

  return (
    <EnterpriseCard
      activeRole={activeRole}
      className={`pregnancy-hero-card ${activeRole === 'MOTHER' ? 'pregnancy-hero-card' : ''}`}
      style={{
        background,
        border: 'none',
        marginBottom: enterpriseTokens.spacing.lg
      }}
      hoverable={false}
      {...props}
    >
      <Row align="middle" gutter={[16, 8]} style={{ flexWrap: 'nowrap', width: '100%', margin: 0 }}>
        <Col xs={17} sm={16} lg={15} style={{ paddingRight: '8px' }}>
          <span style={{
            color: theme.primaryColor,
            fontWeight: enterpriseTokens.typography.weights.bold,
            fontSize: isMobile ? '10px' : enterpriseTokens.typography.sizes.xs,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'block',
            marginBottom: '2px'
          }}>
            {greeting}
          </span>
          <Title level={isMobile ? 4 : 2} style={{ margin: '2px 0 2px 0', color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.bold, lineHeight: 1.2 }}>
            {title}
          </Title>
          {quote && (
            <Paragraph style={{ margin: '2px 0 6px 0', fontStyle: 'italic', color: theme.primaryColor, opacity: 0.85, fontSize: isMobile ? '11px' : enterpriseTokens.typography.sizes.sm }}>
              "{quote}"
            </Paragraph>
          )}
          {subtitle && (
            <Paragraph style={{ margin: 0, color: theme.textSecondary, fontSize: isMobile ? '11px' : enterpriseTokens.typography.sizes.sm, lineHeight: 1.3 }}>
              {subtitle}
            </Paragraph>
          )}
        </Col>
        {illustration && (
          <Col xs={7} sm={8} lg={9} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', padding: 0, height: '100%' }}>
            <div className="hero-illustration-wrapper" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', overflow: 'hidden' }}>
              {illustration}
            </div>
          </Col>
        )}
      </Row>
    </EnterpriseCard>
  );
}

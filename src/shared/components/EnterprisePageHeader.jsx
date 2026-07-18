import React from 'react';
import { Typography, Row, Col } from 'antd';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

const { Title, Paragraph } = Typography;

export default function EnterprisePageHeader({
  title,
  subtitle,
  kicker,
  tag,
  actions,
  activeRole = 'MOTHER',
  style = {},
  ...props
}) {
  const theme = getRoleTheme(activeRole);

  return (
    <div 
      className="enterprise-page-header" 
      style={{ 
        paddingBottom: enterpriseTokens.spacing.lg,
        borderBottom: `1px solid ${theme.borderColor}`,
        marginBottom: enterpriseTokens.spacing.xl,
        ...style 
      }} 
      {...props}
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={16}>
          {kicker && (
            <span style={{ 
              color: theme.primaryColor, 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              fontSize: enterpriseTokens.typography.sizes.xs, 
              fontWeight: enterpriseTokens.typography.weights.bold,
              display: 'block',
              marginBottom: '4px'
            }}>
              {kicker}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Title level={2} style={{ margin: 0, color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.bold }}>
              {title}
            </Title>
            {tag && <div className="page-header-tag">{tag}</div>}
          </div>
          {subtitle && (
            <Paragraph style={{ margin: '8px 0 0 0', color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.sm }}>
              {subtitle}
            </Paragraph>
          )}
        </Col>
        {actions && (
          <Col xs={24} sm={8} style={{ display: 'flex', justifyContent: 'flex-start', justifySelf: 'stretch', gap: '8px', flexWrap: 'wrap' }}>
            {actions}
          </Col>
        )}
      </Row>
    </div>
  );
}

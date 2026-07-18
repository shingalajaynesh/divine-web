import React from 'react';
import { Typography } from 'antd';
import { enterpriseTokens } from '../theme/enterpriseTokens';
import { getRoleTheme } from '../theme/roleThemes';

const { Title, Paragraph } = Typography;

export default function EnterpriseSection({
  title,
  subtitle,
  kicker,
  children,
  activeRole = 'MOTHER',
  extra,
  style = {},
  ...props
}) {
  const theme = getRoleTheme(activeRole);

  return (
    <section 
      style={{ 
        marginBottom: enterpriseTokens.spacing.xxl, 
        width: '100%',
        ...style 
      }} 
      {...props}
    >
      {(title || kicker || extra) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: enterpriseTokens.spacing.md,
          marginBottom: enterpriseTokens.spacing.lg
        }}>
          <div>
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
            {title && (
              <Title level={4} style={{ margin: 0, color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.semiBold }}>
                {title}
              </Title>
            )}
            {subtitle && (
              <Paragraph style={{ margin: '4px 0 0 0', color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.sm }}>
                {subtitle}
              </Paragraph>
            )}
          </div>
          {extra && <div className="section-extra-actions">{extra}</div>}
        </div>
      )}
      <div className="section-content-body">
        {children}
      </div>
    </section>
  );
}

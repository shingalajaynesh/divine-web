import React from 'react';
import { Space, Typography } from 'antd';
import EnterpriseCard from './EnterpriseCard';
import { enterpriseTokens } from '../theme/enterpriseTokens';
import { getRoleTheme } from '../theme/roleThemes';

const { Text, Title } = Typography;

export default function EnterpriseStatCard({
  title,
  value,
  icon,
  trend, // 'up' | 'down' | 'neutral'
  trendValue,
  activeRole = 'MOTHER',
  ...props
}) {
  const theme = getRoleTheme(activeRole);
  
  const getTrendColor = () => {
    if (trend === 'up') return '#287a55';
    if (trend === 'down') return '#b42318';
    return theme.textSecondary;
  };

  return (
    <EnterpriseCard activeRole={activeRole} {...props}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.sm, fontWeight: enterpriseTokens.typography.weights.medium }}>
            {title}
          </Text>
          {icon && <span style={{ color: theme.primaryColor, fontSize: enterpriseTokens.typography.sizes.xl }}>{icon}</span>}
        </div>
        
        <Title level={3} style={{ margin: '4px 0 0 0', color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.bold }}>
          {value}
        </Title>
        
        {trendValue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Text style={{ color: getTrendColor(), fontSize: enterpriseTokens.typography.sizes.xs, fontWeight: enterpriseTokens.typography.weights.semiBold }}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.xs }}>
              vs last period
            </Text>
          </div>
        )}
      </Space>
    </EnterpriseCard>
  );
}

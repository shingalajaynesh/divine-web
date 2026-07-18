import React from 'react';
import { Space, Typography, Progress } from 'antd';
import EnterpriseCard from './EnterpriseCard';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

const { Text } = Typography;

export default function EnterpriseMetricCard({
  title,
  subtitle,
  percent = 0,
  progressColor,
  icon,
  activeRole = 'MOTHER',
  ...props
}) {
  const theme = getRoleTheme(activeRole);
  const strokeColor = progressColor || theme.primaryColor;

  return (
    <EnterpriseCard activeRole={activeRole} {...props}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text style={{ color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.semiBold, fontSize: enterpriseTokens.typography.sizes.sm }}>
              {title}
            </Text>
            {subtitle && (
              <Text block style={{ color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.xs }}>
                {subtitle}
              </Text>
            )}
          </div>
          {icon && <span style={{ color: theme.primaryColor, fontSize: enterpriseTokens.typography.sizes.lg }}>{icon}</span>}
        </div>
        
        <Progress 
          percent={percent} 
          strokeColor={strokeColor} 
          trailColor={`${theme.borderColor}`}
          style={{ margin: 0 }}
        />
      </Space>
    </EnterpriseCard>
  );
}

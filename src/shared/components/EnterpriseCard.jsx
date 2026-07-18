import React from 'react';
import { Card } from 'antd';
import { enterpriseTokens } from '../theme/enterpriseTokens';
import { getRoleTheme } from '../theme/roleThemes';

export default function EnterpriseCard({ 
  children, 
  activeRole = 'MOTHER', 
  hoverable = true, 
  style = {}, 
  bodyStyle = {},
  className = '',
  ...props 
}) {
  const theme = getRoleTheme(activeRole);
  
  const cardStyle = {
    borderRadius: enterpriseTokens.radii.lg,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.borderColor}`,
    transition: `transform ${enterpriseTokens.animations.fast}, box-shadow ${enterpriseTokens.animations.fast}`,
    overflow: 'hidden',
    background: theme.bgContainer,
    ...style
  };

  return (
    <Card 
      className={`enterprise-card ${hoverable ? 'hoverable-card' : ''} ${className}`}
      style={cardStyle}
      bodyStyle={{ padding: enterpriseTokens.spacing.lg, ...bodyStyle }}
      {...props}
    >
      {children}
    </Card>
  );
}

import React from 'react';
import { Card } from 'antd';
import { enterpriseTokens } from '../theme/enterpriseTokens';
import { getRoleTheme } from '../theme/roleThemes';
import { useViewport } from '../hooks/useViewport';

export default function EnterpriseCard({ 
  children, 
  activeRole = 'MOTHER', 
  hoverable = true, 
  style = {}, 
  bodyStyle = {},
  styles = {},
  className = '',
  ...props 
}) {
  const theme = getRoleTheme(activeRole);
  const { isMobile } = useViewport();
  
  const cardStyle = {
    borderRadius: isMobile ? enterpriseTokens.radii.md : enterpriseTokens.radii.lg,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.borderColor}`,
    transition: `transform ${enterpriseTokens.animations.fast}, box-shadow ${enterpriseTokens.animations.fast}`,
    overflow: 'hidden',
    background: theme.bgContainer,
    ...style
  };

  const responsivePadding = isMobile ? enterpriseTokens.spacing.md : enterpriseTokens.spacing.lg;

  return (
    <Card 
      className={`enterprise-card ${hoverable ? 'hoverable-card' : ''} ${className}`}
      style={cardStyle}
      styles={{
        body: { padding: responsivePadding, ...bodyStyle, ...styles.body }
      }}
      {...props}
    >
      {children}
    </Card>
  );
}

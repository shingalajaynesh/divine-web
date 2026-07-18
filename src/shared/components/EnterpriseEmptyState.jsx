import React from 'react';
import { Empty, Button, Typography } from 'antd';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

const { Paragraph, Title } = Typography;

export default function EnterpriseEmptyState({
  title = 'No Data Found',
  description = 'There are no items to display at the moment.',
  actionText,
  onAction,
  activeRole = 'MOTHER',
  image = Empty.PRESENTED_IMAGE_SIMPLE,
  ...props
}) {
  const theme = getRoleTheme(activeRole);

  return (
    <div 
      style={{ 
        padding: `${enterpriseTokens.spacing.xxl} ${enterpriseTokens.spacing.lg}`, 
        textAlign: 'center',
        background: theme.bgContainer,
        borderRadius: enterpriseTokens.radii.lg,
        border: `1px dashed ${theme.borderColor}`,
        ...props.style
      }}
    >
      <Empty
        image={image}
        description={
          <div style={{ marginTop: enterpriseTokens.spacing.sm }}>
            <Title level={5} style={{ margin: 0, color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.semiBold }}>
              {title}
            </Title>
            <Paragraph style={{ margin: '6px 0 0 0', color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.sm }}>
              {description}
            </Paragraph>
          </div>
        }
      >
        {actionText && onAction && (
          <Button 
            type="primary" 
            style={{ 
              backgroundColor: theme.primaryColor, 
              borderColor: theme.primaryColor,
              borderRadius: enterpriseTokens.radii.sm 
            }} 
            onClick={onAction}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}

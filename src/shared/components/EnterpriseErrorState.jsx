import React, { useMemo } from 'react';
import { Result, Button, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

const { Paragraph } = Typography;

export default function EnterpriseErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while retrieving your request. Please try again.',
  onRetry,
  activeRole = 'MOTHER',
  error, // Option to log internally
}) {
  const theme = getRoleTheme(activeRole);

  const correlationId = useMemo(() => {
    // If the error has a request ID or correlation ID from response headers, use it;
    // otherwise generate a clean, safe UI correlation code.
    if (error?.networkError?.headers?.get('x-request-id')) {
      return `REQ-${error.networkError.headers.get('x-request-id').slice(0, 8).toUpperCase()}`;
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ERR-${code}`;
  }, [error]);

  // Log detailed error safely to console/telemetry for developers (never leak in UI!)
  React.useEffect(() => {
    if (error) {
      console.error(`[Security Safe Diagnostic Logs] Code: ${correlationId}`, error);
    }
  }, [error, correlationId]);

  return (
    <div 
      style={{ 
        padding: enterpriseTokens.spacing.xl, 
        background: theme.bgContainer,
        borderRadius: enterpriseTokens.radii.lg,
        border: `1px solid ${theme.borderColor}`,
        textAlign: 'center',
        margin: '16px 0'
      }}
    >
      <Result
        status="error"
        title={title}
        subTitle={description}
        icon={<WarningOutlined style={{ color: theme.primaryColor }} />}
        extra={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {onRetry && (
              <Button 
                type="primary" 
                style={{ backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }}
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
            <Paragraph style={{ color: theme.textSecondary, fontSize: enterpriseTokens.typography.sizes.xs, margin: 0 }}>
              Reference ID: <strong>{correlationId}</strong>
            </Paragraph>
          </div>
        }
      />
    </div>
  );
}

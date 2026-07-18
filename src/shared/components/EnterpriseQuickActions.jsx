import React from 'react';
import { Row, Col, Button } from 'antd';
import { enterpriseTokens } from '../theme/enterpriseTokens';
import { getRoleTheme } from '../theme/roleThemes';

export default function EnterpriseQuickActions({
  actions = [],
  activeRole = 'MOTHER',
  ...props
}) {
  const theme = getRoleTheme(activeRole);

  return (
    <div style={{ margin: `${enterpriseTokens.spacing.md} 0` }} {...props}>
      <Row gutter={[12, 12]}>
        {actions.map((act, idx) => (
          <Col xs={12} sm={8} md={6} lg={4} key={idx}>
            <Button
              type="default"
              icon={act.icon}
              onClick={act.onClick}
              href={act.href}
              target={act.target}
              style={{
                width: '100%',
                height: 'auto',
                padding: `${enterpriseTokens.spacing.md} ${enterpriseTokens.spacing.sm}`,
                borderRadius: enterpriseTokens.radii.md,
                boxShadow: theme.shadow,
                border: `1px solid ${theme.borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'normal',
                fontWeight: enterpriseTokens.typography.weights.medium,
                color: theme.textPrimary,
                fontSize: enterpriseTokens.typography.sizes.xs,
              }}
            >
              <span>{act.label}</span>
            </Button>
          </Col>
        ))}
      </Row>
    </div>
  );
}

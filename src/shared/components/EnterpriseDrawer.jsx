import React from 'react';
import { Drawer } from 'antd';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

export default function EnterpriseDrawer({
  children,
  activeRole = 'MOTHER',
  title,
  open,
  onClose,
  width = 450,
  ...props
}) {
  const theme = getRoleTheme(activeRole);

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width={width}
      headerStyle={{
        borderBottom: `1px solid ${theme.borderColor}`,
        padding: enterpriseTokens.spacing.lg
      }}
      bodyStyle={{
        padding: enterpriseTokens.spacing.lg,
        background: theme.bgLayout
      }}
      {...props}
    >
      {children}
    </Drawer>
  );
}

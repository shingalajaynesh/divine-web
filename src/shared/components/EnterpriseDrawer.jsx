import React from 'react';
import { Drawer } from 'antd';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';
import { useViewport } from '../hooks/useViewport';

export default function EnterpriseDrawer({
  children,
  activeRole = 'MOTHER',
  title,
  open,
  onClose,
  width = 450,
  styles = {},
  ...props
}) {
  const theme = getRoleTheme(activeRole);
  const { isMobile } = useViewport();

  const responsiveWidth = isMobile ? '100%' : width;

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      width={responsiveWidth}
      styles={{
        header: {
          borderBottom: `1px solid ${theme.borderColor}`,
          padding: enterpriseTokens.spacing.lg
        },
        body: {
          padding: enterpriseTokens.spacing.lg,
          background: theme.bgLayout,
          ...styles.body
        },
        ...styles
      }}
      {...props}
    >
      {children}
    </Drawer>
  );
}

import React from 'react';
import EnterpriseBreadcrumbs from './EnterpriseBreadcrumbs';
import EnterpriseOfflineBanner from './EnterpriseOfflineBanner';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

export default function EnterpriseLayout({
  children,
  activeRole = 'MOTHER',
  breadcrumbs = [],
  style = {},
}) {
  const theme = getRoleTheme(activeRole);

  return (
    <div 
      className="enterprise-layout-wrapper" 
      style={{ 
        padding: enterpriseTokens.spacing.sm,
        minHeight: '100%',
        background: theme.bgLayout,
        ...style 
      }}
    >
      <EnterpriseOfflineBanner />
      {breadcrumbs.length > 0 && (
        <EnterpriseBreadcrumbs items={breadcrumbs} activeRole={activeRole} />
      )}
      <div className="enterprise-layout-content">
        {children}
      </div>
    </div>
  );
}

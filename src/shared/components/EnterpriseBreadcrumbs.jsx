import React from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { getRoleTheme } from '../theme/roleThemes';
import { enterpriseTokens } from '../theme/enterpriseTokens';

export default function EnterpriseBreadcrumbs({ items = [], activeRole = 'MOTHER' }) {
  const theme = getRoleTheme(activeRole);
  
  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1;
    return {
      title: isLast ? (
        <span style={{ color: theme.textPrimary, fontWeight: enterpriseTokens.typography.weights.medium }}>
          {item.title}
        </span>
      ) : (
        <Link to={item.path || '#'} style={{ color: theme.textSecondary }}>
          {item.title}
        </Link>
      )
    };
  });

  return (
    <div style={{ marginBottom: enterpriseTokens.spacing.md }}>
      <Breadcrumb items={breadcrumbItems} />
    </div>
  );
}

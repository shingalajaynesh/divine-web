import React from 'react';
import { Tag } from 'antd';
import { enterpriseTokens } from '../theme/enterpriseTokens';

export default function EnterpriseStatusTag({ status, type = 'default' }) {
  const getColors = () => {
    switch (status?.toLowerCase() || type?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'synced':
      case 'active':
        return { color: '#287a55', bg: '#ecfdf5', border: '#d1fae5' };
      case 'pending':
      case 'warning':
      case 'local_only':
      case 'syncing':
        return { color: '#b45309', bg: '#fffbeb', border: '#fde68a' };
      case 'failed':
      case 'error':
      case 'conflict':
        return { color: '#b42318', bg: '#fef2f2', border: '#fee2e2' };
      case 'info':
      default:
        return { color: '#315c88', bg: '#eff6ff', border: '#dbeafe' };
    }
  };

  const { color, bg, border } = getColors();

  return (
    <Tag 
      style={{
        color,
        backgroundColor: bg,
        borderColor: border,
        borderRadius: enterpriseTokens.radii.xs,
        fontWeight: enterpriseTokens.typography.weights.semiBold,
        textTransform: 'uppercase',
        fontSize: '11px',
        padding: '2px 8px',
        margin: 0
      }}
    >
      {status || type}
    </Tag>
  );
}

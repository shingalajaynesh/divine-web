import React from 'react';
import { Tag } from 'antd';

export function StatusTag({ status }) {
  const normalized = String(status || '').toUpperCase().trim();

  // Status to Color mapping
  const colorMap = {
    // General
    ACTIVE: 'success',
    INACTIVE: 'default',
    PENDING: 'warning',
    FAILED: 'error',
    SUCCESS: 'success',

    // Staff / Invitation
    INVITED: 'processing',
    PENDING_ACTIVATION: 'warning',
    SUSPENDED: 'error',
    DEACTIVATED: 'default',
    INVITATION_EXPIRED: 'error',

    // Payment / Refund
    CAPTURED: 'success',
    SUCCEEDED: 'success',
    REFUNDED: 'default',
    PARTIALLY_REFUNDED: 'warning',
    REFUND_PENDING: 'warning',
    PROCESSED: 'success',

    // Order / Fulfillment
    PROCESSING: 'processing',
    SHIPPED: 'purple',
    DELIVERED: 'success',
    CANCELLED: 'error',
  };

  const color = colorMap[normalized] || 'default';
  
  return (
    <Tag color={color} style={{ fontWeight: 500, borderRadius: '4px' }}>
      {normalized.replace(/_/g, ' ')}
    </Tag>
  );
}

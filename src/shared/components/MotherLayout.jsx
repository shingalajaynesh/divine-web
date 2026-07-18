import React from 'react';
import { Alert, Spin } from 'antd';

export default function MotherLayout({ user, children }) {
  // 1. Loading state
  if (user === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading maternal dashboard..." />
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Authentication Required"
          description="Please sign in to access your maternal dashboard."
          type="error"
          showIcon
        />
      </div>
    );
  }

  // 3. Deactivated / Inactive account state
  if (user.isActive === false) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Account Suspended"
          description="Your account is not active. Please contact customer support."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // 4. Role Authorization check
  const roleType = user.role?.roleType;
  const isAllowed = ['MOTHER', 'ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(roleType);

  if (!isAllowed) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Access Denied"
          description="Only registered mothers and authorized preview staff can access this page."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="mother-layout-wrapper">
      {children}
    </div>
  );
}

import React from 'react';
import { Breadcrumb, Alert, Card, Spin } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { hasStaffPermission } from '../components/StaffPermissionGate';

const BREADCRUMB_MAP = {
  '/staff': [{ title: 'Staff Workspace' }, { title: 'Dashboard' }],
  '/staff/mothers': [{ title: 'Staff Workspace' }, { title: 'Mother Directory' }],
  '/staff/inquiries': [{ title: 'Staff Workspace' }, { title: 'Inquiry Management' }],
  '/staff/tasks': [{ title: 'Staff Workspace' }, { title: 'Task Management' }],
  '/staff/programmes': [{ title: 'Staff Workspace' }, { title: 'Programme Participants' }],
  '/staff/appointments': [{ title: 'Staff Workspace' }, { title: 'Appointment Management' }],
  '/staff/support': [{ title: 'Staff Workspace' }, { title: 'Support Desk' }],
  '/staff/content': [{ title: 'Staff Workspace' }, { title: 'Content Workspace' }],
  '/staff/notifications': [{ title: 'Staff Workspace' }, { title: 'Notifications' }],
  '/staff/profile': [{ title: 'Staff Workspace' }, { title: 'Staff Profile' }]
};

export default function StaffLayout({ user, permission, children }) {
  const location = useLocation();
  const path = location.pathname;

  // 1. Authentication Loading state
  if (user === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading staff workspace..." />
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Authentication Required"
          description="Your session has expired. Please sign in again."
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
          message="Account Deactivated"
          description="Your session has expired or is not linked. Please contact your center administrator."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // 4. Role Authorization check
  const roleType = user.role?.roleType;
  const isStaff = ['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(roleType);
  if (!isStaff) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Access Denied"
          description="You do not have permission to access this module."
          type="error"
          showIcon
        />
      </div>
    );
  }

  // 5. Permission Authorization check
  const isAllowed = hasStaffPermission(user, permission);
  if (!isAllowed) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Permission Required"
          description="You do not have permission to access this module."
          type="error"
          showIcon
        />
      </div>
    );
  }

  const breadcrumbs = BREADCRUMB_MAP[path] || [{ title: 'Staff Workspace' }];

  return (
    <div style={{ padding: '4px' }}>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={breadcrumbs} />
      </div>
      <div className="staff-page-content-wrapper">
        {children}
      </div>
    </div>
  );
}

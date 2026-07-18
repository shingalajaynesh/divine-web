import React from 'react';
import { Alert } from 'antd';

export function hasStaffPermission(user, permission) {
  if (!user) return false;
  const roleType = user.role?.roleType;
  if (roleType === 'SUPER_ADMIN' || roleType === 'ADMIN') return true;
  if (!permission) return true;

  try {
    const perms = typeof user.role?.permissions === 'string'
      ? JSON.parse(user.role.permissions || '{}')
      : (user.role?.permissions || {});

    switch (permission) {
      case 'DASHBOARD_VIEW':
      case 'NOTIFICATIONS_VIEW':
        return true;
      case 'MOTHERS_VIEW':
        return perms.users?.includes('read') || false;
      case 'MOTHERS_UPDATE':
        return perms.users?.includes('write') || false;
      case 'INQUIRIES_VIEW':
      case 'SUPPORT_VIEW':
      case 'APPOINTMENTS_VIEW':
        return perms.support?.includes('read') || false;
      case 'INQUIRIES_CREATE':
      case 'INQUIRIES_UPDATE':
      case 'SUPPORT_REPLY':
      case 'SUPPORT_ASSIGN':
      case 'SUPPORT_ESCALATE':
        return perms.support?.includes('write') || false;
      case 'TASKS_VIEW':
        return perms.staff?.includes('read') || false;
      case 'TASKS_CREATE':
      case 'TASKS_UPDATE':
      case 'TASKS_ASSIGN':
        return perms.staff?.includes('write') || false;
      case 'PROGRAMMES_VIEW':
      case 'CONTENT_VIEW':
        return perms.content?.includes('read') || false;
      case 'ATTENDANCE_VIEW':
      case 'ATTENDANCE_MARK':
      case 'CONTENT_EDIT':
      case 'CONTENT_REVIEW':
        return perms.content?.includes('write') || false;
      case 'ATTENDANCE_CORRECT':
      case 'CONTENT_PUBLISH':
        // Higher elevation required (implicit admin checking above handles true states)
        return false;
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
}

export default function StaffPermissionGate({ user, permission, children, fallback = null }) {
  const allowed = hasStaffPermission(user, permission);
  if (allowed) return <>{children}</>;

  if (fallback !== null) return <>{fallback}</>;

  return (
    <Alert
      message="Access Forbidden"
      description="You do not have permission to view or interact with this workspace section."
      type="error"
      showIcon
      style={{ margin: '16px 0' }}
    />
  );
}

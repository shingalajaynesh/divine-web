import { lazy } from 'react';

export const routeConfig = [
  {
    path: '/dashboard',
    component: lazy(() => import('../views/DashboardPage')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/library',
    component: lazy(() => import('../views/ContentLibrary')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/programmes',
    component: lazy(() => import('../views/Programmes')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/notifications',
    component: lazy(() => import('../views/NotificationCentre')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/baby-growth',
    component: lazy(() => import('../views/BabyGrowthTracker')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/forum',
    component: lazy(() => import('../views/CommunityForum')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/classes',
    component: lazy(() => import('../views/LiveClasses')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/vitals',
    component: lazy(() => import('../views/VitalsTracker')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/diet-planner',
    component: lazy(() => import('../views/DietPlanner')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/expert-consulting',
    component: lazy(() => import('../views/ExpertConsultation')),
    roles: ['MOTHER', 'GUIDE', 'STAFF', 'ADMIN']
  },
  {
    path: '/admin',
    component: lazy(() => import('../views/AdminConsole')),
    roles: ['ADMIN']
  },
  {
    path: '/admin/users',
    component: lazy(() => import('../admin/pages/users/UserList')),
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    path: '/admin/staff',
    component: lazy(() => import('../admin/pages/staff/StaffList')),
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    path: '/admin/payments',
    component: lazy(() => import('../admin/pages/payments/PaymentDashboard')),
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    path: '/admin/store',
    component: lazy(() => import('../admin/pages/store/StoreManager')),
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    path: '/admin/roles',
    component: lazy(() => import('../admin/pages/roles/RolePermissionsMatrix')),
    roles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    path: '/franchise',
    component: lazy(() => import('../views/FranchiseConsole')),
    roles: ['FRANCHISE_ADMIN', 'ADMIN']
  },
  {
    path: '/super-admin',
    component: lazy(() => import('../views/SuperAdminConsole')),
    roles: ['SUPER_ADMIN']
  },
  {
    path: '/staff',
    component: lazy(() => import('../staff/pages/dashboard/StaffDashboard')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'DASHBOARD_VIEW'
  },
  {
    path: '/staff/mothers',
    component: lazy(() => import('../staff/pages/mothers/MotherDirectory')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'MOTHERS_VIEW'
  },
  {
    path: '/staff/inquiries',
    component: lazy(() => import('../staff/pages/inquiries/InquiryList')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'INQUIRIES_VIEW'
  },
  {
    path: '/staff/tasks',
    component: lazy(() => import('../staff/pages/tasks/StaffTaskList')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'TASKS_VIEW'
  },
  {
    path: '/staff/programmes',
    component: lazy(() => import('../staff/pages/programmes/ProgrammeParticipants')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'PROGRAMMES_VIEW'
  },
  {
    path: '/staff/appointments',
    component: lazy(() => import('../staff/pages/appointments/AppointmentList')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'APPOINTMENTS_VIEW'
  },
  {
    path: '/staff/support',
    component: lazy(() => import('../staff/pages/support/StaffSupportTickets')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'SUPPORT_VIEW'
  },
  {
    path: '/staff/content',
    component: lazy(() => import('../staff/pages/content/StaffContentWorkspace')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'CONTENT_VIEW'
  },
  {
    path: '/staff/notifications',
    component: lazy(() => import('../staff/pages/notifications/StaffNotifications')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'],
    permission: 'NOTIFICATIONS_VIEW'
  },
  {
    path: '/staff/profile',
    component: lazy(() => import('../staff/pages/profile/StaffProfile')),
    roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN']
  },
  {
    path: '/content-studio',
    component: lazy(() => import('../views/ContentCms')),
    roles: ['STAFF', 'ADMIN']
  },
  {
    path: '/weekly-report',
    component: lazy(() => import('../views/WeeklyReport')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/pregnancy-tools',
    component: lazy(() => import('../views/PregnancyTools')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/support',
    component: lazy(() => import('../views/SupportHub')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/store',
    component: lazy(() => import('../views/StoreBoutique')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/pricing',
    component: lazy(() => import('../views/UpgradePlans')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/journey-archive',
    component: lazy(() => import('../views/JourneyArchive')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/profile',
    component: lazy(() => import('../views/ProfilePage')),
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  }
];

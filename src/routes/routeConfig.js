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
    roles: ['MOTHER', 'STAFF', 'ADMIN']
  },
  {
    path: '/admin',
    component: lazy(() => import('../views/AdminConsole')),
    roles: ['ADMIN']
  },
  {
    path: '/staff',
    component: lazy(() => import('../views/StaffConsole')),
    roles: ['STAFF', 'ADMIN']
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
  }
];

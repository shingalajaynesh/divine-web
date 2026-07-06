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
  }
];

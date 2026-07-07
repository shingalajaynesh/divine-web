import React from 'react';
import TodayDashboard from './TodayDashboard';
import PartnerDashboard from './PartnerDashboard';

export default function DashboardPage({ user, t, lang }) {
  if (user?.role?.roleType === 'PARTNER') {
    return <PartnerDashboard user={user} t={t} lang={lang} />;
  }
  return <TodayDashboard user={user} t={t} lang={lang} />;
}

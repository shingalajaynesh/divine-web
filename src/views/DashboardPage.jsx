import React from 'react';
import TodayDashboard from './TodayDashboard';
import PremiumSubscription from '../components/PremiumSubscription';
import ContactInquiryForm from '../components/ContactInquiryForm';
import DedicatedGuides from '../components/DedicatedGuides';
import DailyAffirmation from '../components/DailyAffirmation';

export default function DashboardPage({ user, t, lang }) {
  return (
    <div className="dashboard-layout">
      <div className="dashboard-primary">
        <TodayDashboard user={user} t={t} />
      </div>
      <aside className="dashboard-sidebar">
        <PremiumSubscription user={user} t={t} />
        <ContactInquiryForm user={user} isHi={lang === 'hi'} />
        <DedicatedGuides t={t} />
        <DailyAffirmation t={t} />
      </aside>
    </div>
  );
}

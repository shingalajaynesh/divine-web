import React from 'react';
import TodayDashboard from './TodayDashboard';
import PremiumSubscription from '../components/PremiumSubscription';
import ContactInquiryForm from '../components/ContactInquiryForm';
import DedicatedGuides from '../components/DedicatedGuides';
import DailyAffirmation from '../components/DailyAffirmation';

export default function DashboardPage({ user, t, onSubscribe, lang }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: 'repeat(3, minmax(0, 1fr))', gap: '24px' }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6" style={{ gridColumn: 'span 2 / span 2' }}>
        <TodayDashboard user={user} t={t} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <PremiumSubscription user={user} t={t} onSubscribe={onSubscribe} />
        <ContactInquiryForm user={user} isHi={lang === 'hi'} />
        <DedicatedGuides t={t} />
        <DailyAffirmation t={t} />
      </div>
    </div>
  );
}

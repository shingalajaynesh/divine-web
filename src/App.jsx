import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { setClerkTokenProvider } from './graphql/client.js';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ConfigProvider, 
  Spin, 
  Layout 
} from 'antd';
import { 
  CalendarOutlined, 
  BookOutlined, 
  HeartOutlined, 
  MessageOutlined, 
  VideoCameraOutlined, 
  BarChartOutlined, 
  CustomerServiceOutlined, 
  SettingOutlined, 
  SolutionOutlined 
} from '@ant-design/icons';

// Operations & Translations Imports
import { 
  ME_QUERY, 
  SAVE_ONBOARDING_MUTATION 
} from './graphql/operations';
import { TRANSLATIONS } from './translations/translations';

// Components Imports
import StripeCheckoutModal from './components/StripeCheckoutModal';
import OnboardingCalculator from './views/OnboardingCalculator';
import DeviceLockScreen from './views/DeviceLockScreen';

// Routing Imports
import AppRoutes, { WelcomeScreen } from './routes/AppRoutes';

function App() {
  const { getToken } = useAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('MOTHER');
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState(null);
  
  const { data: meData, loading: meLoading, error: meError, refetch: refetchMe } = useQuery(ME_QUERY);

  const [syncUser] = useMutation(gql`
    mutation SyncUser {
      syncUser {
        id
        emailAddress
      }
    }
  `, {
    onCompleted: () => refetchMe()
  });

  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (clerkLoaded && clerkUser && !meLoading) {
      const dbUser = meData?.me;
      if (!dbUser && !syncing) {
        setSyncing(true);
        syncUser()
          .then(() => setSyncing(false))
          .catch((err) => {
            console.error('Failed to sync user:', err);
            setSyncing(false);
          });
      }
    }
  }, [clerkLoaded, clerkUser, meData, meLoading, syncing]);

  useEffect(() => {
    setClerkTokenProvider(getToken);
  }, [getToken]);

  const user = meData?.me;
  const lang = user?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    if (user?.role?.roleType) {
      setActiveRole(user.role.roleType);
    }
  }, [user]);

  const [saveOnboarding] = useMutation(SAVE_ONBOARDING_MUTATION, {
    onCompleted: () => refetchMe()
  });

  const handleLanguageToggle = async (newLang) => {
    if (!user) return;
    try {
      await saveOnboarding({
        variables: {
          lmpDate: user.lmpDate,
          dueDate: user.dueDate,
          language: newLang
        }
      });
      toast.success(newLang === 'hi' ? "भाषा हिंदी में बदली गई" : "Language switched to English");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onSubscribe = (plan) => {
    setActiveCheckoutPlan(plan);
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <CalendarOutlined />,
      label: t.tab_today,
    },
    {
      key: '/library',
      icon: <BookOutlined />,
      label: t.tab_library,
    },
    {
      key: '/baby-growth',
      icon: <HeartOutlined />,
      label: t.tab_baby,
    },
    {
      key: '/forum',
      icon: <MessageOutlined />,
      label: t.tab_forum,
    },
    {
      key: '/classes',
      icon: <VideoCameraOutlined />,
      label: t.tab_classes,
    },
    {
      key: '/vitals',
      icon: <BarChartOutlined />,
      label: lang === 'hi' ? 'महत्वपूर्ण आँकड़े' : 'Vitals Tracker',
    },
    {
      key: '/expert-consulting',
      icon: <CustomerServiceOutlined />,
      label: lang === 'hi' ? 'विशेषज्ञ सलाह' : 'Expert Consulting',
    },
    ...(activeRole === 'ADMIN' ? [{
      key: '/admin',
      icon: <SettingOutlined />,
      label: t.tab_admin,
    }] : []),
    ...((activeRole === 'STAFF' || activeRole === 'ADMIN') ? [{
      key: '/staff',
      icon: <SolutionOutlined />,
      label: 'Staff Console',
    }] : [])
  ];

  const isLockScreen = meError && (meError.message.includes('Device unauthorized') || meError.message.includes('DEVICE_UNAUTHORIZED') || meError.message.includes('device unauthorized'));

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#d97706',
          borderRadius: 16,
          fontFamily: 'Outfit, Playfair Display, sans-serif'
        }
      }}
    >
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Toaster position="top-center" reverseOrder={false} />

        {activeCheckoutPlan && (
          <StripeCheckoutModal
            plan={activeCheckoutPlan}
            onClose={() => setActiveCheckoutPlan(null)}
            onPaymentSuccess={() => {
              setActiveCheckoutPlan(null);
              refetchMe();
            }}
            t={t}
          />
        )}

        <SignedOut>
          <WelcomeScreen t={t} />
        </SignedOut>

        <SignedIn>
          {meLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <Spin size="large" description="Loading session..." />
            </div>
          ) : isLockScreen ? (
            <DeviceLockScreen refetchMe={refetchMe} />
          ) : user && !user.lmpDate ? (
            <Layout style={{ minHeight: '100vh', padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <OnboardingCalculator saveOnboarding={saveOnboarding} t={t} />
            </Layout>
          ) : user ? (
            <AppRoutes 
              user={user}
              menuItems={menuItems}
              activeRole={activeRole}
              t={t}
              lang={lang}
              handleLanguageToggle={handleLanguageToggle}
              onSubscribe={onSubscribe}
            />
          ) : null}
        </SignedIn>
      </div>
    </ConfigProvider>
  );
}

export default App;

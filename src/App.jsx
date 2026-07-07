import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { auth } from './config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import AuthModal from './components/AuthModal.jsx';
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
  SolutionOutlined,
  BellOutlined,
  ShoppingCartOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

// Operations & Translations Imports
import { 
  ME_QUERY, 
  SAVE_ONBOARDING_MUTATION 
} from './graphql/operations';
import { TRANSLATIONS } from './translations/translations';

// Components Imports
const OnboardingCalculator = React.lazy(() => import('./views/OnboardingCalculator'));
const DeviceLockScreen = React.lazy(() => import('./views/DeviceLockScreen'));
import { divineTheme } from './theme/themeConfig';

// Routing Imports
import AppRoutes, { WelcomeScreen } from './routes/AppRoutes';

function App() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('MOTHER');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const [cachedUser, setCachedUser] = useState(() => {
    try {
      const stored = localStorage.getItem('divine_cached_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoaded(true);
      if (!user) {
        setCachedUser(null);
        localStorage.removeItem('divine_cached_user');
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authLoaded && firebaseUser && !meLoading) {
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
  }, [authLoaded, firebaseUser, meData, meLoading, syncing]);

  useEffect(() => {
    if (meData?.me) {
      setCachedUser(meData.me);
      localStorage.setItem('divine_cached_user', JSON.stringify(meData.me));
    }
  }, [meData]);

  const user = meData?.me || cachedUser;
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
      if (newLang === 'hi') {
        toast.success("भाषा हिंदी में बदली गई");
      } else if (newLang === 'gu') {
        toast.success("ભાષા બદલીને ગુજરાતી કરવામાં આવી");
      } else {
        toast.success("Language switched to English");
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const menuItems = useMemo(() => {
    if (activeRole === 'STAFF') {
      return [
        {
          key: '/staff',
          icon: <SolutionOutlined />,
          label: 'Staff Console',
        },
        {
          key: '/content-studio',
          icon: <BookOutlined />,
          label: 'Content Studio',
        },
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: 'Notifications',
        },
        {
          key: '/support',
          icon: <CustomerServiceOutlined />,
          label: lang === 'hi' ? 'सहायता केंद्र' : 'Help & Support',
        },
        {
          key: '/forum',
          icon: <MessageOutlined />,
          label: t.tab_forum,
        },
      ];
    }

    if (activeRole === 'GUIDE') {
      return [
        {
          key: '/expert-consulting',
          icon: <CustomerServiceOutlined />,
          label: lang === 'hi' ? 'विशेषज्ञ सलाह' : 'Expert Consulting',
        },
        {
          key: '/classes',
          icon: <VideoCameraOutlined />,
          label: t.tab_classes,
        },
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: 'Notifications',
        },
      ];
    }

    if (activeRole === 'ADMIN') {
      return [
        {
          key: '/admin',
          icon: <SettingOutlined />,
          label: t.tab_admin,
        },
        {
          key: '/staff',
          icon: <SolutionOutlined />,
          label: 'Staff Console',
        },
        {
          key: '/content-studio',
          icon: <BookOutlined />,
          label: 'Content Studio',
        },
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: 'Notifications',
        },
        {
          key: '/support',
          icon: <CustomerServiceOutlined />,
          label: lang === 'hi' ? 'सहायता केंद्र' : 'Help & Support',
        },
        {
          key: '/store',
          icon: <ShoppingCartOutlined />,
          label: lang === 'hi' ? 'मातृ बुटीक' : 'Maternal Store',
        },
        {
          key: '/pricing',
          icon: <SafetyCertificateOutlined />,
          label: lang === 'hi' ? 'सदस्यता प्लान' : 'Membership Plans',
        },
      ];
    }

    // Default: MOTHER
    return [
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
        key: '/programmes',
        icon: <SolutionOutlined />,
        label: 'Programmes',
      },
      {
        key: '/notifications',
        icon: <BellOutlined />,
        label: 'Notifications',
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
        key: '/diet-planner',
        icon: <HeartOutlined />,
        label: lang === 'hi' ? 'भोजन योजना' : 'Diet Planner',
      },
      {
        key: '/expert-consulting',
        icon: <CustomerServiceOutlined />,
        label: lang === 'hi' ? 'विशेषज्ञ सलाह' : 'Expert Consulting',
      },
      {
        key: '/weekly-report',
        icon: <BarChartOutlined />,
        label: lang === 'hi' ? 'साप्ताहिक रिपोर्ट' : 'Weekly Reports',
      },
      {
        key: '/support',
        icon: <CustomerServiceOutlined />,
        label: lang === 'hi' ? 'सहायता केंद्र' : 'Help & Support',
      },
      {
        key: '/store',
        icon: <ShoppingCartOutlined />,
        label: lang === 'hi' ? 'मातृ बुटीक' : 'Maternal Store',
      },
      {
        key: '/pricing',
        icon: <SafetyCertificateOutlined />,
        label: lang === 'hi' ? 'सदस्यता प्लान' : 'Membership Plans',
      },
    ];
  }, [activeRole, t, lang]);

  const isLockScreen = meError && (meError.message.includes('Device unauthorized') || meError.message.includes('DEVICE_UNAUTHORIZED') || meError.message.includes('device unauthorized'));

  return (
    <ConfigProvider
      theme={divineTheme}
    >
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Toaster position="top-center" reverseOrder={false} />

        {!authLoaded || (firebaseUser && meLoading && !cachedUser) ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin size="large" description="Loading session..." />
          </div>
        ) : !firebaseUser ? (
          <>
            <WelcomeScreen t={t} onSignInClick={() => setAuthModalVisible(true)} />
            <AuthModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
          </>
        ) : (
          <>
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <Spin size="large" description="Loading..." />
            </div>
          }>
            {isLockScreen ? (
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
              />
            ) : null}
          </Suspense>
          </>
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;

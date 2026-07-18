import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { auth } from './config/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
  SafetyCertificateOutlined,
  ToolOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  KeyOutlined,
  DashboardOutlined,
  SoundOutlined
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
import AppRoutes from './routes/AppRoutes';
import { hasStaffPermission } from './staff/components/StaffPermissionGate';
import { WelcomeScreen } from './components/WelcomeScreen.jsx';
import { divineTheme } from './theme/themeConfig';
import client from './graphql/client.js';
import { clearAllUserRecords } from './shared/utils/offlineDb';

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
  
  const { data: meData, loading: meLoading, error: meError, refetch: refetchMe } = useQuery(ME_QUERY, {
    skip: !authLoaded || !firebaseUser
  });

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
        clearAllUserRecords().catch(err => console.error('Failed to clear offline DB on sign out:', err));
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authLoaded && firebaseUser && !meLoading && !meError) {
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
  }, [authLoaded, firebaseUser, meData, meLoading, meError, syncing]);

  useEffect(() => {
    if (meData?.me) {
      setCachedUser(meData.me);
      // Strip PII (emailAddress, displayName, partner details) from local cache to prevent XSS exposure
      const { id, language, lmpDate, dueDate, currentWeek, currentTrimester, pregnancyDay, subscriptionStatus, role } = meData.me;
      localStorage.setItem('divine_cached_user', JSON.stringify({
        id, language, lmpDate, dueDate, currentWeek, currentTrimester, pregnancyDay, subscriptionStatus, role
      }));
    }
  }, [meData]);

  useEffect(() => {
    if (meError) {
      const isAuthError = 
        meError.message.includes('Authentication required') || 
        meError.message.includes('SESSION_EXPIRED') ||
        meError.message.includes('Session invalid') ||
        meError.message.includes('Context creation failed') ||
        meError.graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED');
      
      if (isAuthError && firebaseUser) {
        setCachedUser(null);
        localStorage.removeItem('divine_cached_user');
        client.clearStore().catch(() => {});
        signOut(auth).catch(err => console.error('Sign out error:', err));
      }
    }
  }, [meError, firebaseUser]);

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
      const items = [
        {
          key: '/staff',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
        }
      ];

      if (hasStaffPermission(user, 'MOTHERS_VIEW')) {
        items.push({
          key: '/staff/mothers',
          icon: <UserOutlined />,
          label: 'Mother Directory',
        });
      }

      if (hasStaffPermission(user, 'INQUIRIES_VIEW')) {
        items.push({
          key: '/staff/inquiries',
          icon: <TeamOutlined />,
          label: 'Inquiry Management',
        });
      }

      if (hasStaffPermission(user, 'TASKS_VIEW')) {
        items.push({
          key: '/staff/tasks',
          icon: <SolutionOutlined />,
          label: 'Tasks',
        });
      }

      if (hasStaffPermission(user, 'PROGRAMMES_VIEW')) {
        items.push({
          key: '/staff/programmes',
          icon: <VideoCameraOutlined />,
          label: 'Programmes',
        });
      }

      if (hasStaffPermission(user, 'APPOINTMENTS_VIEW')) {
        items.push({
          key: '/staff/appointments',
          icon: <CalendarOutlined />,
          label: 'Appointments',
        });
      }

      if (hasStaffPermission(user, 'SUPPORT_VIEW')) {
        items.push({
          key: '/staff/support',
          icon: <CustomerServiceOutlined />,
          label: 'Support Desk',
        });
      }

      if (hasStaffPermission(user, 'CONTENT_VIEW')) {
        items.push({
          key: '/staff/content',
          icon: <BookOutlined />,
          label: 'Content Review',
        });
      }

      items.push({
        key: '/staff/notifications',
        icon: <BellOutlined />,
        label: 'Notifications',
      });

      items.push({
        key: '/staff/profile',
        icon: <UserOutlined />,
        label: 'Profile',
      });

      return items;
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
          icon: <DashboardOutlined />,
          label: 'Admin Control Tower',
        },
        {
          key: '/admin/users',
          icon: <UserOutlined />,
          label: 'User Directory',
        },
        {
          key: '/admin/staff',
          icon: <TeamOutlined />,
          label: 'Staff Control',
        },
        {
          key: '/admin/payments',
          icon: <DollarOutlined />,
          label: 'Payments & Webhooks',
        },
        {
          key: '/admin/store',
          icon: <ShoppingCartOutlined />,
          label: 'Store Operations',
        },
        {
          key: '/admin/roles',
          icon: <KeyOutlined />,
          label: 'Role Permissions',
        },
        {
          key: '/content-studio',
          icon: <BookOutlined />,
          label: 'Content Studio',
        },
        {
          key: '/support',
          icon: <CustomerServiceOutlined />,
          label: lang === 'hi' ? 'सहायता केंद्र' : 'Help & Support',
        },
      ];
    }

    if (activeRole === 'SUPER_ADMIN') {
      return [
        {
          key: '/super-admin',
          icon: <SafetyCertificateOutlined />,
          label: 'Super Admin',
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
          key: '/store',
          icon: <ShoppingCartOutlined />,
          label: 'Store Operations',
        },
      ];
    }

    // Default: MOTHER
    return [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard',
      },
      {
        key: '/baby-growth',
        icon: <HeartOutlined />,
        label: lang === 'hi' ? 'मेरी गर्भावस्था' : 'My Pregnancy',
      },
      {
        key: '/journey-archive',
        icon: <CalendarOutlined />,
        label: lang === 'hi' ? 'गर्भ संस्कार यात्रा' : 'Garbh Sanskar Journey',
      },
      {
        key: '/vitals',
        icon: <SolutionOutlined />,
        label: lang === 'hi' ? 'दैनिक कार्य' : 'Daily Tasks',
      },
      {
        key: '/library?tab=meditation',
        icon: <CustomerServiceOutlined />,
        label: lang === 'hi' ? 'ध्यान' : 'Meditation',
      },
      {
        key: '/library?tab=music',
        icon: <SoundOutlined />,
        label: lang === 'hi' ? 'संगीत लाइब्रेरी' : 'Music Library',
      },
      {
        key: '/library?tab=videos',
        icon: <VideoCameraOutlined />,
        label: lang === 'hi' ? 'वीडियो' : 'Videos',
      },
      {
        key: '/programmes',
        icon: <BookOutlined />,
        label: lang === 'hi' ? 'कोर्स' : 'Courses',
      },
      {
        key: '/classes',
        icon: <VideoCameraOutlined />,
        label: lang === 'hi' ? 'लाइव सत्र' : 'Live Sessions',
      },
      {
        key: '/expert-consulting',
        icon: <CalendarOutlined />,
        label: lang === 'hi' ? 'नियुक्तियां' : 'Appointments',
      },
      {
        key: '/weekly-report',
        icon: <BarChartOutlined />,
        label: lang === 'hi' ? 'मेरी रिपोर्ट' : 'My Reports',
      },
      {
        key: '/forum',
        icon: <MessageOutlined />,
        label: lang === 'hi' ? 'समुदाय' : 'Community',
      },
      {
        key: '/store',
        icon: <ShoppingCartOutlined />,
        label: lang === 'hi' ? 'स्टोर' : 'Store',
      },
      {
        key: '/store?tab=orders',
        icon: <ShoppingCartOutlined />,
        label: lang === 'hi' ? 'ऑर्डर' : 'Orders',
      },
      {
        key: '/notifications',
        icon: <BellOutlined />,
        label: lang === 'hi' ? 'सूचनाएं' : 'Notifications',
      },
      {
        key: '/profile',
        icon: <UserOutlined />,
        label: lang === 'hi' ? 'प्रोफ़ाइल' : 'Profile',
      },
      {
        key: '/support',
        icon: <CustomerServiceOutlined />,
        label: lang === 'hi' ? 'सहायता' : 'Support',
      },
    ];
  }, [activeRole, t, lang]);

  const isLockScreen = meError && (
    meError.message.includes('Device unauthorized') || 
    meError.message.includes('DEVICE_UNAUTHORIZED') || 
    meError.message.includes('device unauthorized') ||
    meError.message.includes('Maximum concurrent device limit reached') ||
    meError.message.includes('device limit reached')
  );

  return (
    <ConfigProvider
      theme={divineTheme}
    >
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Toaster position="top-center" reverseOrder={false} />

        {!authLoaded ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin size="large" />
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
              <Spin size="large" />
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

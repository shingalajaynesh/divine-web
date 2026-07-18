import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Dropdown,
  Modal,
  Input,
  Empty,
} from 'antd';
import {
  CustomerServiceOutlined,
  GlobalOutlined,
  MenuOutlined,
  MoreOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { DELETE_MY_ACCOUNT_MUTATION } from '../graphql/operations.js';
import { routeConfig } from './routeConfig';
import StaffLayout from '../staff/layout/StaffLayout';
import { MotherLayout } from '../shared/components';
import { getActiveMotherNavigationItem } from '../shared/utils/navigationHelper';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://www.thedivinegarbhsanskar.com';
const SUPPORT_URL = 'https://wa.me/919638484545?text=Hello%20Divine%20Garbh%20Sanskar%20support';



function BrandBlock({ compact = false }) {
  return (
    <div className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''}`}>
      <Avatar src="/logo.jpg" size={compact ? 38 : 48} shape="square" className="brand-logo" />
      {!compact && (
        <div>
          <strong>Divine Garbh Sanskar</strong>
          <span>Motherhood companion</span>
        </div>
      )}
    </div>
  );
}

function MainAppLayout({ user, menuItems, lang, handleLanguageToggle, activeRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = screens.xs || (screens.sm && !screens.md);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPath = useMemo(() => {
    if (activeRole === 'MOTHER') {
      return getActiveMotherNavigationItem(location);
    }
    return location.pathname === '/' ? '/dashboard' : location.pathname;
  }, [location, activeRole]);

  useEffect(() => {
    if (activeRole === 'MOTHER') {
      const pathname = location.pathname;
      const searchParams = new URLSearchParams(location.search);
      const tab = searchParams.get('tab');

      if (pathname === '/library') {
        if (!tab || !['meditation', 'music', 'videos'].includes(tab)) {
          navigate('/library?tab=meditation', { replace: true });
        }
      }
      if (pathname === '/store') {
        if (tab && tab !== 'orders') {
          navigate('/store', { replace: true });
        }
      }
    }
  }, [location, activeRole, navigate]);

  const currentItem = menuItems.find((item) => item.key === selectedPath) || menuItems[0];
  const primaryMobileItems = menuItems.slice(0, 4);
  const searchResults = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return menuItems.slice(0, 8);
    return menuItems.filter((item) => String(item.label).toLowerCase().includes(term));
  }, [menuItems, searchQuery]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const [deleteMyAccount] = useMutation(DELETE_MY_ACCOUNT_MUTATION, {
    onCompleted: async () => {
      toast.success('Account successfully deleted.');
      await signOut(auth);
    },
    onError: (err) => {
      toast.error('Failed to delete account: ' + err.message);
    }
  });

  const showDeleteConfirm = () => {
    Modal.confirm({
      title: 'Are you sure you want to delete your account?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action is permanent and cannot be undone. All of your personal data will be anonymized or deleted immediately.',
      okText: 'Yes, Delete My Account',
      okType: 'danger',
      cancelText: 'No, Cancel',
      onOk: async () => {
        await deleteMyAccount();
      }
    });
  };


  const roleLabel = useMemo(() => ({
    MOTHER: 'Mother account',
    GUIDE: 'Expert account',
    STAFF: 'Staff account',
    ADMIN: 'Administrator',
  }[activeRole] || 'Member account'), [activeRole]);

  const goTo = ({ key }) => {
    navigate(key);
    setNavOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const navigation = (
    <div className="sidebar-nav-container">
      <Menu
        mode="inline"
        selectedKeys={[selectedPath]}
        items={menuItems}
        onClick={goTo}
        className="app-menu"
      />
      <div className="sidebar-support">
        <CustomerServiceOutlined />
        <div><strong>Need help?</strong><span>Our support team is available.</span></div>
        <Button type="link" href={SUPPORT_URL} target="_blank">WhatsApp</Button>
      </div>
    </div>
  );

  return (
    <Layout className="app-shell">
      <Sider width={260} theme="light" className="desktop-only-layout app-sider">
        <BrandBlock />
        <div className="sidebar-caption">Programme</div>
        {navigation}
        <div className="sidebar-version">Divine App · v1.1.0</div>
      </Sider>

      <Layout className="app-main-layout">        <Header className="app-topbar">
          <Space size={12}>
            <Button className="mobile-only-layout" type="text" icon={<MenuOutlined />} onClick={() => setNavOpen(true)} aria-label="Open navigation" />
            <div className="mobile-only-layout"><BrandBlock compact /></div>
            <div className="desktop-only-layout page-context">
              <Space size={8} align="center">
                <Text style={{ margin: 0, fontWeight: 700 }}>{user?.center?.name || 'Divine Garbh Sanskar'}</Text>
                {activeRole === 'MOTHER' && user?.currentWeek && (
                  <Tag style={{ border: 'none', background: '#ffe4e6', color: '#be123c', fontWeight: 600, margin: 0 }}>
                    Week {user.currentWeek} · Trimester {user.currentTrimester}
                  </Tag>
                )}
              </Space>
            </div>
          </Space>

          <Space size={8} align="center" style={{ flexWrap: 'nowrap' }}>
            {isMobile && activeRole === 'MOTHER' && user?.currentWeek && (
              <Tag style={{ border: 'none', background: '#ffe4e6', color: '#be123c', fontWeight: 600, margin: 0, padding: '0 6px' }}>
                W{user.currentWeek}·T{user.currentTrimester}
              </Tag>
            )}
            <Button className="global-search-trigger" icon={<SearchOutlined />} onClick={() => setSearchOpen(true)} aria-label="Search">
              {!isMobile && <><span>Search</span><kbd>Ctrl K</kbd></>}
            </Button>
            <Select
              value={lang}
              onChange={handleLanguageToggle}
              options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }, { value: 'gu', label: 'ગુજરાતી' }]}
              suffixIcon={<GlobalOutlined />}
              className="language-select"
              aria-label="Choose language"
            />
            <div className="desktop-only-layout user-summary">
              <strong>{user?.displayName || 'Member'}</strong>
              <span>{roleLabel}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: 'Sign Out',
                      onClick: () => signOut(auth)
                    },
                    {
                      key: 'delete-account',
                      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
                      label: <span style={{ color: '#ff4d4f' }}>Delete Account</span>,
                      onClick: () => showDeleteConfirm()
                    }
                  ]
                }}
                placement="bottomRight"
              >
                <Avatar 
                  style={{ backgroundColor: '#f43f5e', cursor: 'pointer' }}
                  size={38}
                  shape="square"
                >
                  {(user?.displayName || 'M').charAt(0).toUpperCase()}
                </Avatar>
              </Dropdown>
            </div>
          </Space>
        </Header>

        <Content className="app-content">
          <div className="content-frame"><Outlet /></div>
        </Content>

        <nav className="mobile-only-layout mobile-bottom-nav safe-area-bottom" aria-label="Primary navigation">
          {primaryMobileItems.map((item) => (
            <button key={item.key} className={selectedPath === item.key ? 'active' : ''} onClick={() => goTo(item)}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
          <button className={primaryMobileItems.some((item) => item.key === selectedPath) ? '' : 'active'} onClick={() => setNavOpen(true)}>
            <MoreOutlined /><span>More</span>
          </button>
        </nav>
      </Layout>

      <Drawer
        placement="left"
        open={navOpen}
        onClose={() => setNavOpen(false)}
        size={300}
        title={<BrandBlock />}
        className="mobile-nav-drawer"
      >
        <div className="mobile-profile-card">
          <strong>{user?.displayName || 'Member'}</strong>
          <span>{roleLabel}</span>
        </div>
        {navigation}
      </Drawer>
      <Modal open={searchOpen} onCancel={() => setSearchOpen(false)} footer={null} width={620} className="global-search-modal" title={null} destroyOnHidden>
        <Input autoFocus size="large" prefix={<SearchOutlined />} placeholder="Search features and tools" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} allowClear />
        <div className="global-search-results">
          <span className="global-search-label">{searchQuery ? `${searchResults.length} results` : 'Quick navigation'}</span>
          {searchResults.map((item) => (
            <button key={item.key} type="button" className="global-search-result" onClick={() => goTo(item)}>
              <span className="global-search-result-icon">{item.icon}</span><strong>{item.label}</strong><ArrowRightOutlined />
            </button>
          ))}
          {!searchResults.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching feature" />}
        </div>
      </Modal>
    </Layout>
  );
}

export default function AppRoutes({ user, menuItems, activeRole, t, lang, handleLanguageToggle }) {
  const defaultRoute = useMemo(() => {
    switch (activeRole) {
      case 'STAFF':
        return '/staff';
      case 'GUIDE':
        return '/expert-consulting';
      case 'ADMIN':
        return '/admin';
      case 'FRANCHISE_ADMIN':
        return '/franchise';
      case 'SUPER_ADMIN':
        return '/super-admin';
      default:
        return '/dashboard';
    }
  }, [activeRole]);

  return (
    <Routes>
      <Route element={<MainAppLayout user={user} menuItems={menuItems} lang={lang} handleLanguageToggle={handleLanguageToggle} activeRole={activeRole} />}>
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        {routeConfig.map(({ path, component: Component, roles, permission }) => (
          <Route
            key={path}
            path={path}
            element={roles.includes(activeRole) ? (
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}><Spin size="large" /></div>}>
                {path.startsWith('/staff') ? (
                  <StaffLayout user={user} permission={permission}>
                    <Component user={user} t={t} lang={lang} />
                  </StaffLayout>
                ) : roles.includes('MOTHER') ? (
                  <MotherLayout user={user}>
                    <Component user={user} t={t} lang={lang} />
                  </MotherLayout>
                ) : (
                  <Component user={user} t={t} lang={lang} />
                )}
              </Suspense>
            ) : <Navigate to={defaultRoute} replace />}
          />
        ))}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Route>
    </Routes>
  );
}

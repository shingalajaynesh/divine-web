import React, { Suspense, useMemo, useState } from 'react';
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
} from 'antd';
import {
  CustomerServiceOutlined,
  GlobalOutlined,
  MenuOutlined,
  MoreOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { routeConfig } from './routeConfig';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://www.thedivinegarbhsanskar.com';
const SUPPORT_URL = 'https://wa.me/919638484545?text=Hello%20Divine%20Garbh%20Sanskar%20support';

export function WelcomeScreen({ t, onSignInClick }) {
  return (
    <main className="welcome-shell">
      <header className="welcome-header">
        <div className="brand-lockup">
          <Avatar src="/logo.jpg" size={52} shape="square" className="brand-logo" />
          <div>
            <strong>Divine Garbh Sanskar</strong>
            <span>Weaving cultural roots into motherhood</span>
          </div>
        </div>
        <Button href={MARKETING_URL}>Visit website</Button>
      </header>

      <section className="welcome-content">
        <div className="welcome-copy">
          <Tag className="eyebrow-tag">{t.welcome}</Tag>
          <Title>Thoughtful guidance for every week of your pregnancy.</Title>
          <Paragraph>{t.journey_desc}</Paragraph>
          <Space wrap size={12}>
            <Button type="primary" size="large" onClick={onSignInClick}>
              Sign in to your dashboard
            </Button>
            <Button size="large" icon={<PhoneOutlined />} href={SUPPORT_URL} target="_blank">
              Talk to a counsellor
            </Button>
          </Space>
          <div className="welcome-trust-row">
            <span><SafetyCertificateOutlined /> Private account</span>
            <span>Hindi & English</span>
            <span>Web, iOS & Android</span>
          </div>
        </div>

        <aside className="welcome-preview" aria-label="Product highlights">
          <img src="/logo.jpg" alt="Divine Garbh Sanskar" />
          <div className="preview-card preview-card-main">
            <small>Your journey</small>
            <strong>Daily wellness, baby growth and expert guidance</strong>
            <span>One calm, organised place for your pregnancy programme.</span>
          </div>
          <div className="preview-card preview-card-small">40-week personalised path</div>
        </aside>
      </section>
    </main>
  );
}

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
  const [navOpen, setNavOpen] = useState(false);
  const isDesktop = Boolean(screens.lg);
  const selectedPath = location.pathname === '/' ? '/dashboard' : location.pathname;
  const currentItem = menuItems.find((item) => item.key === selectedPath) || menuItems[0];
  const primaryMobileItems = menuItems.slice(0, 4);

  const roleLabel = useMemo(() => ({
    MOTHER: 'Mother account',
    GUIDE: 'Expert account',
    STAFF: 'Staff account',
    ADMIN: 'Administrator',
  }[activeRole] || 'Member account'), [activeRole]);

  const goTo = ({ key }) => {
    navigate(key);
    setNavOpen(false);
  };

  const navigation = (
    <>
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
    </>
  );

  return (
    <Layout className="app-shell">
      {isDesktop && (
        <Sider width={260} theme="light" className="app-sider">
          <BrandBlock />
          <div className="sidebar-caption">Programme</div>
          {navigation}
          <div className="sidebar-version">Divine App · v1.1.0</div>
        </Sider>
      )}

      <Layout className="app-main-layout">
        <Header className="app-topbar">
          <Space size={12}>
            {!isDesktop && (
              <Button type="text" icon={<MenuOutlined />} onClick={() => setNavOpen(true)} aria-label="Open navigation" />
            )}
            {!isDesktop && <BrandBlock compact />}
            {isDesktop && (
              <div className="page-context">
                <Text>{currentItem?.label || 'Dashboard'}</Text>
                <span>{user?.center?.name || 'Divine Garbh Sanskar'}</span>
              </div>
            )}
          </Space>

          <Space size={isDesktop ? 16 : 8} align="center">
            <Select
              value={lang}
              onChange={handleLanguageToggle}
              options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी' }, { value: 'gu', label: 'ગુજરાતી' }]}
              suffixIcon={<GlobalOutlined />}
              className="language-select"
              aria-label="Choose language"
            />
            {isDesktop && (
              <div className="user-summary">
                <strong>{user?.displayName || 'Member'}</strong>
                <span>{roleLabel}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: 'Sign Out',
                      onClick: () => signOut(auth)
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
          {selectedPath !== '/dashboard' && <div className="content-heading">
            <div>
              <span className="content-kicker">{roleLabel}</span>
              <Title level={2}>{currentItem?.label || 'Dashboard'}</Title>
            </div>
            {user?.currentWeek && (
              <Tag className="week-tag">Week {user.currentWeek} · Trimester {user.currentTrimester}</Tag>
            )}
          </div>}
          <div className="content-frame"><Outlet /></div>
        </Content>

        {!isDesktop && (
          <nav className="mobile-bottom-nav" aria-label="Primary navigation">
            {primaryMobileItems.map((item) => (
              <button key={item.key} className={selectedPath === item.key ? 'active' : ''} onClick={() => goTo(item)}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
            <button className={primaryMobileItems.some((item) => item.key === selectedPath) ? '' : 'active'} onClick={() => setNavOpen(true)}>
              <MoreOutlined /><span>More</span>
            </button>
          </nav>
        )}
      </Layout>

      <Drawer
        placement="left"
        open={!isDesktop && navOpen}
        onClose={() => setNavOpen(false)}
        width={300}
        title={<BrandBlock />}
        className="mobile-nav-drawer"
      >
        <div className="mobile-profile-card">
          <strong>{user?.displayName || 'Member'}</strong>
          <span>{roleLabel}</span>
        </div>
        {navigation}
      </Drawer>
    </Layout>
  );
}

export default function AppRoutes({ user, menuItems, activeRole, t, lang, handleLanguageToggle }) {
  return (
    <Routes>
      <Route element={<MainAppLayout user={user} menuItems={menuItems} lang={lang} handleLanguageToggle={handleLanguageToggle} activeRole={activeRole} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {routeConfig.map(({ path, component: Component, roles }) => (
          <Route
            key={path}
            path={path}
            element={roles.includes(activeRole) ? (
              <Suspense fallback={<div className="route-loader"><Spin size="large" /><span>Loading your workspace…</span></div>}>
                <Component user={user} t={t} lang={lang} />
              </Suspense>
            ) : <Navigate to="/dashboard" replace />}
          />
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

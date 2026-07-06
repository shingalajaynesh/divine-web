import React, { Suspense, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import {
  Layout,
  Menu,
  Avatar,
  Space,
  Typography,
  Spin,
  Tag,
  Grid,
  Button,
  Drawer
} from 'antd';
import { GlobalOutlined, MenuOutlined } from '@ant-design/icons';
import { routeConfig } from './routeConfig';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Welcome Screen for Unauthenticated Users
export function WelcomeScreen({ t }) {
  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--color-brand-light) 0%, #fff5ea 100%)' }}>
      <Header style={{ background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '70px', borderBottom: '1px solid var(--border-delicate)' }}>
        <Space size="middle">
          <Avatar src="/logo.jpg" size={44} style={{ border: '2px solid #fff3f0' }} />
          <Title level={4} style={{ margin: 0, color: 'var(--color-brand-secondary)', fontFamily: 'var(--font-serif)', fontWeight: 900 }}>
            Divine Garbh Sanskar
          </Title>
        </Space>
      </Header>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <Tag color="orange" style={{ marginBottom: '16px', fontWeight: 'bold', borderRadius: '12px' }}>{t.welcome}</Tag>
          <Title level={1} style={{ fontSize: '40px', fontWeight: 900, fontFamily: 'var(--font-serif)', color: 'var(--color-brand-secondary)' }}>
            Begin Your Sacred Journey of <span style={{ color: 'var(--color-brand-primary)' }}>Conscious Pregnancy</span>
          </Title>
          <Text type="secondary" style={{ fontSize: '16px', display: 'block', margin: '24px 0', fontFamily: 'var(--font-primary)' }}>{t.journey_desc}</Text>
        </div>
      </Content>
    </Layout>
  );
}

// Layout wrapper including Sider and Header
function MainAppLayout({ user, menuItems, lang, handleLanguageToggle, activeRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Treat screen size below large (lg) as mobile viewport for Drawer toggle compatibility
  const isMobile = !screens.lg;

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) {
      setDrawerVisible(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#fbf8f6' }}>
      {/* Application Header */}
      <Header className="header-glass" style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', position: 'sticky', top: 0, zIndex: 100 }}>
        <Space size="middle" align="center">
          {isMobile && (
            <Button 
              type="text" 
              icon={<MenuOutlined style={{ fontSize: '18px', color: '#1e293b' }} />} 
              onClick={() => setDrawerVisible(true)} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, width: '40px', height: '40px' }}
            />
          )}
          <Avatar src="/logo.jpg" size={46} style={{ border: '2px solid #fff3f0', boxShadow: '0 2px 8px rgba(99, 18, 7, 0.08)' }} />
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 900, color: 'var(--color-brand-secondary)', fontFamily: 'var(--font-serif)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                Divine Garbh Sanskar
              </Title>
              <Text style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-brand-primary)', letterSpacing: '0.5px', display: 'block', marginTop: '2px' }}>
                📍 {user?.center?.name || 'Divine Garbh Sanskar Main Center'}
              </Text>
            </div>
          )}
        </Space>

        {/* Desktop Horizontal Navigation Menu */}
        {!isMobile && (
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname === '/' ? '/dashboard' : location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ 
              flex: 1, 
              justifyContent: 'center', 
              borderBottom: 0, 
              maxWidth: '750px',
              fontSize: '14.5px',
              fontWeight: 700
            }}
          />
        )}

        <Space size={isMobile ? 'middle' : 'large'} align="center">
          <Space size="small" align="center">
            <GlobalOutlined style={{ color: 'var(--color-brand-primary)' }} />
            <select
              value={lang}
              onChange={(e) => handleLanguageToggle(e.target.value)}
              style={{
                border: '1px solid #e2d4cf',
                borderRadius: '24px',
                padding: '6px 14px',
                fontSize: '12px',
                outline: 'none',
                background: '#fff',
                color: 'var(--text-main)',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </Space>

          {user && !isMobile && (
            <div style={{ 
              textAlign: 'right', 
              marginRight: '8px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              lineHeight: 1
            }}>
              <span style={{ 
                fontWeight: 700, 
                color: 'var(--text-main)', 
                fontSize: '13px', 
                margin: 0, 
                padding: 0 
              }}>
                {user.displayName}
              </span>
              <span style={{ 
                fontSize: '9px', 
                fontWeight: 800, 
                color: 'var(--color-brand-primary)', 
                textTransform: 'uppercase', 
                margin: 0, 
                padding: 0, 
                marginTop: '3px'
              }}>
                {activeRole || 'Mother'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: { width: '38px', height: '38px', borderRadius: '12px' } } }} />
          </div>
        </Space>
      </Header>

      <Layout>
        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <Drawer
            placement="left"
            closable={false}
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            style={{ width: 260 }}
            styles={{ body: { padding: '20px 0' } }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar src="/logo.jpg" size={36} />
                <div>
                  <Title level={5} style={{ margin: 0, fontWeight: 900, color: 'var(--color-brand-secondary)', fontFamily: 'var(--font-serif)' }}>Divine Garbh Sanskar</Title>
                </div>
              </div>
            }
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname === '/' ? '/dashboard' : location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ borderRight: 0 }}
            />
          </Drawer>
        )}

        {/* Main Content Area */}
        <Layout style={{ padding: isMobile ? '12px 12px 40px' : '32px 32px 64px', background: '#fbf8f6' }}>
          {isMobile && (
            <div 
              className="mobile-tabs-scroll"
              style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                paddingBottom: '12px', 
                marginBottom: '16px',
                width: '100%',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <style>{`
                .mobile-tabs-scroll::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.key || (item.key === '/dashboard' && location.pathname === '/');
                return (
                  <button
                    key={item.key}
                    onClick={() => handleMenuClick({ key: item.key })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: isActive ? '1px solid var(--color-brand-primary)' : '1px solid #e2d4cf',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      background: isActive ? 'var(--bg-tertiary)' : '#fff',
                      color: isActive ? 'var(--color-brand-secondary)' : 'var(--text-muted)'
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
          <Content style={{ padding: 0, margin: 0, minHeight: 280, maxWidth: '1440px', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default function AppRoutes({ user, menuItems, activeRole, t, lang, handleLanguageToggle, onSubscribe }) {
  return (
    <Routes>
      <Route element={
        <MainAppLayout
          user={user}
          menuItems={menuItems}
          lang={lang}
          handleLanguageToggle={handleLanguageToggle}
          activeRole={activeRole}
        />
      }>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {routeConfig.map(({ path, component: Component, roles }) => {
          const isAuthorized = roles.includes(activeRole);
          return (
            <Route
              key={path}
              path={path}
              element={
                isAuthorized ? (
                  <Suspense fallback={
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <Spin description="Loading section..." size="large" />
                    </div>
                  }>
                    <Component
                      user={user}
                      t={t}
                      lang={lang}
                      onSubscribe={onSubscribe}
                    />
                  </Suspense>
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
          );
        })}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Row, Col, Typography, Button, Statistic, Space, Alert, Tag 
} from 'antd';
import { 
  UserOutlined, TeamOutlined, DollarOutlined, 
  ShoppingCartOutlined, KeyOutlined, CloudServerOutlined 
} from '@ant-design/icons';

const GET_ADMIN_DASHBOARD = gql`
  query GetAdminDashboard {
    getCenterKpis {
      totalMothers
      activeStaff
      premiumEnrollments
      slaBreachedTickets
    }
  }
`;

export default function AdminConsole({ user }) {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(GET_ADMIN_DASHBOARD, {
    fetchPolicy: 'network-only',
  });

  const kpis = data?.getCenterKpis;

  const quickLinks = [
    {
      title: 'User Directory',
      description: 'Manage mothers, subscribers, and change access scopes.',
      icon: <UserOutlined style={{ fontSize: 24, color: '#be123c' }} />,
      route: '/admin/users'
    },
    {
      title: 'Staff Invitations',
      description: 'Invite new staff, guides, and control activation flows.',
      icon: <TeamOutlined style={{ fontSize: 24, color: '#2563eb' }} />,
      route: '/admin/staff'
    },
    {
      title: 'Payments & Refunds',
      description: 'Monitor intents, webhook events, and issue refunds.',
      icon: <DollarOutlined style={{ fontSize: 24, color: '#16a34a' }} />,
      route: '/admin/payments'
    },
    {
      title: 'Store Boutique',
      description: 'Adjust inventory counts and inspect stock logs.',
      icon: <ShoppingCartOutlined style={{ fontSize: 24, color: '#7c3aed' }} />,
      route: '/admin/store'
    },
    {
      title: 'Access matrix policies',
      description: 'Configure RBAC checkboxes and module permissions.',
      icon: <KeyOutlined style={{ fontSize: 24, color: '#ea580c' }} />,
      route: '/admin/roles'
    }
  ];

  return (
    <div style={{ padding: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>Admin Control Tower</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Center scope metrics and quick links to admin modules.
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<CloudServerOutlined />} onClick={() => refetch()} loading={loading}>
          Sync Dashboard
        </Button>
      </div>

      {error && (
        <Alert
          message="Failed to load dashboard metrics"
          description={error.message || 'An error occurred while connecting to the API.'}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* KPI Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderRadius: '8px' }}>
            <Statistic 
              title="Active Mothers Scoped"
              value={kpis?.totalMothers || 0}
              prefix={<UserOutlined style={{ color: '#be123c' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderRadius: '8px' }}>
            <Statistic 
              title="Active Guides & Staff"
              value={kpis?.activeStaff || 0}
              prefix={<TeamOutlined style={{ color: '#2563eb' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderRadius: '8px' }}>
            <Statistic 
              title="Premium Memberships"
              value={kpis?.premiumEnrollments || 0}
              prefix={<DollarOutlined style={{ color: '#16a34a' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={{ borderRadius: '8px' }}>
            <Statistic 
              title="SLA Breached Tickets"
              value={kpis?.slaBreachedTickets || 0}
              prefix={<Tag color="red">Alert</Tag>}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Diagnostic & Quick Links */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={24}>
          <Card title="Module Navigation Panel" style={{ borderRadius: '8px', minHeight: 330 }}>
            <Row gutter={[16, 16]}>
              {quickLinks.map((item, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card 
                    hoverable 
                    onClick={() => navigate(item.route)}
                    style={{ 
                      borderRadius: '8px', 
                      height: '100%', 
                      border: '1px solid #e5e7eb',
                      textAlign: 'center',
                      padding: '12px 4px'
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>{item.icon}</div>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{item.title}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Typography.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

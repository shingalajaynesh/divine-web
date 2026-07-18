import React from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Typography, Button, Space, Alert } from 'antd';
import { 
  UserOutlined, TeamOutlined, DollarOutlined, 
  ShoppingCartOutlined, KeyOutlined, CalendarOutlined,
  CheckSquareOutlined, CustomerServiceOutlined, BookOutlined
} from '@ant-design/icons';
import { GET_STAFF_TASKS_QUERY, GET_INQUIRIES } from '../../../graphql/operations';

export default function StaffDashboard({ user }) {
  const navigate = useNavigate();

  // Queries for workload KPI indicators
  const { data: taskData, loading: loadingTasks, error: taskError } = useQuery(GET_STAFF_TASKS_QUERY, {
    fetchPolicy: 'network-only'
  });

  const { data: inqData, loading: loadingInqs, error: inqError } = useQuery(GET_INQUIRIES, {
    variables: { status: 'NEW', limit: 10, offset: 0 },
    fetchPolicy: 'network-only'
  });

  const tasks = taskData?.getStaffTasks || [];
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const newInquiries = inqData?.getInquiries?.total || 0;

  const quickActions = [
    {
      title: 'Mother Directory',
      description: 'Manage pregnancy weeks and coaching logs.',
      icon: <UserOutlined style={{ fontSize: 24, color: '#be123c' }} />,
      route: '/staff/mothers'
    },
    {
      title: 'Inquiry Management',
      description: 'Review lead inquiries and schedule follow-ups.',
      icon: <TeamOutlined style={{ fontSize: 24, color: '#2563eb' }} />,
      route: '/staff/inquiries'
    },
    {
      title: 'Task Tracker',
      description: 'View assigned items and client follow-ups.',
      icon: <CheckSquareOutlined style={{ fontSize: 24, color: '#16a34a' }} />,
      route: '/staff/tasks'
    },
    {
      title: 'Support Desk',
      description: 'Reply to client tickets and log internal notes.',
      icon: <CustomerServiceOutlined style={{ fontSize: 24, color: '#7c3aed' }} />,
      route: '/staff/support'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Staff Workspace</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          Center scope: {user?.center?.name || 'Main Center'} · Scoped workload logs.
        </Typography.Paragraph>
      </div>

      {(taskError || inqError) && (
        <Alert
          message="Unable to load data. Please retry."
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Personal KPI Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ borderRadius: '8px' }}>
            <Statistic 
              title="Assigned Pending Tasks"
              value={pendingTasks}
              prefix={<CheckSquareOutlined style={{ color: '#16a34a' }} />}
              loading={loadingTasks}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ borderRadius: '8px' }}>
            <Statistic 
              title="New Inquiry Leads"
              value={newInquiries}
              prefix={<TeamOutlined style={{ color: '#2563eb' }} />}
              loading={loadingInqs}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ borderRadius: '8px' }}>
            <Statistic 
              title="Scheduled Today"
              value="3 Consultations"
              prefix={<CalendarOutlined style={{ color: '#be123c' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Module shortcuts */}
      <Card title="Quick Modules Navigation" style={{ borderRadius: '8px' }}>
        <Row gutter={[16, 16]}>
          {quickActions.map((item, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
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
    </div>
  );
}

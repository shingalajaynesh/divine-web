import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { 
  Card, Tabs, Table, Progress, Tag, Row, Col, Typography, Spin, 
  List, Space, Alert, Button, Statistic, Switch, Select, Input, Form
} from 'antd';
import { 
  DashboardOutlined, AuditOutlined, SafetyCertificateOutlined, 
  ShopOutlined, UserOutlined, AlertOutlined, CloudServerOutlined, 
  KeyOutlined, CheckCircleOutlined, SaveOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const GET_SUPER_ADMIN_METRICS = gql`
  query GetSuperAdminMetrics {
    getSuperAdminMetrics {
      totalUsersCount
      totalCentersCount
      systemStatus
      activeAlertsCount
      recentAuditLogs {
        id
        action
        targetType
        targetId
        payload
        createdAt
      }
      approvalsQueueCount
    }
  }
`;

const GET_CENTERS = gql`
  query GetCenters {
    getCenters {
      id
      name
      emailAddress
      contactno
      address
      isActive
    }
  }
`;

const APPROVE_CENTER = gql`
  mutation ApproveCenter($centerId: ID!, $approved: Boolean!) {
    approveCenter(centerId: $centerId, approved: $approved) {
      id
      isActive
    }
  }
`;

const UPDATE_ROLE_PERMISSIONS = gql`
  mutation UpdateRolePermissions($roleId: ID!, $permissions: String!) {
    updateRolePermissions(roleId: $roleId, permissions: $permissions) {
      id
      permissions
    }
  }
`;

const ROLES = [
  { id: 'r-mother', name: 'Mother (Member)', type: 'MOTHER', permissions: '{"timeline":"read,write","forum":"read,write","booking":"read,write"}' },
  { id: 'r-partner', name: 'Partner', type: 'PARTNER', permissions: '{"timeline":"read","forum":"read","encouragements":"write"}' },
  { id: 'r-guide', name: 'Expert Guide', type: 'GUIDE', permissions: '{"schedules":"read,write","consultations":"read,write","prescriptions":"write"}' },
  { id: 'r-staff', name: 'Center Staff', type: 'STAFF', permissions: '{"checklist":"read,write","members":"read","classes":"read,write"}' },
  { id: 'r-admin', name: 'Center Admin', type: 'ADMIN', permissions: '{"kpis":"read","staff":"read,write","support":"read,write","content":"write"}' },
  { id: 'r-super', name: 'Super Administrator', type: 'SUPER_ADMIN', permissions: '{"platform":"all","roles":"write","centers":"write"}' }
];

export default function SuperAdminConsole() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [rolePermissionsText, setRolePermissionsText] = useState(ROLES[0].permissions);

  // Queries
  const { data: metricsData, loading: loadingMetrics, refetch: refetchMetrics } = useQuery(GET_SUPER_ADMIN_METRICS, {
    fetchPolicy: 'network-only'
  });

  const { data: centersData, loading: loadingCenters, refetch: refetchCenters } = useQuery(GET_CENTERS, {
    fetchPolicy: 'network-only'
  });

  // Mutations
  const [approveCenter, { loading: togglingCenter }] = useMutation(APPROVE_CENTER, {
    onCompleted: () => {
      refetchCenters();
      refetchMetrics();
      toast.success('Center status updated successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [updateRolePermissions, { loading: updatingPermissions }] = useMutation(UPDATE_ROLE_PERMISSIONS, {
    onCompleted: () => {
      toast.success('Role permissions updated successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const metrics = metricsData?.getSuperAdminMetrics;
  const centers = centersData?.getCenters || [];

  const tabItems = [
    {
      key: 'overview',
      label: <span><DashboardOutlined /> Control Tower</span>,
    },
    {
      key: 'centers',
      label: <span><ShopOutlined /> Center Licenses & Approvals</span>,
    },
    {
      key: 'roles',
      label: <span><KeyOutlined /> Role Policies Matrix</span>,
    },
    {
      key: 'audits',
      label: <span><AuditOutlined /> Platform Security Audits</span>,
    }
  ];

  const handleToggleCenter = (centerId, currentStatus) => {
    approveCenter({
      variables: {
        centerId,
        approved: !currentStatus
      }
    });
  };

  const handleSavePermissions = () => {
    try {
      JSON.parse(rolePermissionsText); // Validate JSON format
      updateRolePermissions({
        variables: {
          roleId: selectedRole.id,
          permissions: rolePermissionsText
        }
      });
    } catch (e) {
      toast.error('Invalid JSON syntax. Please enter a valid JSON object.');
    }
  };

  const handleRoleChange = (roleVal) => {
    const roleObj = ROLES.find(r => r.type === roleVal);
    setSelectedRole(roleObj);
    setRolePermissionsText(roleObj.permissions);
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>🛡️ Super Admin Control Tower</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
            Inspect system parameters, audit trail logs, configure access control templates, and manage center activation status keys.
          </Paragraph>
        </div>
        <Button 
          onClick={() => { refetchMetrics(); refetchCenters(); }} 
          icon={<CloudServerOutlined />}
        >
          Ping Platform Health
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems}
        style={{ marginBottom: '24px' }}
      />

      {loadingMetrics && activeTab === 'overview' ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" description="Connecting to platform node metrics..." />
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* TAB 1: PLATFORM OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'overview' && metrics && (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ borderRadius: 16, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                    <Statistic 
                      title={<Text strong style={{ color: '#7e22ce' }}>Global Users Base</Text>}
                      value={metrics.totalUsersCount} 
                      prefix={<UserOutlined style={{ color: '#9333ea' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ borderRadius: 16, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <Statistic 
                      title={<Text strong style={{ color: '#15803d' }}>Authorized Centers</Text>}
                      value={metrics.totalCentersCount} 
                      prefix={<ShopOutlined style={{ color: '#16a34a' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ borderRadius: 16, background: '#f0fdfa', border: '1px solid #99f6e4' }}>
                    <Statistic 
                      title={<Text strong style={{ color: '#0f766e' }}>Core System Node</Text>}
                      value={metrics.systemStatus} 
                      prefix={<CheckCircleOutlined style={{ color: '#0d9488' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ borderRadius: 16, background: metrics.activeAlertsCount > 0 ? '#fff5f5' : '#f8fafc', border: `1px solid ${metrics.activeAlertsCount > 0 ? '#fecaca' : '#e2e8f0'}` }}>
                    <Statistic 
                      title={<Text strong style={{ color: metrics.activeAlertsCount > 0 ? '#b91c1c' : '#475569' }}>Active System SLA Alerts</Text>}
                      value={metrics.activeAlertsCount} 
                      prefix={<AlertOutlined style={{ color: metrics.activeAlertsCount > 0 ? '#dc2626' : '#64748b' }} />}
                    />
                  </Card>
                </Col>
              </Row>

              {metrics.approvalsQueueCount > 0 && (
                <Alert 
                  message="Action Needed: Pending Center Activations"
                  description={`There are currently ${metrics.approvalsQueueCount} center franchise licenses awaiting approval. Visit the Licenses tab to toggle activation.`}
                  type="warning"
                  showIcon
                  style={{ borderRadius: 12, marginBottom: '24px' }}
                />
              )}

              <Card title="Core Engine Pulse" style={{ borderRadius: 16 }}>
                <Paragraph type="secondary">
                  System components verified: GraphQL Engine (ONLINE), SQLite DB Connector (HEALTHY), Media Streaming S3 Bucket (CONNECTED).
                </Paragraph>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Tag color="success">GQL GATEWAY: OK</Tag>
                  <Tag color="success">DATABASE INSTANCE: OK</Tag>
                  <Tag color="success">AUTH0 SYNC: OK</Tag>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CENTER ACTIVATIONS & APPROVALS */}
          {/* ======================================================== */}
          {activeTab === 'centers' && (
            <Card title="Center Franchise Licenses Manager" style={{ borderRadius: 16 }}>
              {loadingCenters ? (
                <Spin size="large" />
              ) : (
                <Table 
                  dataSource={centers}
                  rowKey="id"
                  columns={[
                    {
                      title: 'Center Name',
                      dataIndex: 'name',
                      key: 'name',
                      render: (text) => <Text strong>🏢 {text}</Text>
                    },
                    {
                      title: 'Location',
                      dataIndex: 'address',
                      key: 'address'
                    },
                    {
                      title: 'Support Email',
                      dataIndex: 'emailAddress',
                      key: 'email'
                    },
                    {
                      title: 'Activation State',
                      dataIndex: 'isActive',
                      key: 'isActive',
                      render: (active) => (
                        <Tag color={active ? 'green' : 'red'}>
                          {active ? 'LICENSED & ACTIVE' : 'SUSPENDED / PENDING'}
                        </Tag>
                      )
                    },
                    {
                      title: 'Actions',
                      key: 'action',
                      render: (_, record) => (
                        <Button 
                          type={record.isActive ? 'default' : 'primary'}
                          danger={record.isActive}
                          onClick={() => handleToggleCenter(record.id, record.isActive)}
                          loading={togglingCenter}
                        >
                          {record.isActive ? 'Deactivate Center' : 'Approve & Activate'}
                        </Button>
                      )
                    }
                  ]}
                />
              )}
            </Card>
          )}

          {/* ======================================================== */}
          {/* TAB 3: ROLE POLICIES MATRIX */}
          {/* ======================================================== */}
          {activeTab === 'roles' && (
            <Card title="Role Access Control templates" style={{ borderRadius: 16 }}>
              <Paragraph type="secondary">
                Edit the JSON configuration matrix defining route access, field-level visibility rules, and dashboard mutations authorizations.
              </Paragraph>
              <Form layout="vertical">
                <Form.Item label={<Text strong>Select Role</Text>}>
                  <Select 
                    defaultValue="MOTHER" 
                    onChange={handleRoleChange}
                    size="large"
                    options={ROLES.map(r => ({ label: r.name, value: r.type }))}
                  />
                </Form.Item>
                <Form.Item label={<Text strong>Authorized Module Capabilities JSON</Text>}>
                  <TextArea 
                    rows={8}
                    value={rolePermissionsText}
                    onChange={(e) => setRolePermissionsText(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                </Form.Item>
                <Button 
                  type="primary" 
                  onClick={handleSavePermissions}
                  loading={updatingPermissions}
                  icon={<SaveOutlined />}
                  size="large"
                  style={{ background: '#be123c', borderColor: '#be123c' }}
                >
                  Save Access Matrix Policy
                </Button>
              </Form>
            </Card>
          )}

          {/* ======================================================== */}
          {/* TAB 4: SECURITY AUDIT LOGS */}
          {/* ======================================================== */}
          {activeTab === 'audits' && metrics && (
            <Card title="Platform Security Audit Trail" style={{ borderRadius: 16 }}>
              <Paragraph type="secondary">
                Audit logs tracking major administrative mutations, role configuration alterations, and user status suspensions.
              </Paragraph>
              <Table 
                dataSource={metrics.recentAuditLogs}
                rowKey="id"
                columns={[
                  {
                    title: 'Action Code',
                    dataIndex: 'action',
                    key: 'action',
                    render: (act) => <Tag color="blue">{act.toUpperCase()}</Tag>
                  },
                  {
                    title: 'Target Category',
                    dataIndex: 'targetType',
                    key: 'targetType',
                    render: (t) => <Text>{t || 'GENERAL'}</Text>
                  },
                  {
                    title: 'Target ID',
                    dataIndex: 'targetId',
                    key: 'targetId',
                    render: (id) => <Text type="secondary" style={{ fontSize: '11px' }}>{id || 'N/A'}</Text>
                  },
                  {
                    title: 'Payload',
                    dataIndex: 'payload',
                    key: 'payload',
                    ellipsis: true
                  },
                  {
                    title: 'Audit Time',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (t) => new Date(t).toLocaleString()
                  }
                ]}
              />
            </Card>
          )}
        </>
      )}
    </Card>
  );
}

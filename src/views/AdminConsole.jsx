import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ADMIN_ADD_CONTENT_MUTATION } from '../graphql/operations';
import { gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { 
  Card, Form, Input, InputNumber, Select, Button, Typography, Row, Col, 
  Tabs, Table, Progress, Tag, Space, Alert, List, Avatar, Statistic, Tooltip
} from 'antd';
import { 
  PlusCircleOutlined, TeamOutlined, HeartOutlined, TrophyOutlined, 
  AlertOutlined, DashboardOutlined, CalendarOutlined, SolutionOutlined, 
  LineChartOutlined, UserOutlined, ClockCircleOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const GET_CENTER_KPIS = gql`
  query GetCenterKpis {
    getCenterKpis {
      totalMothers
      activeStaff
      premiumEnrollments
      slaBreachedTickets
      enrollmentTrend {
        weekLabel
        count
      }
      staffHealth {
        staffId
        displayName
        email
        pendingTasksCount
        completedTasksCount
      }
      escalatedTickets {
        id
        subject
        description
        status
        priority
        createdAt
        user {
          displayName
        }
      }
    }
  }
`;

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState('kpis');
  
  // Queries
  const { data: kpisData, loading: loadingKpis, refetch: refetchKpis } = useQuery(GET_CENTER_KPIS, {
    fetchPolicy: 'network-only'
  });

  const [adminAddContent, { loading: submitting }] = useMutation(ADMIN_ADD_CONTENT_MUTATION);
  const [form] = Form.useForm();

  const handleUploadSubmit = async (values) => {
    const { dayNumber, category, titleEn, titleHi, bodyEn, bodyHi, mediaUrl } = values;
    try {
      await adminAddContent({
        variables: {
          dayNumber: parseInt(dayNumber, 10),
          category,
          titleEn,
          titleHi,
          bodyEn,
          bodyHi,
          mediaUrl: mediaUrl || null
        }
      });
      toast.success('Daily Content uploaded successfully!');
      form.resetFields(['titleEn', 'titleHi', 'bodyEn', 'bodyHi', 'mediaUrl']);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const kpis = kpisData?.getCenterKpis;

  const tabItems = [
    {
      key: 'kpis',
      label: <span><DashboardOutlined /> KPI Console</span>,
    },
    {
      key: 'trends',
      label: <span><LineChartOutlined /> Enrollment Trends</span>,
    },
    {
      key: 'staff',
      label: <span><TeamOutlined /> Staff Task Health</span>,
    },
    {
      key: 'support',
      label: <span><AlertOutlined /> Support Escalations</span>,
    },
    {
      key: 'upload',
      label: <span><CalendarOutlined /> Content Calendar Publisher</span>,
    }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>⚙️ Center Administrator Control Tower</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
            Monitor center analytics, staff productivity ratios, support ticket queues, and update daily content catalogs.
          </Paragraph>
        </div>
        <Button onClick={() => refetchKpis()} icon={<LineChartOutlined />}>Refresh Data</Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems}
        style={{ marginBottom: '24px' }}
      />

      {loadingKpis && activeTab !== 'upload' ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" description="Aggregating center indicators..." />
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* TAB 1: KPI OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'kpis' && kpis && (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ borderRadius: 16, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <Statistic 
                      title={<Text strong style={{ color: '#0369a1' }}>Registered Mothers</Text>}
                      value={kpis.totalMothers} 
                      prefix={<UserOutlined style={{ color: '#0284c7' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ borderRadius: 16, background: '#fdf2f8', border: '1px solid #fbcfe8' }}>
                    <Statistic 
                      title={<Text strong style={{ color: '#be185d' }}>Active Staff & Guides</Text>}
                      value={kpis.activeStaff} 
                      prefix={<TeamOutlined style={{ color: '#db2777' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ borderRadius: 16, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                    <Statistic 
                      title={<Text strong style={{ color: '#047857' }}>Premium Subscribers</Text>}
                      value={kpis.premiumEnrollments} 
                      prefix={<TrophyOutlined style={{ color: '#059669' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card style={{ borderRadius: 16, background: kpis.slaBreachedTickets > 0 ? '#fff5f5' : '#f8fafc', border: `1px solid ${kpis.slaBreachedTickets > 0 ? '#fecaca' : '#e2e8f0'}` }}>
                    <Statistic 
                      title={<Text strong style={{ color: kpis.slaBreachedTickets > 0 ? '#b91c1c' : '#475569' }}>SLA Breached Tickets</Text>}
                      value={kpis.slaBreachedTickets} 
                      prefix={<AlertOutlined style={{ color: kpis.slaBreachedTickets > 0 ? '#dc2626' : '#64748b' }} />}
                    />
                  </Card>
                </Col>
              </Row>

              {kpis.slaBreachedTickets > 0 && (
                <Alert 
                  message="Critical Action Required: Support SLA Breached"
                  description={`There are currently ${kpis.slaBreachedTickets} support tickets that have exceeded response guidelines. Please check the Escalations tab.`}
                  type="error"
                  showIcon
                  style={{ borderRadius: 12, marginBottom: '24px' }}
                />
              )}

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card title="Quick Enrollment Pulse" style={{ borderRadius: 16 }}>
                    <List
                      dataSource={kpis.enrollmentTrend}
                      renderItem={item => (
                        <List.Item style={{ padding: '12px 0' }}>
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <Text strong>{item.weekLabel}</Text>
                              <Text>{item.count} enrollments</Text>
                            </div>
                            <Progress percent={Math.min(100, item.count * 10)} strokeColor="#be123c" showInfo={false} />
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title="Support Ticket Overview" style={{ borderRadius: 16 }}>
                    <Paragraph type="secondary">Recent escalated customer support tickets awaiting action:</Paragraph>
                    <List
                      dataSource={kpis.escalatedTickets}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar icon={<AlertOutlined />} style={{ backgroundColor: '#fee2e2', color: '#ef4444' }} />}
                            title={<Text strong>{item.subject}</Text>}
                            description={`Patient: ${item.user?.displayName || 'Unknown'} · Created: ${new Date(item.createdAt).toLocaleDateString()}`}
                          />
                          <Tag color="red">URGENT ESCALATION</Tag>
                        </List.Item>
                      )}
                      locale={{ emptyText: 'All tickets responding within target SLAs.' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ENROLLMENT TRENDS */}
          {/* ======================================================== */}
          {activeTab === 'trends' && kpis && (
            <Card title="Weekly Registration Trends" style={{ borderRadius: 16 }}>
              <Paragraph type="secondary">
                Weekly conversion metrics for registered mothers at your center over the past 4 weeks.
              </Paragraph>
              <Table 
                dataSource={kpis.enrollmentTrend}
                rowKey="weekLabel"
                pagination={false}
                columns={[
                  {
                    title: 'Week Period',
                    dataIndex: 'weekLabel',
                    key: 'weekLabel',
                    render: (text) => <Text strong>{text}</Text>
                  },
                  {
                    title: 'New Conversions Count',
                    dataIndex: 'count',
                    key: 'count',
                    render: (cnt) => <Tag color="blue" style={{ fontSize: '13px', padding: '4px 8px' }}>{cnt} Sign-ups</Tag>
                  },
                  {
                    title: 'Performance Status',
                    key: 'status',
                    render: (_, record) => {
                      if (record.count > 5) return <Tag color="success">EXCELLENT GROWTH</Tag>;
                      if (record.count > 0) return <Tag color="processing">STEADY</Tag>;
                      return <Tag color="warning">NO ENROLLMENTS</Tag>;
                    }
                  }
                ]}
              />
            </Card>
          )}

          {/* ======================================================== */}
          {/* TAB 3: STAFF HEALTH */}
          {/* ======================================================== */}
          {activeTab === 'staff' && kpis && (
            <Card title="Staff Task Completion & Health" style={{ borderRadius: 16 }}>
              <Paragraph type="secondary">
                Track how quickly guides and administrative staff are responding to follow-ups and resolving assigned checklist tasks.
              </Paragraph>
              <Table 
                dataSource={kpis.staffHealth}
                rowKey="staffId"
                columns={[
                  {
                    title: 'Staff Member',
                    dataIndex: 'displayName',
                    key: 'name',
                    render: (text, record) => (
                      <div>
                        <Text strong>{text}</Text>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{record.email}</div>
                      </div>
                    )
                  },
                  {
                    title: 'Pending Reminders',
                    dataIndex: 'pendingTasksCount',
                    key: 'pending',
                    render: (cnt) => <Tag color={cnt > 3 ? 'orange' : 'default'}>{cnt} pending</Tag>
                  },
                  {
                    title: 'Completed Reminders',
                    dataIndex: 'completedTasksCount',
                    key: 'completed',
                    render: (cnt) => <Tag color="green">{cnt} completed</Tag>
                  },
                  {
                    title: 'Operational Health Index',
                    key: 'health',
                    render: (_, record) => {
                      const total = record.pendingTasksCount + record.completedTasksCount;
                      if (total === 0) return <Text type="secondary" style={{ fontStyle: 'italic' }}>No tasks assigned</Text>;
                      const percent = Math.round((record.completedTasksCount / total) * 100);
                      return (
                        <div style={{ width: '180px' }}>
                          <Progress percent={percent} size="small" status={percent < 50 ? 'exception' : 'success'} />
                        </div>
                      );
                    }
                  }
                ]}
              />
            </Card>
          )}

          {/* ======================================================== */}
          {/* TAB 4: SUPPORT ESCALATIONS */}
          {/* ======================================================== */}
          {activeTab === 'support' && kpis && (
            <Card title="Escalated & SLA Breached Support Tickets" style={{ borderRadius: 16 }}>
              <Paragraph type="secondary">
                Support inquiries that have violated target SLAs or have been escalated to High Priority.
              </Paragraph>
              <Table 
                dataSource={kpis.escalatedTickets}
                rowKey="id"
                locale={{ emptyText: 'No urgent support escalations pending!' }}
                columns={[
                  {
                    title: 'Patient Name',
                    key: 'user',
                    render: (_, record) => <Text strong>{record.user?.displayName || 'Unknown'}</Text>
                  },
                  {
                    title: 'Inquiry Topic',
                    dataIndex: 'subject',
                    key: 'subject'
                  },
                  {
                    title: 'Details',
                    dataIndex: 'description',
                    key: 'desc',
                    ellipsis: true
                  },
                  {
                    title: 'Created Date',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (t) => new Date(t).toLocaleDateString()
                  },
                  {
                    title: 'Action Trigger',
                    key: 'status',
                    render: () => <Tag color="error">IMMEDIATE ATTENTION</Tag>
                  }
                ]}
              />
            </Card>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 5: DAILY CONTENT UPLOADER (EXISTING) */}
      {/* ======================================================== */}
      {activeTab === 'upload' && (
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleUploadSubmit}
          initialValues={{ dayNumber: 1, category: 'story' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item 
                name="dayNumber" 
                label={<Text strong style={{ fontSize: '12px' }}>Calendar Day (1-280)</Text>}
                rules={[{ required: true, message: 'Please enter day number' }]}
              >
                <InputNumber min={1} max={280} style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item 
                name="category" 
                label={<Text strong style={{ fontSize: '12px' }}>Category</Text>}
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Select.Option value="story">📖 Story</Select.Option>
                  <Select.Option value="video">🎥 Video</Select.Option>
                  <Select.Option value="music">🎵 Lullaby</Select.Option>
                  <Select.Option value="yoga">🧘‍♀️ Yoga</Select.Option>
                  <Select.Option value="recipe">🥗 Recipe</Select.Option>
                  <Select.Option value="mantra">🕉️ Mantra</Select.Option>
                  <Select.Option value="article">📚 Article</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="titleEn" 
            label={<Text strong style={{ fontSize: '12px' }}>Title (English)</Text>}
            rules={[{ required: true, message: 'Please enter English title' }]}
          >
            <Input size="large" placeholder="Enter title in English" />
          </Form.Item>

          <Form.Item 
            name="titleHi" 
            label={<Text strong style={{ fontSize: '12px' }}>Title (Hindi)</Text>}
            rules={[{ required: true, message: 'Please enter Hindi title' }]}
          >
            <Input size="large" placeholder="Enter title in Hindi" />
          </Form.Item>

          <Form.Item 
            name="bodyEn" 
            label={<Text strong style={{ fontSize: '12px' }}>Body Text (English)</Text>}
            rules={[{ required: true, message: 'Please enter English body' }]}
          >
            <TextArea rows={3} placeholder="Enter description in English" />
          </Form.Item>

          <Form.Item 
            name="bodyHi" 
            label={<Text strong style={{ fontSize: '12px' }}>Body Text (Hindi)</Text>}
            rules={[{ required: true, message: 'Please enter Hindi body' }]}
          >
            <TextArea rows={3} placeholder="Enter description in Hindi" />
          </Form.Item>

          <Form.Item 
            name="mediaUrl" 
            label={<Text strong style={{ fontSize: '12px' }}>Media URL (e.g. YouTube, MP3 link)</Text>}
          >
            <Input size="large" placeholder="https://..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              loading={submitting}
              icon={<PlusCircleOutlined />}
              style={{ height: '48px', fontWeight: 'bold', background: '#be123c', borderColor: '#be123c' }}
            >
              Upload Content Calendar Item
            </Button>
          </Form.Item>
        </Form>
      )}
    </Card>
  );
}

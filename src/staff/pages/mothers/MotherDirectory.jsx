import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Table, Card, Input, Select, Button, Space, Drawer, Form, 
  Descriptions, Alert, Spin, Tag, Typography, Select as AntSelect, 
  InputNumber, Divider, Row, Col 
} from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined, MessageOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { StatusTag } from '../../../admin/components/StatusTag';

const { Title, Text, Paragraph } = Typography;

const GET_MOTHERS_PAGINATED = gql`
  query AdminGetUsers(
    $page: Int
    $pageSize: Int
    $search: String
    $status: String
    $role: String
    $centerId: ID
    $sortField: String
    $sortDirection: String
  ) {
    adminGetUsers(
      page: $page
      pageSize: $pageSize
      search: $search
      status: $status
      role: $role
      centerId: $centerId
      sortField: $sortField
      sortDirection: $sortDirection
    ) {
      items {
        id
        emailAddress
        displayName
        firstName
        lastName
        isActive
        mobileNo
        currentWeek
        currentTrimester
        pregnancyDay
        subscriptionStatus
        role {
          id
          name
          roleType
        }
        center {
          id
          name
        }
      }
      total
    }
  }
`;

const GET_ROLES = gql`
  query GetRolesForMothers {
    getRoles {
      id
      roleType
    }
  }
`;

const GET_MEMBER_PROGRESS_QUERY = gql`
  query GetMemberProgress($dayNumber: Int!, $userId: ID!) {
    myDailyProgress(dayNumber: $dayNumber, userId: $userId) {
      id
      dayNumber
      pqCompleted
      iqCompleted
      eqCompleted
      sqCompleted
      pqDurationMins
      iqDurationMins
      eqDurationMins
      sqDurationMins
      pqEvidence
      iqEvidence
      eqEvidence
      sqEvidence
      pqNotes
      iqNotes
      eqNotes
      sqNotes
      pqFeedback
      iqFeedback
      eqFeedback
      sqFeedback
    }
  }
`;

const SUBMIT_COACHING_FEEDBACK_MUTATION = gql`
  mutation SubmitCoachingFeedback($progressId: ID!, $quotient: String!, $feedback: String!) {
    submitCoachingFeedback(progressId: $progressId, quotient: $quotient, feedback: $feedback) {
      id
      pqFeedback
      iqFeedback
      eqFeedback
      sqFeedback
    }
  }
`;

export default function MotherDirectory({ user }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMother, setSelectedMother] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Active Daily Progress timeline states
  const [progressDay, setProgressDay] = useState(1);
  const [feedbackQuotient, setFeedbackQuotient] = useState('pq');
  const [coachingFeedbackText, setCoachingFeedbackText] = useState('');

  // 1. Fetch Mother Role
  const { data: roleData } = useQuery(GET_ROLES);
  const motherRole = roleData?.getRoles?.find(r => r.roleType === 'MOTHER');
  const motherRoleId = motherRole?.id;

  // 2. Fetch Paginated Mothers (only showing users of MOTHER role)
  const { data, loading, error, refetch } = useQuery(GET_MOTHERS_PAGINATED, {
    variables: {
      page,
      pageSize,
      search: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      role: motherRoleId || undefined,
      sortField: 'inserted',
      sortDirection: 'DESC'
    },
    skip: !motherRoleId,
    fetchPolicy: 'network-only'
  });

  // 3. Fetch Selected Mother's Daily Progress
  const { data: progressData, loading: loadingProgress, refetch: refetchProgress } = useQuery(GET_MEMBER_PROGRESS_QUERY, {
    variables: { dayNumber: progressDay, userId: selectedMother?.id },
    skip: !selectedMother || !progressDay,
    fetchPolicy: 'network-only'
  });

  // 4. Submit Coaching Feedback
  const [submitFeedback, { loading: submittingFeedback }] = useMutation(SUBMIT_COACHING_FEEDBACK_MUTATION, {
    onCompleted: () => {
      refetchProgress();
      setCoachingFeedbackText('');
      toast.success('Coaching feedback submitted successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleOpenDrawer = (record) => {
    setSelectedMother(record);
    setProgressDay(record.pregnancyDay || 1);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedMother(null);
  };

  const handleFeedbackSubmit = async () => {
    const progressId = progressData?.myDailyProgress?.id;
    if (!progressId) {
      toast.error('No progress record logged for this day yet.');
      return;
    }
    if (!coachingFeedbackText.trim()) {
      toast.error('Please enter feedback notes.');
      return;
    }
    await submitFeedback({
      variables: {
        progressId,
        quotient: feedbackQuotient,
        feedback: coachingFeedbackText.trim()
      }
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <span style={{ fontWeight: 500, color: '#be123c' }}>{text || `${record.firstName || ''} ${record.lastName || ''}`}</span>
      )
    },
    {
      title: 'Email',
      dataIndex: 'emailAddress',
      key: 'emailAddress'
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNo',
      key: 'mobileNo',
      render: (text) => text || '-'
    },
    {
      title: 'Trimester',
      dataIndex: 'currentTrimester',
      key: 'currentTrimester',
      render: (val) => val ? `Trimester ${val}` : '-'
    },
    {
      title: 'Pregnancy Week',
      dataIndex: 'currentWeek',
      key: 'currentWeek',
      render: (val) => val ? `Week ${val}` : '-'
    },
    {
      title: 'Subscription',
      dataIndex: 'subscriptionStatus',
      key: 'subscriptionStatus',
      render: (status) => (
        <Tag color={status === 'premium' ? 'gold' : 'blue'}>
          {status ? status.toUpperCase() : 'FREE'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => <StatusTag active={active} />
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EditOutlined />} 
          onClick={() => handleOpenDrawer(record)}
        >
          Coaching Log
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card 
        title="Mother Directory"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Reload</Button>
        }
        style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        {error && (
          <Alert
            message="Unable to load data. Please retry."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search mothers by name/email/phone..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: '300px' }}
          />

          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            style={{ width: '150px' }}
          >
            <Select.Option value="all">All Accounts</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={data?.adminGetUsers?.items || []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.adminGetUsers?.total || 0,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true
          }}
        />
      </Card>

      {/* Mother Details & Coaching Drawer */}
      <Drawer
        title={`Coaching & Progress Logs: ${selectedMother?.displayName || ''}`}
        width={720}
        onClose={handleCloseDrawer}
        open={drawerOpen}
        destroyOnClose
      >
        {selectedMother && (
          <div>
            <Descriptions title="Mother Information" bordered column={2}>
              <Descriptions.Item label="Pregnancy Day">{selectedMother.pregnancyDay || '-'}</Descriptions.Item>
              <Descriptions.Item label="Pregnancy Week">{selectedMother.currentWeek || '-'}</Descriptions.Item>
              <Descriptions.Item label="Trimester">{selectedMother.currentTrimester || '-'}</Descriptions.Item>
              <Descriptions.Item label="Language">{selectedMother.language?.toUpperCase() || 'EN'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={4}>Daily Journey Logs</Title>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <Text>Pregnancy Day:</Text>
              <InputNumber
                min={1}
                max={280}
                value={progressDay}
                onChange={(val) => setProgressDay(val)}
              />
              <Button type="primary" onClick={() => refetchProgress()} loading={loadingProgress}>
                Load Day Logs
              </Button>
            </div>

            {loadingProgress ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}><Spin /></div>
            ) : progressData?.myDailyProgress ? (
              <div>
                <Row gutter={[16, 16]}>
                  {['pq', 'iq', 'eq', 'sq'].map((q) => {
                    const prefix = q.toUpperCase();
                    const completed = progressData.myDailyProgress[`${q}Completed`];
                    const duration = progressData.myDailyProgress[`${q}DurationMins`];
                    const notes = progressData.myDailyProgress[`${q}Notes`];
                    const evidence = progressData.myDailyProgress[`${q}Evidence`];
                    const feedback = progressData.myDailyProgress[`${q}Feedback`];

                    return (
                      <Col xs={24} key={q}>
                        <Card 
                          size="small"
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{prefix} Quotient Tasks</span>
                              <Tag color={completed ? 'success' : 'default'}>
                                {completed ? `Completed (${duration} mins)` : 'Pending'}
                              </Tag>
                            </div>
                          }
                        >
                          <Paragraph><strong>Notes/Evidence:</strong> {notes || evidence || '-'}</Paragraph>
                          {feedback && (
                            <Alert
                              message="Coaching Feedback Given"
                              description={feedback}
                              type="info"
                              showIcon
                              style={{ marginTop: 8 }}
                            />
                          )}
                        </Card>
                      </Col>
                    );
                  })}
                </Row>

                <Divider />

                <Title level={4}>Add Coaching Feedback</Title>
                <Form layout="vertical" onFinish={handleFeedbackSubmit}>
                  <Form.Item label="Select Quotient for Feedback" required>
                    <Select value={feedbackQuotient} onChange={(val) => setFeedbackQuotient(val)}>
                      <Select.Option value="pq">Physical (PQ)</Select.Option>
                      <Select.Option value="iq">Intellectual (IQ)</Select.Option>
                      <Select.Option value="eq">Emotional (EQ)</Select.Option>
                      <Select.Option value="sq">Spiritual (SQ)</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Coaching Guidance Notes" required>
                    <Input.TextArea
                      rows={4}
                      placeholder="Write guidance or feedback for this quotient..."
                      value={coachingFeedbackText}
                      onChange={(e) => setCoachingFeedbackText(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={submittingFeedback}
                      disabled={!coachingFeedbackText.trim()}
                    >
                      Submit Feedback Notes
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            ) : (
              <Alert
                message="No logs recorded by mother for this day yet."
                type="info"
                showIcon
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

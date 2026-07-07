import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { 
  Card, Table, Button, Input, Select, Tag, Space, Modal, Form, 
  Typography, Row, Col, Tabs, Drawer, List, Divider, Checkbox, DatePicker, Tooltip, Alert
} from 'antd';
import { 
  SearchOutlined, MessageOutlined, CheckCircleOutlined, InfoCircleOutlined,
  UserOutlined, BookOutlined, HistoryOutlined, PlusOutlined, DeleteOutlined, 
  CalendarOutlined, CheckOutlined, AlertOutlined, SmileOutlined
} from '@ant-design/icons';
import { 
  GET_INQUIRIES, REPLY_TO_INQUIRY, UPDATE_INQUIRY_STATUS 
} from '../features/inquiries/inquiryOperations';
import { gql } from '@apollo/client';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

// Staff Dashboard GQL Queries & Mutations
const GET_CRM_USERS_QUERY = gql`
  query GetCrmUsers {
    getCrmUsers {
      id
      displayName
      email
      phone
      pregnancyStartDate
      pregnancyDay
      role {
        roleType
      }
      subscriptions {
        id
        status
        plan {
          name
        }
      }
    }
  }
`;

const GET_CRM_NOTES_QUERY = gql`
  query GetCrmNotes($userId: ID!) {
    getCrmNotes(userId: $userId) {
      id
      note
      createdAt
      author {
        displayName
      }
    }
  }
`;

const ADD_CRM_NOTE_MUTATION = gql`
  mutation AddCrmNote($userId: ID!, $note: String!) {
    addCrmNote(userId: $userId, note: $note) {
      id
      note
    }
  }
`;

const GET_AUDIT_LOGS_QUERY = gql`
  query GetAuditLogs {
    getAuditLogs {
      id
      action
      targetType
      targetId
      payload
      createdAt
      user {
        displayName
        email
      }
    }
  }
`;

const MANAGE_CONTENT_QUERY = gql`
  query ManageContent {
    manageContent {
      id
      slug
      contentType
      status
      medicalReviewed
      translations {
        id
        language
        title
      }
    }
  }
`;

const REVIEW_CONTENT_ITEM_MUTATION = gql`
  mutation ReviewContentItem($id: ID!, $reviewed: Boolean!) {
    reviewContentItem(id: $id, reviewed: $reviewed) {
      id
      medicalReviewed
    }
  }
`;

// NEW operations for Staff Tasks, Classes, and Attendance
const GET_STAFF_TASKS_QUERY = gql`
  query GetStaffTasks {
    getStaffTasks {
      id
      title
      description
      dueDate
      completed
      createdAt
      user {
        id
        displayName
        emailAddress
      }
    }
  }
`;

const CREATE_STAFF_TASK_MUTATION = gql`
  mutation CreateStaffTask($userId: ID, $title: String!, $description: String, $dueDate: String) {
    createStaffTask(userId: $userId, title: $title, description: $description, dueDate: $dueDate) {
      id
      title
      completed
    }
  }
`;

const TOGGLE_STAFF_TASK_MUTATION = gql`
  mutation ToggleStaffTask($id: ID!) {
    toggleStaffTask(id: $id) {
      id
      completed
    }
  }
`;

const DELETE_STAFF_TASK_MUTATION = gql`
  mutation DeleteStaffTask($id: ID!) {
    deleteStaffTask(id: $id)
  }
`;

const GET_LIVE_CLASSES_QUERY = gql`
  query GetLiveClasses {
    getLiveClassesDetailed {
      id
      title
      instructor
      startTime
      durationMins
    }
  }
`;

const GET_CLASS_BOOKINGS_QUERY = gql`
  query GetClassBookings($classId: ID!) {
    getLiveClassBookings(classId: $classId) {
      userId
      liveClassId
      attended
      user {
        id
        displayName
        emailAddress
        mobileNo
      }
    }
  }
`;

const RECORD_ATTENDANCE_MUTATION = gql`
  mutation RecordClassAttendance($classId: ID!, $userId: ID!, $attended: Boolean!) {
    recordClassAttendance(classId: $classId, userId: $userId, attended: $attended) {
      userId
      liveClassId
      attended
    }
  }
`;

export default function StaffConsole({ isHi }) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedInqId, setSelectedInqId] = useState(null);

  // CRM & Drawers
  const [selectedUser, setSelectedUser] = useState(null);
  const [crmSearch, setCrmSearch] = useState('');
  const [newCrmNote, setNewCrmNote] = useState('');

  // Staff Reminders/Tasks state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(null);
  const [newTaskMemberId, setNewTaskMemberId] = useState(null);

  // Class Attendance state
  const [selectedClassId, setSelectedClassId] = useState(null);

  // Queries & Mutations
  const { data: ticketData, loading: ticketsLoading, refetch: refetchTickets } = useQuery(GET_INQUIRIES, {
    variables: { status: null, limit: 100, offset: 0 },
    fetchPolicy: 'network-only',
  });
  const [updateInquiryStatus] = useMutation(UPDATE_INQUIRY_STATUS, { onCompleted: () => refetchTickets() });
  const [replyToInquiry] = useMutation(REPLY_TO_INQUIRY, { 
    onCompleted: () => { 
      refetchTickets(); 
      setReplyText(''); 
      setSelectedInqId(null); 
      toast.success("Reply recorded and ticket resolved!"); 
    } 
  });

  const crmUsersQuery = useQuery(GET_CRM_USERS_QUERY, { 
    skip: activeTab !== 'crm' && activeTab !== 'followups' && activeTab !== 'reminders'
  });
  const manageContentQuery = useQuery(MANAGE_CONTENT_QUERY, { skip: activeTab !== 'review' });
  const [reviewContent] = useMutation(REVIEW_CONTENT_ITEM_MUTATION, { 
    onCompleted: () => { 
      manageContentQuery.refetch(); 
      toast.success('Content medical review updated'); 
    } 
  });

  const crmNotesQuery = useQuery(GET_CRM_NOTES_QUERY, {
    variables: { userId: selectedUser?.id },
    skip: !selectedUser
  });
  const auditLogsQuery = useQuery(GET_AUDIT_LOGS_QUERY, { skip: activeTab !== 'audit' });

  const [addCrmNote] = useMutation(ADD_CRM_NOTE_MUTATION, {
    onCompleted: () => {
      crmNotesQuery.refetch();
      setNewCrmNote('');
      toast.success('Clinical coaching note saved');
    }
  });

  // NEW hooks for Tasks, Classes, and Attendance
  const staffTasksQuery = useQuery(GET_STAFF_TASKS_QUERY, { 
    skip: activeTab !== 'reminders' && activeTab !== 'followups'
  });
  const liveClassesQuery = useQuery(GET_LIVE_CLASSES_QUERY, { skip: activeTab !== 'attendance' });
  const classBookingsQuery = useQuery(GET_CLASS_BOOKINGS_QUERY, {
    variables: { classId: selectedClassId },
    skip: !selectedClassId || activeTab !== 'attendance'
  });

  const [createStaffTask, { loading: creatingTask }] = useMutation(CREATE_STAFF_TASK_MUTATION, {
    onCompleted: () => {
      staffTasksQuery.refetch();
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDueDate(null);
      setNewTaskMemberId(null);
      toast.success(isHi ? 'कार्य सफलतापूर्वक जोड़ा गया!' : 'Task added successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [toggleStaffTask] = useMutation(TOGGLE_STAFF_TASK_MUTATION, {
    onCompleted: () => staffTasksQuery.refetch(),
    onError: (err) => toast.error(err.message)
  });

  const [deleteStaffTask] = useMutation(DELETE_STAFF_TASK_MUTATION, {
    onCompleted: () => {
      staffTasksQuery.refetch();
      toast.success(isHi ? 'कार्य हटाया गया!' : 'Task deleted successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [recordClassAttendance] = useMutation(RECORD_ATTENDANCE_MUTATION, {
    onCompleted: () => {
      classBookingsQuery.refetch();
      toast.success(isHi ? 'उपस्थिति दर्ज की गई!' : 'Attendance updated!');
    },
    onError: (err) => toast.error(err.message)
  });

  // Data processing
  const inquiries = ticketData?.getInquiries?.items || [];
  const crmUsers = crmUsersQuery.data?.getCrmUsers || [];
  const crmNotes = crmNotesQuery.data?.getCrmNotes || [];
  const auditLogs = auditLogsQuery.data?.getAuditLogs || [];
  const staffTasks = staffTasksQuery.data?.getStaffTasks || [];
  const liveClasses = liveClassesQuery.data?.getLiveClassesDetailed || [];
  const classBookings = classBookingsQuery.data?.getLiveClassBookings || [];

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateInquiryStatus({ variables: { id, status: newStatus } });
      toast.success(`Ticket status updated to ${newStatus}!`);
    } catch (mutationError) {
      toast.error(mutationError.message);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await replyToInquiry({ variables: { id: selectedInqId, content: replyText.trim() } });
    } catch (mutationError) {
      toast.error(mutationError.message);
    }
  };

  const handleAddCrmNoteSubmit = async () => {
    if (!newCrmNote.trim() || !selectedUser) return;
    try {
      await addCrmNote({ variables: { userId: selectedUser.id, note: newCrmNote.trim() } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateTaskSubmit = () => {
    if (!newTaskTitle.trim()) {
      toast.error(isHi ? 'कार्य का शीर्षक दर्ज करें!' : 'Please enter a task title');
      return;
    }
    createStaffTask({
      variables: {
        userId: newTaskMemberId,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || null,
        dueDate: newTaskDueDate ? newTaskDueDate.toISOString() : null
      }
    });
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesStatus = filterStatus === 'all' || inq.status === filterStatus;
    const query = searchQuery.toLowerCase();
    return matchesStatus && (
      inq.name.toLowerCase().includes(query) ||
      (inq.email || '').toLowerCase().includes(query) ||
      inq.phone.toLowerCase().includes(query)
    );
  });

  const filteredCrmUsers = crmUsers.filter(u => {
    const q = crmSearch.toLowerCase();
    return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q);
  });

  // Filter only mothers who are registered
  const mothers = crmUsers.filter(u => u.role?.roleType === 'MOTHER' || !u.role);

  // Follow-up Queue Logic (e.g. show warning if pregnancy Day is set, but no clinical note or task created recently)
  const followUpQueueData = mothers.map(mother => {
    // Check if she has any pending tasks
    const pendingTasksCount = staffTasks.filter(t => t.user?.id === mother.id && !t.completed).length;
    // Mock risk assessment: flag if pregnancyDay > 200 (near due date) or if no notes added
    const needsUrgentFollowup = pendingTasksCount > 0 || mother.pregnancyDay > 220;

    return {
      ...mother,
      pendingTasksCount,
      needsUrgentFollowup
    };
  });

  const selectedInq = inquiries.find(i => i.id === selectedInqId);

  const ticketColumns = [
    {
      title: 'Sender & Message',
      key: 'sender',
      render: (_, record) => (
        <div>
          <Space>
            <Text strong style={{ fontSize: '13px' }}>{record.name}</Text>
            <Tag color={
              record.status === 'pending' ? 'orange' : 
              record.status === 'in_progress' ? 'blue' : 'green'
            }>
              {record.status.toUpperCase().replace('_', ' ')}
            </Tag>
          </Space>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {record.email} | {record.phone}
          </div>
          <Paragraph type="secondary" style={{ fontStyle: 'italic', fontSize: '12px', margin: '8px 0 0 0', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
            "{record.message}"
          </Paragraph>
          {record.responses?.map((response) => (
            <div key={response.id} style={{ fontSize: '11px', paddingLeft: '12px', borderLeft: '2px solid #cbd5e1', marginTop: '6px', color: '#475569' }}>
              <strong>{response.author?.displayName || 'Staff'}:</strong> "{response.content}"
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          {record.status !== 'resolved' && (
            <Button 
              type="primary" 
              icon={<MessageOutlined />} 
              block 
              onClick={() => setSelectedInqId(record.id)}
              style={{ background: '#be123c', borderColor: '#be123c' }}
            >
              Reply & Resolve
            </Button>
          )}
          <Select 
            value={record.status} 
            onChange={(val) => handleUpdateStatus(record.id, val)}
            style={{ width: '100%' }}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="resolved">Resolved</Select.Option>
          </Select>
        </Space>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>🩺 {isHi ? "चिकित्सीय एवं प्रशासनिक कंसोल" : "Clinical & Coaching Console"}</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
            Manage user directories, clinical notes logs, ticket inquiries, and live class attendance lists.
          </Paragraph>
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          { key: 'tickets', label: '📞 Member Inquiries' },
          { key: 'crm', label: '👥 CRM Member Directory' },
          { key: 'followups', label: '🚨 Member Follow-up Queue' },
          { key: 'reminders', label: '📋 Tasks & Reminders' },
          { key: 'attendance', label: '📅 Class Attendance' },
          { key: 'review', label: '🩺 Medical Article Review' },
          { key: 'audit', label: '🛡️ Security Audit Trail' }
        ]}
        style={{ marginBottom: '24px' }}
      />

      {/* 1. TICKETS TAB */}
      {activeTab === 'tickets' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Input 
              placeholder="Search by name, email or phone..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              style={{ flex: 1, minWidth: '240px', borderRadius: '10px' }}
            />
            <Select 
              value={filterStatus} 
              onChange={setFilterStatus}
              style={{ width: '160px' }}
            >
              <Select.Option value="all">All Tickets</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="resolved">Resolved</Select.Option>
            </Select>
          </div>

          <Table 
            dataSource={filteredInquiries} 
            columns={ticketColumns} 
            rowKey="id"
            loading={ticketsLoading}
            pagination={{ pageSize: 10 }}
            style={{ borderRadius: '12px', overflow: 'hidden' }}
          />
        </div>
      )}

      {/* 2. CRM DIRECTORY */}
      {activeTab === 'crm' && (
        <div>
          <Input 
            placeholder="Search CRM by name, email or phone..." 
            value={crmSearch}
            onChange={e => setCrmSearch(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ marginBottom: '20px', borderRadius: '10px' }}
          />

          <Table
            dataSource={filteredCrmUsers}
            rowKey="id"
            columns={[
              {
                title: 'Name',
                dataIndex: 'displayName',
                key: 'displayName',
                render: (text, record) => (
                  <div>
                    <Text strong>{text}</Text>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{record.email}</div>
                  </div>
                )
              },
              {
                title: 'Pregnancy Day',
                dataIndex: 'pregnancyDay',
                key: 'pregnancyDay',
                render: (day) => day ? `Day ${day}` : 'Not set'
              },
              {
                title: 'Subscription Status',
                key: 'sub',
                render: (_, record) => {
                  const sub = record.subscriptions?.[0];
                  if (!sub) return <Tag color="gray">Free Tier</Tag>;
                  return <Tag color="rose">{sub.plan?.name} ({sub.status.toUpperCase()})</Tag>;
                }
              },
              {
                title: 'Action',
                key: 'action',
                render: (_, record) => (
                  <Button type="link" icon={<UserOutlined />} onClick={() => setSelectedUser(record)}>
                    View clinical profile
                  </Button>
                )
              }
            ]}
          />
        </div>
      )}

      {/* 3. MEMBER FOLLOW-UP QUEUE */}
      {activeTab === 'followups' && (
        <div>
          <Alert 
            message="Active Clinical Guidance Queue" 
            description="Mothers near their final trimester or having pending follow-up items are automatically highlighted." 
            type="info" 
            showIcon 
            style={{ marginBottom: 20, borderRadius: 12 }}
          />
          <Table
            dataSource={followUpQueueData}
            rowKey="id"
            columns={[
              {
                title: 'Mother',
                dataIndex: 'displayName',
                key: 'name',
                render: (val, record) => (
                  <div>
                    <Text strong>{val}</Text>
                    <div style={{ fontSize: 11, color: '#888' }}>{record.email}</div>
                  </div>
                )
              },
              {
                title: 'Pregnancy Status',
                key: 'pregnancy',
                render: (_, record) => (
                  <div>
                    <Tag color={record.pregnancyDay > 200 ? 'orange' : 'blue'}>
                      Day {record.pregnancyDay || 'Not set'}
                    </Tag>
                    {record.pregnancyDay > 200 && <Tag color="red">3rd Trimester</Tag>}
                  </div>
                )
              },
              {
                title: 'Urgency Priority',
                key: 'urgency',
                render: (_, record) => (
                  record.needsUrgentFollowup ? (
                    <Tag icon={<AlertOutlined />} color="error">HIGH PRIORITY</Tag>
                  ) : (
                    <Tag color="success">NORMAL</Tag>
                  )
                )
              },
              {
                title: 'Action',
                key: 'action',
                render: (_, record) => (
                  <Space>
                    <Button 
                      type="primary" 
                      size="small" 
                      onClick={() => {
                        setNewTaskMemberId(record.id);
                        setNewTaskTitle(`Follow up contact with ${record.displayName}`);
                        setActiveTab('reminders');
                      }}
                      style={{ background: '#be123c', borderColor: '#be123c' }}
                    >
                      Schedule Follow-up
                    </Button>
                    <Button 
                      size="small" 
                      icon={<PlusOutlined />} 
                      onClick={() => setSelectedUser(record)}
                    >
                      Add Note
                    </Button>
                  </Space>
                )
              }
            ]}
          />
        </div>
      )}

      {/* 4. TASKS & REMINDERS */}
      {activeTab === 'reminders' && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card title="Add Administrative Reminder" style={{ borderRadius: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong style={{ fontSize: 12 }}>Task Title</Text>
                  <Input 
                    placeholder="e.g. Call sneha for diet consult..." 
                    value={newTaskTitle} 
                    onChange={e => setNewTaskTitle(e.target.value)}
                    style={{ marginTop: 6 }}
                  />
                </div>
                <div>
                  <Text strong style={{ fontSize: 12 }}>Description</Text>
                  <TextArea 
                    placeholder="Add details, clinical flags, contact notes..." 
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    rows={3}
                    style={{ marginTop: 6 }}
                  />
                </div>
                <div>
                  <Text strong style={{ fontSize: 12 }}>Assign to Member (Optional)</Text>
                  <Select 
                    placeholder="Select mother..." 
                    value={newTaskMemberId} 
                    onChange={setNewTaskMemberId}
                    style={{ width: '100%', marginTop: 6 }}
                    allowClear
                  >
                    {mothers.map(m => (
                      <Select.Option key={m.id} value={m.id}>{m.displayName}</Select.Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Text strong style={{ fontSize: 12 }}>Due Date (Optional)</Text>
                  <DatePicker 
                    style={{ width: '100%', marginTop: 6 }} 
                    value={newTaskDueDate} 
                    onChange={setNewTaskDueDate}
                  />
                </div>
                <Button 
                  type="primary" 
                  block 
                  icon={<PlusOutlined />} 
                  loading={creatingTask}
                  onClick={handleCreateTaskSubmit}
                  style={{ background: '#be123c', borderColor: '#be123c' }}
                >
                  Create Task
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={16}>
            <Card title="Active To-Do Checklist" style={{ borderRadius: 16 }}>
              <List
                dataSource={staffTasks}
                locale={{ emptyText: 'No pending reminders for today!' }}
                renderItem={task => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => deleteStaffTask({ variables: { id: task.id } })} 
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Checkbox 
                          checked={task.completed} 
                          onChange={() => toggleStaffTask({ variables: { id: task.id } })}
                        />
                      }
                      title={
                        <Space>
                          <Text delete={task.completed} strong={!task.completed}>
                            {task.title}
                          </Text>
                          {task.user && (
                            <Tag color="cyan" icon={<UserOutlined />}>{task.user.displayName}</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          {task.description && <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{task.description}</Text>}
                          {task.dueDate && (
                            <Text style={{ fontSize: 11, color: '#f27a54' }}>
                              <CalendarOutlined /> Due: {new Date(task.dueDate).toLocaleDateString()}
                            </Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 5. CLASS ATTENDANCE WIDGET */}
      {activeTab === 'attendance' && (
        <Card title="Class Attendance Roster" style={{ borderRadius: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong style={{ fontSize: 13, marginRight: 12 }}>Select Session:</Text>
              <Select 
                placeholder="Choose live class..." 
                style={{ width: '300px' }} 
                onChange={setSelectedClassId}
                value={selectedClassId}
              >
                {liveClasses.map(c => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.title} ({c.instructor}) - {new Date(c.startTime).toLocaleDateString()}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {selectedClassId ? (
              <Table
                dataSource={classBookings}
                rowKey="userId"
                locale={{ emptyText: 'No members booked this class yet.' }}
                columns={[
                  {
                    title: 'Attendee Name',
                    dataIndex: 'user',
                    key: 'user',
                    render: (user) => user ? (
                      <div>
                        <Text strong>{user.displayName}</Text>
                        <div style={{ fontSize: 11, color: '#666' }}>{user.emailAddress} · {user.mobileNo}</div>
                      </div>
                    ) : 'Unknown User'
                  },
                  {
                    title: 'Status',
                    key: 'status',
                    render: (_, record) => (
                      <Tag color={record.attended ? 'success' : 'default'}>
                        {record.attended ? 'PRESENT' : 'ABSENT'}
                      </Tag>
                    )
                  },
                  {
                    title: 'Mark Attendance',
                    key: 'action',
                    render: (_, record) => (
                      <Checkbox 
                        checked={record.attended}
                        onChange={(e) => {
                          recordClassAttendance({
                            variables: {
                              classId: selectedClassId,
                              userId: record.userId,
                              attended: e.target.checked
                            }
                          });
                        }}
                      >
                        Mark Present
                      </Checkbox>
                    )
                  }
                ]}
              />
            ) : (
              <Alert 
                type="warning" 
                message="Please select an upcoming or completed class to view the attendee roster." 
                showIcon 
              />
            )}
          </Space>
        </Card>
      )}

      {/* 6. SECURITY AUDIT */}
      {activeTab === 'audit' && (
        <Table
          dataSource={auditLogs}
          rowKey="id"
          columns={[
            {
              title: 'Staff/Admin',
              key: 'user',
              render: (_, record) => `${record.user?.displayName} (${record.user?.email})`
            },
            {
              title: 'Action',
              dataIndex: 'action',
              key: 'action',
              render: (act) => <Tag color="blue">{act.toUpperCase()}</Tag>
            },
            {
              title: 'Target ID',
              key: 'target',
              render: (_, record) => `${record.targetType || ''} (${record.targetId || ''})`
            },
            {
              title: 'Timestamp',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (t) => new Date(t).toLocaleString()
            }
          ]}
        />
      )}

      {/* 7. MEDICAL REVIEW */}
      {activeTab === 'review' && (
        <Table
          dataSource={manageContentQuery.data?.manageContent || []}
          rowKey="id"
          columns={[
            {
              title: 'Article / Guide Title',
              key: 'title',
              render: (_, record) => {
                const translation = record.translations?.find(t => t.language === 'en') || record.translations?.[0];
                return (
                  <div>
                    <Text strong>{translation?.title || record.slug}</Text>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Type: {record.contentType} · Status: {record.status}</div>
                  </div>
                );
              }
            },
            {
              title: 'Medical Review Status',
              dataIndex: 'medicalReviewed',
              key: 'medicalReviewed',
              render: (reviewed) => (
                <Tag color={reviewed ? 'green' : 'red'}>
                  {reviewed ? 'APPROVED CLINICAL GUIDE' : 'PENDING REVIEW'}
                </Tag>
              )
            },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Space>
                  {!record.medicalReviewed ? (
                    <Button 
                      size="small" 
                      type="primary" 
                      onClick={() => reviewContent({ variables: { id: record.id, reviewed: true } })}
                      style={{ background: '#be123c', borderColor: '#be123c' }}
                    >
                      Approve Clinical Guide
                    </Button>
                  ) : (
                    <Button 
                      size="small" 
                      onClick={() => reviewContent({ variables: { id: record.id, reviewed: false } })}
                    >
                      Revoke Approval
                    </Button>
                  )}
                </Space>
              )
            }
          ]}
        />
      )}

      {/* Ticket response dialog */}
      <Modal
        title="Reply & Close Ticket Inquiry"
        open={selectedInqId !== null}
        onCancel={() => setSelectedInqId(null)}
        footer={[
          <Button key="cancel" onClick={() => setSelectedInqId(null)}>Cancel</Button>,
          <Button key="send" type="primary" onClick={handleSendReply} style={{ background: '#be123c', borderColor: '#be123c' }}>
            Submit Reply
          </Button>
        ]}
      >
        {selectedInq && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
            <Text><strong>Ticket sender:</strong> {selectedInq.name}</Text>
            <Text><strong>Inquiry message:</strong> "{selectedInq.message}"</Text>
            <TextArea 
              rows={4} 
              placeholder="Type clinical advice or administrative response here..." 
              value={replyText} 
              onChange={e => setReplyText(e.target.value)} 
            />
          </div>
        )}
      </Modal>

      {/* CRM User Clinical profile drawer */}
      <Drawer
        title={`🩺 Clinical Profile - ${selectedUser?.displayName}`}
        width={480}
        onClose={() => setSelectedUser(null)}
        open={selectedUser !== null}
      >
        {selectedUser && (
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={5}>Patient Info</Title>
              <Paragraph style={{ margin: 0 }}>Email: {selectedUser.email}</Paragraph>
              <Paragraph style={{ margin: 0 }}>Phone: {selectedUser.phone || 'Not provided'}</Paragraph>
              <Paragraph style={{ margin: 0 }}>Pregnancy Start: {selectedUser.pregnancyStartDate ? new Date(selectedUser.pregnancyStartDate).toLocaleDateString() : 'Not set'}</Paragraph>
              <Paragraph style={{ margin: 0 }}>Current Day: Day {selectedUser.pregnancyDay || 'Not set'}</Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={5}>Coaching & Clinical Notes</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <TextArea 
                  rows={3} 
                  placeholder="Enter medical coach note, daily diet tweaks, etc..." 
                  value={newCrmNote}
                  onChange={e => setNewCrmNote(e.target.value)}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCrmNoteSubmit} style={{ background: '#be123c', borderColor: '#be123c', alignSelf: 'flex-end' }}>
                  Save Note
                </Button>
              </div>

              <List
                dataSource={crmNotes}
                renderItem={n => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong style={{ fontSize: '12px' }}>{n.author?.displayName} · <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleDateString()}</span></Text>}
                      description={<Text style={{ fontSize: '12px', color: '#334155' }}>"{n.note}"</Text>}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Space>
        )}
      </Drawer>
    </Card>
  );
}

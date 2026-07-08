import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { 
  Card, Table, Button, Input, Select, Tag, Space, Modal, Form, 
  Typography, Row, Col, Tabs, Drawer, List, Divider, Checkbox, DatePicker, Tooltip, Alert, Progress, Badge
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
      reviewedBy
      feedback
      translations {
        id
        language
        title
        summary
        body
      }
    }
  }
`;

const APPROVE_MEDICAL_CONTENT_MUTATION = gql`
  mutation ApproveMedicalContent($id: ID!, $feedback: String) {
    approveMedicalContent(id: $id, feedback: $feedback) {
      id
      status
      medicalReviewed
      reviewedBy
      feedback
    }
  }
`;

const FLAG_MEDICAL_CONTENT_MUTATION = gql`
  mutation FlagMedicalContent($id: ID!, $feedback: String) {
    flagMedicalContent(id: $id, feedback: $feedback) {
      id
      status
      medicalReviewed
      reviewedBy
      feedback
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
      titleEn
      titleHi
      instructor
      startTime
      durationMins
      videoCallUrl
      replayUrl
      centerId
      seriesTitle
      batchName
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

const CREATE_LIVE_CLASS_MUTATION = gql`
  mutation CreateLiveClass($titleEn: String!, $titleHi: String!, $instructor: String!, $startTime: String!, $durationMins: Int!, $videoCallUrl: String!, $seriesTitle: String, $batchName: String, $centerId: ID) {
    createLiveClass(titleEn: $titleEn, titleHi: $titleHi, instructor: $instructor, startTime: $startTime, durationMins: $durationMins, videoCallUrl: $videoCallUrl, seriesTitle: $seriesTitle, batchName: $batchName, centerId: $centerId) {
      id
    }
  }
`;

const UPDATE_LIVE_CLASS_MUTATION = gql`
  mutation UpdateLiveClass($id: ID!, $titleEn: String, $titleHi: String, $instructor: String, $startTime: String, $durationMins: Int, $videoCallUrl: String, $seriesTitle: String, $batchName: String, $replayUrl: String) {
    updateLiveClass(id: $id, titleEn: $titleEn, titleHi: $titleHi, instructor: $instructor, startTime: $startTime, durationMins: $durationMins, videoCallUrl: $videoCallUrl, seriesTitle: $seriesTitle, batchName: $batchName, replayUrl: $replayUrl) {
      id
    }
  }
`;

const DELETE_LIVE_CLASS_MUTATION = gql`
  mutation DeleteLiveClass($id: ID!) {
    deleteLiveClass(id: $id)
  }
`;

const SEND_LIVE_CLASS_REMINDER_MUTATION = gql`
  mutation SendLiveClassReminder($classId: ID!) {
    sendLiveClassReminder(classId: $classId)
  }
`;

const GET_WORKSHEET_SUBMISSIONS_QUERY = gql`
  query GetWorksheetSubmissions {
    getWorksheetSubmissions {
      id
      userId
      userDisplayName
      title
      submittedAt
      fileUrl
      score
      feedback
      status
    }
  }
`;

const GRADE_WORKSHEET_SUBMISSION_MUTATION = gql`
  mutation GradeWorksheetSubmission($id: ID!, $score: Int!, $feedback: String!) {
    gradeWorksheetSubmission(id: $id, score: $score, feedback: $feedback) {
      id
      score
      feedback
      status
    }
  }
`;

const GET_CONTENT_PERFORMANCE_ANALYTICS_QUERY = gql`
  query GetContentPerformanceAnalytics {
    getContentPerformanceAnalytics {
      id
      slug
      contentType
      title
      totalViews
      uniqueViewers
      completionCount
      completionRate
      saveCount
      avgProgress
      dropOffRate
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
  const [selectedDay, setSelectedDay] = useState(1);
  const [feedbackQuotient, setFeedbackQuotient] = useState('PQ');
  const [coachingFeedbackText, setCoachingFeedbackText] = useState('');

  // Medical Review states
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');

  useEffect(() => {
    if (selectedUser) {
      setSelectedDay(selectedUser.pregnancyDay || 1);
    }
  }, [selectedUser]);
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
  const [approveContent, { loading: approvingContent }] = useMutation(APPROVE_MEDICAL_CONTENT_MUTATION, {
    onCompleted: () => {
      manageContentQuery.refetch();
      setSelectedReviewItem(null);
      setReviewFeedback('');
      toast.success('Content clinical review approved!');
    },
    onError: (err) => toast.error(err.message)
  });
  const [flagContent, { loading: flaggingContent }] = useMutation(FLAG_MEDICAL_CONTENT_MUTATION, {
    onCompleted: () => {
      manageContentQuery.refetch();
      setSelectedReviewItem(null);
      setReviewFeedback('');
      toast.success('Content flagged/rejected and returned to Draft.');
    },
    onError: (err) => toast.error(err.message)
  });

  const crmNotesQuery = useQuery(GET_CRM_NOTES_QUERY, {
    variables: { userId: selectedUser?.id },
    skip: !selectedUser
  });

  const memberProgressQuery = useQuery(GET_MEMBER_PROGRESS_QUERY, {
    variables: { dayNumber: selectedDay || 1, userId: selectedUser?.id },
    skip: !selectedUser
  });

  const [submitCoachingFeedback, { loading: submittingFeedback }] = useMutation(SUBMIT_COACHING_FEEDBACK_MUTATION, {
    onCompleted: () => {
      memberProgressQuery.refetch();
      setCoachingFeedbackText('');
      toast.success('Coaching feedback submitted successfully!');
    },
    onError: (err) => toast.error(err.message)
  });
  const auditLogsQuery = useQuery(GET_AUDIT_LOGS_QUERY, { skip: activeTab !== 'audit' });
  const performanceQuery = useQuery(GET_CONTENT_PERFORMANCE_ANALYTICS_QUERY, { skip: activeTab !== 'analytics' });

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

  const worksheetSubmissionsQuery = useQuery(GET_WORKSHEET_SUBMISSIONS_QUERY, {
    skip: activeTab !== 'quizzes'
  });

  const [gradeWorksheetSubmission, { loading: gradingWorksheet }] = useMutation(GRADE_WORKSHEET_SUBMISSION_MUTATION, {
    onCompleted: () => {
      worksheetSubmissionsQuery.refetch();
      setSelectedWorksheet(null);
      setWorksheetScore(null);
      setWorksheetFeedback('');
      toast.success("Worksheet graded successfully!");
    },
    onError: (err) => toast.error(err.message)
  });

  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  const [worksheetScore, setWorksheetScore] = useState(null);
  const [worksheetFeedback, setWorksheetFeedback] = useState('');

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

  const [createLiveClass, { loading: creatingLiveClass }] = useMutation(CREATE_LIVE_CLASS_MUTATION, {
    onCompleted: () => {
      liveClassesQuery.refetch();
      setIsClassModalOpen(false);
      resetClassForm();
      toast.success(isHi ? 'लाइव क्लास जोड़ी गई!' : 'Live class created successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [updateLiveClass, { loading: updatingLiveClass }] = useMutation(UPDATE_LIVE_CLASS_MUTATION, {
    onCompleted: () => {
      liveClassesQuery.refetch();
      setIsClassModalOpen(false);
      resetClassForm();
      toast.success(isHi ? 'लाइव क्लास अपडेट की गई!' : 'Live class updated successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [deleteLiveClass] = useMutation(DELETE_LIVE_CLASS_MUTATION, {
    onCompleted: () => {
      liveClassesQuery.refetch();
      toast.success(isHi ? 'लाइव क्लास हटाई गई!' : 'Live class deleted successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [sendLiveClassReminder, { loading: sendingReminder }] = useMutation(SEND_LIVE_CLASS_REMINDER_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'रिमाइंडर सफलतापूर्वक भेजे गए!' : 'Reminders dispatched successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classTitleEn, setClassTitleEn] = useState('');
  const [classTitleHi, setClassTitleHi] = useState('');
  const [classInstructor, setClassInstructor] = useState('');
  const [classStartTime, setClassStartTime] = useState('');
  const [classDurationMins, setClassDurationMins] = useState(60);
  const [classVideoCallUrl, setClassVideoCallUrl] = useState('');
  const [classReplayUrl, setClassReplayUrl] = useState('');
  const [classSeriesTitle, setClassSeriesTitle] = useState('');
  const [classBatchName, setClassBatchName] = useState('');

  const resetClassForm = () => {
    setEditingClass(null);
    setClassTitleEn('');
    setClassTitleHi('');
    setClassInstructor('');
    setClassStartTime('');
    setClassDurationMins(60);
    setClassVideoCallUrl('');
    setClassReplayUrl('');
    setClassSeriesTitle('');
    setClassBatchName('');
  };

  const handleEditClass = (c) => {
    setEditingClass(c);
    setClassTitleEn(c.titleEn || '');
    setClassTitleHi(c.titleHi || '');
    setClassInstructor(c.instructor || '');
    const date = new Date(c.startTime);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    setClassStartTime(localISOTime);
    setClassDurationMins(c.durationMins || 60);
    setClassVideoCallUrl(c.videoCallUrl || '');
    setClassReplayUrl(c.replayUrl || '');
    setClassSeriesTitle(c.seriesTitle || '');
    setClassBatchName(c.batchName || '');
    setIsClassModalOpen(true);
  };

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

  const handleAddCoachingFeedback = async () => {
    if (!coachingFeedbackText.trim() || !memberProgressQuery.data?.myDailyProgress?.id) {
      toast.error('Progress record not found or feedback is empty');
      return;
    }
    try {
      await submitCoachingFeedback({
        variables: {
          progressId: memberProgressQuery.data.myDailyProgress.id,
          quotient: feedbackQuotient,
          feedback: coachingFeedbackText.trim()
        }
      });
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
          { key: 'quizzes', label: '🧠 Quiz & Worksheets' },
          { key: 'review', label: '🩺 Medical Article Review' },
          { key: 'analytics', label: '📊 Content Analytics' },
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

      {/* 5. CLASS ATTENDANCE & SCHEDULING WIDGET */}
      {activeTab === 'attendance' && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={[20, 20]}>
            {/* Left side: Live Classes Management */}
            <Col xs={24} lg={12}>
              <Card 
                title={isHi ? "लाइव कक्षाएं और कार्यशालाएं" : "Live Classes Scheduling & Management"} 
                style={{ borderRadius: 16 }}
                extra={
                  <Button 
                    type="primary" 
                    onClick={() => { resetClassForm(); setIsClassModalOpen(true); }}
                    style={{ background: '#be123c', borderColor: '#be123c', fontWeight: 'bold' }}
                  >
                    + Add New Class
                  </Button>
                }
              >
                <Table
                  dataSource={liveClasses}
                  rowKey="id"
                  size="small"
                  columns={[
                    {
                      title: 'Class Details',
                      key: 'details',
                      render: (_, record) => {
                        const title = isHi ? record.titleHi : record.titleEn;
                        return (
                          <div>
                            <Text strong style={{ fontSize: 13 }}>{title}</Text>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              Instructor: {record.instructor} · {record.durationMins} mins
                            </div>
                            <div style={{ marginTop: 4 }}>
                              {record.seriesTitle && <Tag color="purple">{record.seriesTitle}</Tag>}
                              {record.batchName && <Tag color="cyan">{record.batchName}</Tag>}
                            </div>
                          </div>
                        );
                      }
                    },
                    {
                      title: 'Start Time',
                      key: 'startTime',
                      render: (_, record) => new Date(record.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <Space size="small">
                          <Button 
                            size="small" 
                            onClick={() => handleEditClass(record)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            type="dashed"
                            danger
                            onClick={() => {
                              Modal.confirm({
                                title: 'Delete Live Class?',
                                content: 'Are you sure you want to delete this class webinar?',
                                onOk: () => deleteLiveClass({ variables: { id: record.id } })
                              });
                            }}
                          >
                            Delete
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedClassId(record.id);
                              classBookingsQuery.refetch();
                            }}
                            type={selectedClassId === record.id ? 'primary' : 'default'}
                            style={selectedClassId === record.id ? { background: '#be123c', borderColor: '#be123c' } : {}}
                          >
                            Roster
                          </Button>
                        </Space>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>

            {/* Right side: Attendance roster for selected class */}
            <Col xs={24} lg={12}>
              <Card 
                title={isHi ? "उपस्थिति रजिस्टर" : "Class Booking & Attendance Roster"} 
                style={{ borderRadius: 16 }}
                extra={
                  selectedClassId && (
                    <Button 
                      size="small"
                      type="primary"
                      loading={sendingReminder}
                      onClick={() => sendLiveClassReminder({ variables: { classId: selectedClassId } })}
                      style={{ background: '#0f766e', borderColor: '#0f766e', fontWeight: 'bold' }}
                    >
                      Send Bookings Reminder
                    </Button>
                  )
                }
              >
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
                    type="info" 
                    message="Please select Roster next to a live class session on the left to inspect booked members and mark attendance." 
                    showIcon 
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Add / Edit Class Modal */}
          <Modal
            title={editingClass ? "Edit Live Class Session" : "Schedule New Live Class"}
            open={isClassModalOpen}
            onCancel={() => { setIsClassModalOpen(false); resetClassForm(); }}
            footer={[
              <Button key="cancel" onClick={() => { setIsClassModalOpen(false); resetClassForm(); }}>Cancel</Button>,
              <Button 
                key="submit" 
                type="primary" 
                loading={creatingLiveClass || updatingLiveClass}
                onClick={() => {
                  if (!classTitleEn || !classTitleHi || !classInstructor || !classStartTime || !classVideoCallUrl) {
                    toast.error("Please fill in all required fields.");
                    return;
                  }
                  const vars = {
                    titleEn: classTitleEn,
                    titleHi: classTitleHi,
                    instructor: classInstructor,
                    startTime: new Date(classStartTime).toISOString(),
                    durationMins: parseInt(classDurationMins),
                    videoCallUrl: classVideoCallUrl,
                    seriesTitle: classSeriesTitle || null,
                    batchName: classBatchName || null
                  };
                  if (editingClass) {
                    updateLiveClass({
                      variables: {
                        id: editingClass.id,
                        ...vars,
                        replayUrl: classReplayUrl || null
                      }
                    });
                  } else {
                    createLiveClass({
                      variables: vars
                    });
                  }
                }}
                style={{ background: '#be123c', borderColor: '#be123c' }}
              >
                {editingClass ? "Save Changes" : "Schedule Class"}
              </Button>
            ]}
          >
            <Form layout="vertical" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Class Title (English) *" required>
                    <Input value={classTitleEn} onChange={e => setClassTitleEn(e.target.value)} placeholder="e.g. Prenatal Yoga for Trimester 2" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Class Title (Hindi) *" required>
                    <Input value={classTitleHi} onChange={e => setClassTitleHi(e.target.value)} placeholder="e.g. गर्भावस्था योग सत्र" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Instructor *" required>
                    <Input value={classInstructor} onChange={e => setClassInstructor(e.target.value)} placeholder="e.g. Dr. Priya Sharma" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Duration (Minutes) *" required>
                    <Input type="number" value={classDurationMins} onChange={e => setClassDurationMins(e.target.value)} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Start Time *" required>
                    <Input type="datetime-local" value={classStartTime} onChange={e => setClassStartTime(e.target.value)} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Video Call URL *" required>
                    <Input value={classVideoCallUrl} onChange={e => setClassVideoCallUrl(e.target.value)} placeholder="e.g. https://meet.google.com/abc" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Series Title (Optional)">
                    <Input value={classSeriesTitle} onChange={e => setClassSeriesTitle(e.target.value)} placeholder="e.g. Yoga Foundation Series" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Batch Segment (Optional)">
                    <Input value={classBatchName} onChange={e => setClassBatchName(e.target.value)} placeholder="e.g. Morning Premium" />
                  </Form.Item>
                </Col>
              </Row>
              {editingClass && (
                <Form.Item label="Replay Video URL (Optional)">
                  <Input value={classReplayUrl} onChange={e => setClassReplayUrl(e.target.value)} placeholder="e.g. https://youtube.com/watch?v=..." />
                </Form.Item>
              )}
            </Form>
          </Modal>
        </Space>
      )}

      {/* 5.5 CONTENT PERFORMANCE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: '16px', background: '#fffaf0', border: '1px solid #ffe8cc' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Total Content Count</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#be123c', marginTop: '4px' }}>
                  {performanceQuery.data?.getContentPerformanceAnalytics?.length || 0}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: '16px', background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Total Engagement Views</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#be123c', marginTop: '4px' }}>
                  {(performanceQuery.data?.getContentPerformanceAnalytics || []).reduce((sum, item) => sum + item.totalViews, 0)}
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: '16px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Top Content Item</Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#be123c', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {performanceQuery.data?.getContentPerformanceAnalytics?.[0]?.title || 'None'}
                </div>
              </Card>
            </Col>
          </Row>

          <Card 
            title={isHi ? "सामग्री प्रदर्शन रिपोर्ट" : "Content Engagement & Performance Analytics"} 
            style={{ borderRadius: '16px' }}
            extra={
              <Space>
                <Button 
                  onClick={() => {
                    const reports = performanceQuery.data?.getContentPerformanceAnalytics || [];
                    const headers = "Title,Slug,Content Type,Total Views,Unique Viewers,Completion Rate (%),Saves Count,Avg Progress (%),Drop-off Rate (%)\n";
                    const rows = reports.map(r => `"${r.title.replace(/"/g, '""')}",${r.slug},${r.contentType},${r.totalViews},${r.uniqueViewers},${r.completionRate},${r.saveCount},${r.avgProgress},${r.dropOffRate}`).join("\n");
                    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `content_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("CSV export downloaded successfully!");
                  }}
                  style={{ background: '#be123c', color: '#fff', borderColor: '#be123c', fontWeight: 'bold' }}
                >
                  Export CSV
                </Button>
                <Button 
                  onClick={() => window.print()}
                  style={{ fontWeight: 'bold' }}
                >
                  Print Report
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={performanceQuery.data?.getContentPerformanceAnalytics || []}
              loading={performanceQuery.loading}
              rowKey="id"
              columns={[
                {
                  title: 'Content Details',
                  key: 'title',
                  render: (_, record) => (
                    <div>
                      <Text strong style={{ fontSize: '13px' }}>{record.title}</Text>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>slug: {record.slug}</div>
                    </div>
                  )
                },
                {
                  title: 'Type',
                  dataIndex: 'contentType',
                  key: 'contentType',
                  render: (t) => <Tag color="purple">{t.toUpperCase()}</Tag>
                },
                {
                  title: 'Total Views',
                  dataIndex: 'totalViews',
                  key: 'totalViews',
                  render: (views) => <Badge count={views} style={{ backgroundColor: '#be123c' }} />
                },
                {
                  title: 'Unique Viewers',
                  dataIndex: 'uniqueViewers',
                  key: 'uniqueViewers',
                },
                {
                  title: 'Completion Rate',
                  key: 'completionRate',
                  render: (_, record) => (
                    <div style={{ width: '130px' }}>
                      <Progress percent={record.completionRate} size="small" strokeColor="#be123c" />
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                        Avg Progress: {record.avgProgress}%
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Saves Count',
                  dataIndex: 'saveCount',
                  key: 'saveCount',
                  render: (c) => <Tag color="cyan">{c} saves</Tag>
                },
                {
                  title: 'Drop-off Rate',
                  dataIndex: 'dropOffRate',
                  key: 'dropOffRate',
                  render: (rate) => (
                    <Tag color={rate > 50 ? 'red' : 'green'}>
                      {rate}% Drop-off
                    </Tag>
                  )
                }
              ]}
            />
          </Card>
        </div>
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
        <div>
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
                key: 'medicalReviewed',
                render: (_, record) => (
                  <Tag color={
                    record.status === 'published' ? 'green' :
                    record.status === 'approved' ? 'cyan' :
                    record.status === 'review' ? 'orange' : 'default'
                  }>
                    {record.status === 'published' ? 'PUBLISHED' :
                     record.status === 'approved' ? 'APPROVED CLINICAL GUIDE' :
                     record.status === 'review' ? 'PENDING CLINICAL REVIEW' : 'DRAFT'}
                  </Tag>
                )
              },
              {
                title: 'Action',
                key: 'action',
                render: (_, record) => (
                  <Button 
                    size="small" 
                    type="primary" 
                    onClick={() => {
                      setSelectedReviewItem(record);
                      setReviewFeedback(record.feedback || '');
                    }}
                    style={{ background: record.status === 'review' ? '#be123c' : '#475569', borderColor: record.status === 'review' ? '#be123c' : '#475569' }}
                  >
                    {record.status === 'review' ? 'Clinical Review' : 'Inspect Details'}
                  </Button>
                )
              }
            ]}
          />

          <Modal
            title={<><InfoCircleOutlined style={{ color: '#be123c' }} /> Clinical & Medical Review Board</>}
            open={!!selectedReviewItem}
            onCancel={() => { setSelectedReviewItem(null); setReviewFeedback(''); }}
            footer={null}
            width={650}
          >
            {selectedReviewItem && (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Resource Key:</Text>
                    <div><Text strong>{selectedReviewItem.slug}</Text></div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Content Type:</Text>
                    <div><Tag color="purple">{selectedReviewItem.contentType.toUpperCase()}</Tag></div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Current Status:</Text>
                    <div>
                      <Tag color={
                        selectedReviewItem.status === 'published' ? 'success' : 
                        selectedReviewItem.status === 'approved' ? 'cyan' : 
                        selectedReviewItem.status === 'review' ? 'orange' : 'default'
                      }>
                        {selectedReviewItem.status.toUpperCase()}
                      </Tag>
                    </div>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

                <div>
                  <Text strong style={{ fontSize: 13 }}>Multilingual Translations:</Text>
                  <List
                    size="small"
                    bordered
                    dataSource={selectedReviewItem.translations || []}
                    style={{ marginTop: 8, background: '#fafafa', borderRadius: 8 }}
                    renderItem={t => (
                      <List.Item>
                        <div>
                          <Tag color="purple">{t.language.toUpperCase()}</Tag>
                          <Text strong>{t.title}</Text>
                          {t.summary && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{t.summary}</div>}
                          {t.body && <div style={{ fontSize: 11, color: '#475569', marginTop: 4, background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0' }}>{t.body}</div>}
                        </div>
                      </List.Item>
                    )}
                  />
                </div>

                {selectedReviewItem.reviewedBy && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Last Reviewed By User ID:</Text>
                    <div><Text code>{selectedReviewItem.reviewedBy}</Text></div>
                  </div>
                )}

                {selectedReviewItem.status !== 'review' && selectedReviewItem.feedback && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>Previous Clinical Feedback:</Text>
                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, fontStyle: 'italic', color: '#334155', marginTop: 4 }}>
                      "{selectedReviewItem.feedback}"
                    </div>
                  </div>
                )}

                {selectedReviewItem.status === 'review' && (
                  <div>
                    <Text strong style={{ fontSize: 13 }}>Clinical Assessment Notes & Feedback:</Text>
                    <TextArea
                      rows={4}
                      placeholder="Enter medical verification notes, safety verification details, or comments..."
                      value={reviewFeedback}
                      onChange={e => setReviewFeedback(e.target.value)}
                      style={{ marginTop: 8, borderRadius: 8 }}
                    />
                  </div>
                )}

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={() => { setSelectedReviewItem(null); setReviewFeedback(''); }}>
                    Close
                  </Button>
                  {selectedReviewItem.status === 'review' && (
                    <>
                      <Button 
                        danger 
                        loading={flaggingContent}
                        onClick={() => flagContent({ variables: { id: selectedReviewItem.id, feedback: reviewFeedback } })}
                      >
                        Flag & Reject
                      </Button>
                      <Button 
                        type="primary" 
                        loading={approvingContent}
                        onClick={() => approveContent({ variables: { id: selectedReviewItem.id, feedback: reviewFeedback } })}
                        style={{ background: '#be123c', borderColor: '#be123c' }}
                      >
                        Approve Clinical Guide
                      </Button>
                    </>
                  )}
                  {selectedReviewItem.status === 'approved' && (
                    <Button 
                      danger 
                      loading={flaggingContent}
                      onClick={() => flagContent({ variables: { id: selectedReviewItem.id, feedback: "Revoked approval by clinical user" } })}
                    >
                      Revoke & Move to Draft
                    </Button>
                  )}
                </div>
              </Space>
            )}
          </Modal>
        </div>
      )}

      {/* 8. QUIZ & WORKSHEETS TAB */}
      {activeTab === 'quizzes' && (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={14}>
            <Card title={isHi ? "वर्कशीट सबमिशन और ग्रेडिंग" : "Worksheet Submissions & Grading"} style={{ borderRadius: '16px' }}>
              <Table 
                dataSource={worksheetSubmissionsQuery.data?.getWorksheetSubmissions || []}
                loading={worksheetSubmissionsQuery.loading}
                rowKey="id"
                columns={[
                  {
                    title: 'Mother',
                    dataIndex: 'userDisplayName',
                    key: 'userDisplayName',
                    render: (text) => <Text strong>{text}</Text>
                  },
                  {
                    title: 'Worksheet Title',
                    dataIndex: 'title',
                    key: 'title'
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => (
                      <Tag color={status === 'reviewed' ? 'success' : 'processing'}>
                        {status.toUpperCase()}
                      </Tag>
                    )
                  },
                  {
                    title: 'Score',
                    dataIndex: 'score',
                    key: 'score',
                    render: (score) => score !== null ? <Badge count={score} style={{ backgroundColor: '#0f766e' }} /> : '-'
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_, record) => (
                      <Button 
                        size="small" 
                        type="primary" 
                        onClick={() => {
                          setSelectedWorksheet(record);
                          setWorksheetScore(record.score);
                          setWorksheetFeedback(record.feedback || '');
                        }}
                        style={{ background: '#be123c', borderColor: '#be123c' }}
                      >
                        {record.status === 'reviewed' ? 'Re-grade' : 'Review & Grade'}
                      </Button>
                    )
                  }
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title={isHi ? "दैनिक प्रश्नोत्तरी उत्तर कुंजी" : "Daily Quiz Answer Keys"} style={{ borderRadius: '16px' }}>
              <Paragraph type="secondary">
                Verify daily quiz questions, correct answer keys, and pass metrics for cognitive progress tracking.
              </Paragraph>
              <List
                itemLayout="horizontal"
                dataSource={[
                  { dayNumber: 1, questionText: 'What is the primary goal of Garbh Sanskar?', answer: 'Nourishing the child spiritually, mentally, and physically before birth.', passRate: '94%' },
                  { dayNumber: 15, questionText: 'Which vitamin is crucial for preventing neural tube defects?', answer: 'Folic Acid (Vitamin B9)', passRate: '98%' },
                  { dayNumber: 30, questionText: 'What music is recommended for baby brain growth?', answer: 'Soft classical ragas or instrumental flute music', passRate: '91%' },
                  { dayNumber: 60, questionText: 'How much water should a pregnant mother drink daily on average?', answer: '3 Liters', passRate: '88%' },
                  { dayNumber: 90, questionText: 'What is the safe range for kick counts in late trimesters?', answer: 'At least 10 kicks in 2 hours', passRate: '95%' }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Tag color="volcano">Day {item.dayNumber}</Tag>}
                      title={<Text strong>{item.questionText}</Text>}
                      description={
                        <div>
                          <div style={{ color: '#0f766e', fontWeight: 'bold' }}>Correct: {item.answer}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Pass Rate: {item.passRate}</div>
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

      {/* Worksheet Grading Modal */}
      <Modal
        title={isHi ? "वर्कशीट समीक्षा और ग्रेडिंग" : "Worksheet Review & Grading"}
        open={selectedWorksheet !== null}
        onCancel={() => setSelectedWorksheet(null)}
        footer={[
          <Button key="cancel" onClick={() => setSelectedWorksheet(null)}>Cancel</Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={gradingWorksheet}
            onClick={() => {
              if (worksheetScore === null || worksheetScore === undefined) {
                toast.error("Please assign a score.");
                return;
              }
              gradeWorksheetSubmission({
                variables: {
                  id: selectedWorksheet.id,
                  score: parseInt(worksheetScore),
                  feedback: worksheetFeedback
                }
              });
            }}
            style={{ background: '#be123c', borderColor: '#be123c' }}
          >
            Submit Grade
          </Button>
        ]}
      >
        {selectedWorksheet && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert 
              message={`${selectedWorksheet.userDisplayName} submitted:`}
              description={<Text strong>{selectedWorksheet.title}</Text>}
              type="info"
              showIcon
            />
            
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Submitted File:</Text>
              <Button type="dashed" href={selectedWorksheet.fileUrl} target="_blank" download block>
                Download Worksheet PDF
              </Button>
            </div>

            <Row gutter={12}>
              <Col span={12}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Assign Score (0-100):</Text>
                <Input 
                  type="number" 
                  min={0} 
                  max={100} 
                  value={worksheetScore !== null ? worksheetScore : ''} 
                  onChange={e => setWorksheetScore(e.target.value)} 
                />
              </Col>
            </Row>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Coaching Feedback:</Text>
              <TextArea 
                rows={4} 
                value={worksheetFeedback} 
                onChange={e => setWorksheetFeedback(e.target.value)} 
                placeholder="Provide professional feedback to support the mother's journey..." 
              />
            </div>
          </Space>
        )}
      </Modal>

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
          <Space direction="vertical" style={{ width: '100%' }} size="large">
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

            <Divider />

            <div>
              <Title level={5}>📋 Daily Activities & Coaching Feedback</Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Text style={{ fontSize: '13px' }}>View Gestational Day:</Text>
                <InputNumber
                  min={1}
                  max={280}
                  value={selectedDay}
                  onChange={val => setSelectedDay(val || 1)}
                  style={{ width: '80px' }}
                />
              </div>

              {memberProgressQuery.loading ? (
                <Text type="secondary">Loading progress details...</Text>
              ) : !memberProgressQuery.data?.myDailyProgress ? (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                  <Text type="secondary" style={{ fontSize: '13px' }}>No activities logged yet for Day {selectedDay}</Text>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {['PQ', 'IQ', 'EQ', 'SQ'].map(q => {
                      const qLower = q.toLowerCase();
                      const progress = memberProgressQuery.data.myDailyProgress;
                      const isCompleted = progress[`${qLower}Completed`];
                      const duration = progress[`${qLower}DurationMins`] || 0;
                      const notes = progress[`${qLower}Notes`] || '';
                      const evidence = progress[`${qLower}Evidence`] || '';
                      const feedback = progress[`${qLower}Feedback`] || '';
                      const active = feedbackQuotient === q;

                      return (
                        <Card
                          key={q}
                          hoverable
                          size="small"
                          onClick={() => setFeedbackQuotient(q)}
                          style={{
                            borderRadius: '12px',
                            border: active ? '2px solid #be123c' : '1px solid #e2e8f0',
                            background: active ? '#fffafb' : '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ color: active ? '#be123c' : '#1e293b' }}>{q} Activity</Text>
                            <Tag color={isCompleted ? 'green' : 'orange'}>
                              {isCompleted ? 'COMPLETED' : 'PENDING'}
                            </Tag>
                          </div>
                          {isCompleted && (
                            <div style={{ marginTop: '8px', fontSize: '12px' }}>
                              <div><Text type="secondary">Duration:</Text> <Text strong>{duration} mins</Text></div>
                              {notes && <div><Text type="secondary">Notes:</Text> <Text style={{ fontStyle: 'italic' }}>"{notes}"</Text></div>}
                              {evidence && (
                                <div>
                                  <Text type="secondary">Evidence:</Text>{' '}
                                  <a href={evidence} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                    View link ↗
                                  </a>
                                </div>
                              )}
                              {feedback && (
                                <div style={{ marginTop: '6px', padding: '6px 10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                  <Text strong style={{ fontSize: '10px', color: '#166534', display: 'block' }}>YOUR FEEDBACK:</Text>
                                  <Text style={{ fontSize: '11px', color: '#14532d' }}>"{feedback}"</Text>
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '12px' }}>Write Coaching Feedback for {feedbackQuotient}</Text>
                    </div>
                    <TextArea
                      rows={3}
                      placeholder={`Provide clinical guidance or encouragement for ${feedbackQuotient} activity...`}
                      value={coachingFeedbackText}
                      onChange={e => setCoachingFeedbackText(e.target.value)}
                      style={{ marginBottom: '10px' }}
                    />
                    <Button
                      type="primary"
                      onClick={handleAddCoachingFeedback}
                      loading={submittingFeedback}
                      style={{ background: '#be123c', borderColor: '#be123c', width: '100%', fontWeight: 'bold' }}
                    >
                      Submit Feedback
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Space>
        )}
      </Drawer>
    </Card>
  );
}

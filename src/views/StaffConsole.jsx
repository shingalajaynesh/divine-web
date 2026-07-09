import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { 
  Card, Table, Button, Input, InputNumber, Select, Tag, Space, Modal, Form, 
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

const GET_CENTERS_QUERY = gql`
  query GetCenters {
    getCenters {
      id
      name
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

const GET_REPORT_TEMPLATES_QUERY = gql`
  query GetReportTemplates($role: String) {
    getReportTemplates(role: $role) {
      id
      title
      description
      role
      filters
      widgets
      sharedWithRoles
      createdAt
    }
  }
`;

const GET_REPORT_DATA_QUERY = gql`
  query GetReportData($templateId: ID!, $filters: String) {
    getReportData(templateId: $templateId, filters: $filters) {
      templateId
      metrics
    }
  }
`;

const CREATE_REPORT_TEMPLATE_MUTATION = gql`
  mutation CreateReportTemplate($title: String!, $description: String, $role: String!, $filters: String, $widgets: String!) {
    createReportTemplate(title: $title, description: $description, role: $role, filters: $filters, widgets: $widgets) {
      id
      title
    }
  }
`;

const DELETE_REPORT_TEMPLATE_MUTATION = gql`
  mutation DeleteReportTemplate($id: ID!) {
    deleteReportTemplate(id: $id)
  }
`;

const SHARE_REPORT_TEMPLATE_MUTATION = gql`
  mutation ShareReportTemplate($templateId: ID!, $roles: String!) {
    shareReportTemplate(templateId: $templateId, roles: $roles) {
      id
      sharedWithRoles
    }
  }
`;

const GET_REPORT_SCHEDULES_QUERY = gql`
  query GetReportSchedules {
    getReportSchedules {
      id
      templateId
      frequency
      recipientEmails
      nextRunAt
      isActive
      template {
        title
      }
    }
  }
`;

const CREATE_REPORT_SCHEDULE_MUTATION = gql`
  mutation CreateReportSchedule($templateId: ID!, $frequency: String!, $recipientEmails: String!) {
    createReportSchedule(templateId: $templateId, frequency: $frequency, recipientEmails: $recipientEmails) {
      id
      frequency
    }
  }
`;

const DELETE_REPORT_SCHEDULE_MUTATION = gql`
  mutation DeleteReportSchedule($id: ID!) {
    deleteReportSchedule(id: $id)
  }
`;

const PROCESS_SCHEDULED_REPORTS_MUTATION = gql`
  mutation ProcessScheduledReports {
    processScheduledReports
  }
`;

// NEW operations for Platform Config (Chunk 46)
const GET_SYSTEM_SETTINGS_QUERY = gql`
  query GetSystemSettings {
    getSystemSettings {
      id
      key
      value
      description
      updatedAt
    }
  }
`;

const UPDATE_SYSTEM_SETTING_MUTATION = gql`
  mutation UpdateSystemSetting($key: String!, $value: String!) {
    updateSystemSetting(key: $key, value: $value) {
      id
      key
      value
    }
  }
`;

const GET_FEATURE_FLAGS_QUERY = gql`
  query GetFeatureFlags {
    getFeatureFlags {
      id
      name
      description
      isEnabled
      rules
      updatedAt
    }
  }
`;

const UPDATE_FEATURE_FLAG_MUTATION = gql`
  mutation UpdateFeatureFlag($name: String!, $isEnabled: Boolean!, $rules: String) {
    updateFeatureFlag(name: $name, isEnabled: $isEnabled, rules: $rules) {
      id
      name
      isEnabled
      rules
    }
  }
`;

const GET_LOCALE_STRINGS_QUERY = gql`
  query GetLocaleStrings($lang: String!) {
    getLocaleStrings(lang: $lang) {
      id
      lang
      key
      value
      updatedAt
    }
  }
`;

const UPSERT_LOCALE_STRING_MUTATION = gql`
  mutation UpsertLocaleString($lang: String!, $key: String!, $value: String!) {
    upsertLocaleString(lang: $lang, key: $key, value: $value) {
      id
      lang
      key
      value
    }
  }
`;

const GET_SERVER_DIAGNOSTICS_QUERY = gql`
  query GetServerDiagnostics {
    getServerDiagnostics {
      cpuLoad
      freeMem
      totalMem
      processMemory
      uptimeSeconds
      activeDbConnections
      errorCount
    }
  }
`;

const GET_SYSTEM_METRICS_HISTORY_QUERY = gql`
  query GetSystemMetricsHistory($metricType: String!) {
    getSystemMetricsHistory(metricType: $metricType) {
      id
      metricType
      value
      timestamp
    }
  }
`;

const EXPORT_SYSTEM_LOGS_QUERY = gql`
  query ExportSystemLogs($limit: Int) {
    exportSystemLogs(limit: $limit)
  }
`;

const GET_SLOW_QUERIES_REPORT_QUERY = gql`
  query GetSlowQueriesReport($thresholdMs: Float) {
    getSlowQueriesReport(thresholdMs: $thresholdMs) {
      id
      sqlQuery
      durationMs
      thresholdMs
      timestamp
    }
  }
`;

const RUN_DATABASE_INDEX_DIAGNOSTIC_QUERY = gql`
  query RunDatabaseIndexDiagnostic {
    runDatabaseIndexDiagnostic {
      table
      field
      status
      recommendation
    }
  }
`;

const CLEAR_SLOW_QUERY_LOGS_MUTATION = gql`
  mutation ClearSlowQueryLogs {
    clearSlowQueryLogs
  }
`;

const GET_DATABASE_CLUSTER_STATUS_QUERY = gql`
  query GetDatabaseClusterStatus {
    getDatabaseClusterStatus {
      primaryNodeHealthy
      replicaLagMs
      activeConnections
      maxPoolSize
      idleConnections
    }
  }
`;

const UPDATE_CONNECTION_POOL_CONFIG_MUTATION = gql`
  mutation UpdateConnectionPoolConfig($maxConnections: Int!, $idleTimeoutMs: Int!) {
    updateConnectionPoolConfig(maxConnections: $maxConnections, idleTimeoutMs: $idleTimeoutMs)
  }
`;

const TRIGGER_FAILOVER_SIMULATION_MUTATION = gql`
  mutation TriggerFailoverSimulation {
    triggerFailoverSimulation
  }
`;

const GET_ENVIRONMENT_STATUS_QUERY = gql`
  query GetEnvironmentStatus {
    getEnvironmentStatus {
      releaseVersion
      envMode
      nodeVersion
      platform
    }
  }
`;

const GET_BACKUP_HISTORY_QUERY = gql`
  query GetBackupHistory {
    getBackupHistory {
      id
      fileName
      backupSize
      status
      timestamp
    }
  }
`;

const TRIGGER_BACKUP_DRILL_MUTATION = gql`
  mutation TriggerBackupDrill {
    triggerBackupDrill {
      id
      fileName
      backupSize
      status
      timestamp
    }
  }
`;

const TRIGGER_RESTORE_DRILL_MUTATION = gql`
  mutation TriggerRestoreDrill($backupId: ID!) {
    triggerRestoreDrill(backupId: $backupId)
  }
`;

export default function StaffConsole({ isHi }) {
  const [activeTab, setActiveTab] = useState('tickets');
  const crmTabs = ['crm', 'followups', 'reminders'];
  const centersAwareTabs = ['attendance', 'reports', 'platform', 'health', 'sqlAudit', 'dbTuning', 'devops', 'crm', 'followups', 'reminders', 'review', 'quizzes'];
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
    variables: { status: null, limit: 50, offset: 0 },
    fetchPolicy: 'cache-and-network',
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
    skip: !crmTabs.includes(activeTab)
  });
  const centersQuery = useQuery(GET_CENTERS_QUERY, {
    skip: !centersAwareTabs.includes(activeTab),
    fetchPolicy: 'cache-first'
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

  // --- Chunk 45 Report Builder states & hooks ---
  const [reportRoleFilter, setReportRoleFilter] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [customReportFilters, setCustomReportFilters] = useState('{}');

  const reportTemplatesQuery = useQuery(GET_REPORT_TEMPLATES_QUERY, {
    variables: { role: reportRoleFilter || null },
    skip: activeTab !== 'reports'
  });

  const reportDataQuery = useQuery(GET_REPORT_DATA_QUERY, {
    variables: { templateId: selectedTemplateId || '', filters: customReportFilters || null },
    skip: !selectedTemplateId || activeTab !== 'reports'
  });

  const reportSchedulesQuery = useQuery(GET_REPORT_SCHEDULES_QUERY, {
    skip: activeTab !== 'reports'
  });

  const [createReportTemplate] = useMutation(CREATE_REPORT_TEMPLATE_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'रिपोर्ट टेम्प्लेट बनाया गया!' : 'Report template created successfully!');
      reportTemplatesQuery.refetch();
      setIsReportModalOpen(false);
      resetReportForm();
    },
    onError: (err) => toast.error(err.message)
  });

  const [deleteReportTemplate] = useMutation(DELETE_REPORT_TEMPLATE_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'रिपोर्ट टेम्प्लेट हटाया गया!' : 'Report template deleted!');
      reportTemplatesQuery.refetch();
      setSelectedTemplateId(null);
    },
    onError: (err) => toast.error(err.message)
  });

  const [createReportSchedule] = useMutation(CREATE_REPORT_SCHEDULE_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'रिपोर्ट शेड्यूल बनाया गया!' : 'Report schedule created successfully!');
      reportSchedulesQuery.refetch();
      setIsScheduleModalOpen(false);
      setScheduleFrequency('weekly');
      setScheduleEmails('');
    },
    onError: (err) => toast.error(err.message)
  });

  const [deleteReportSchedule] = useMutation(DELETE_REPORT_SCHEDULE_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'रिपोर्ट शेड्यूल हटाया गया!' : 'Report schedule deleted!');
      reportSchedulesQuery.refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const [shareReportTemplate] = useMutation(SHARE_REPORT_TEMPLATE_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'रिपोर्ट एक्सेस साझा किया गया!' : 'Report shared successfully!');
      reportTemplatesQuery.refetch();
      setIsShareModalOpen(false);
    },
    onError: (err) => toast.error(err.message)
  });

  const [processScheduledReports] = useMutation(PROCESS_SCHEDULED_REPORTS_MUTATION, {
    onCompleted: (res) => {
      const dispatched = JSON.parse(res.processScheduledReports || '[]');
      toast.success(isHi ? `${dispatched.length} शेड्यूल की गई रिपोर्ट भेजी गईं!` : `${dispatched.length} scheduled reports processed!`);
      reportSchedulesQuery.refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  // Report Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportRole, setReportRole] = useState('PLATFORM');
  const [reportFiltersText, setReportFiltersText] = useState('{}');
  const [reportWidgetsText, setReportWidgetsText] = useState('[]');

  // Share & Schedule Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareRolesText, setShareRolesText] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [scheduleEmails, setScheduleEmails] = useState('');

  const resetReportForm = () => {
    setReportTitle('');
    setReportDescription('');
    setReportRole('PLATFORM');
    setReportFiltersText('{}');
    setReportWidgetsText('[]');
  };

  // --- Chunk 46 Platform Config states & hooks ---
  const [localeLang, setLocaleLang] = useState('en');
  const [editingSetting, setEditingSetting] = useState(null);
  const [settingValueInput, setSettingValueInput] = useState('');
  const [editingFlag, setEditingFlag] = useState(null);
  const [flagRulesInput, setFlagRulesInput] = useState('');
  const [editingLocale, setEditingLocale] = useState(null);
  const [localeValueInput, setLocaleValueInput] = useState('');

  const systemSettingsQuery = useQuery(GET_SYSTEM_SETTINGS_QUERY, {
    skip: activeTab !== 'platform'
  });
  const featureFlagsQuery = useQuery(GET_FEATURE_FLAGS_QUERY, {
    skip: activeTab !== 'platform'
  });
  const localeStringsQuery = useQuery(GET_LOCALE_STRINGS_QUERY, {
    variables: { lang: localeLang },
    skip: activeTab !== 'platform'
  });

  const [updateSystemSetting, { loading: updatingSetting }] = useMutation(UPDATE_SYSTEM_SETTING_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'सिस्टम सेटिंग अपडेट की गई!' : 'System setting updated successfully!');
      systemSettingsQuery.refetch();
      setEditingSetting(null);
      setSettingValueInput('');
    },
    onError: (err) => toast.error(err.message)
  });

  const [updateFeatureFlag, { loading: updatingFlag }] = useMutation(UPDATE_FEATURE_FLAG_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'फीचर फ़्लैग अपडेट किया गया!' : 'Feature flag updated successfully!');
      featureFlagsQuery.refetch();
      setEditingFlag(null);
      setFlagRulesInput('');
    },
    onError: (err) => toast.error(err.message)
  });

  const [upsertLocaleString, { loading: upsertingLocale }] = useMutation(UPSERT_LOCALE_STRING_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'स्थानीयकरण स्ट्रिंग सहेजी गई!' : 'Localization string saved successfully!');
      localeStringsQuery.refetch();
      setEditingLocale(null);
      setLocaleValueInput('');
    },
    onError: (err) => toast.error(err.message)
  });

  // --- Chunk 47 System Health states & hooks ---
  const [selectedMetricType, setSelectedMetricType] = useState('cpu');

  const serverDiagnosticsQuery = useQuery(GET_SERVER_DIAGNOSTICS_QUERY, {
    pollInterval: 15000,
    skip: activeTab !== 'health'
  });

  const systemMetricsHistoryQuery = useQuery(GET_SYSTEM_METRICS_HISTORY_QUERY, {
    variables: { metricType: selectedMetricType },
    skip: activeTab !== 'health'
  });

  const exportSystemLogsQuery = useQuery(EXPORT_SYSTEM_LOGS_QUERY, {
    variables: { limit: 150 },
    skip: true
  });

  // --- Chunk 48 SQL Optimization states & hooks ---
  const [slowQueryThreshold, setSlowQueryThreshold] = useState(50);

  const slowQueriesQuery = useQuery(GET_SLOW_QUERIES_REPORT_QUERY, {
    variables: { thresholdMs: parseFloat(slowQueryThreshold || 50) },
    skip: activeTab !== 'sqlAudit'
  });

  const indexDiagnosticsQuery = useQuery(RUN_DATABASE_INDEX_DIAGNOSTIC_QUERY, {
    skip: activeTab !== 'sqlAudit'
  });

  const [clearSlowQueryLogs, { loading: clearingSlowLogs }] = useMutation(CLEAR_SLOW_QUERY_LOGS_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'धीमी क्वेरी लॉग हटा दिए गए!' : 'Slow query logs cleared successfully!');
      slowQueriesQuery.refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  // --- Chunk 49 DB Tuning states & hooks ---
  const [maxConnectionsInput, setMaxConnectionsInput] = useState(20);
  const [idleTimeoutInput, setIdleTimeoutInput] = useState(10000);

  const databaseClusterStatusQuery = useQuery(GET_DATABASE_CLUSTER_STATUS_QUERY, {
    pollInterval: 20000,
    skip: activeTab !== 'dbTuning',
    onCompleted: (data) => {
      if (data?.getDatabaseClusterStatus) {
        setMaxConnectionsInput(data.getDatabaseClusterStatus.maxPoolSize);
      }
    }
  });

  const [updateConnectionPoolConfig, { loading: updatingPool }] = useMutation(UPDATE_CONNECTION_POOL_CONFIG_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'कनेक्शन पूल अपडेट किया गया!' : 'Database connection pool config updated successfully!');
      databaseClusterStatusQuery.refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const [triggerFailoverSimulation, { loading: triggeringFailover }] = useMutation(TRIGGER_FAILOVER_SIMULATION_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'फ़ेलओवर सिम्युलेशन सफल रहा!' : 'Manual replica failover diagnostics sequence triggered successfully!');
      databaseClusterStatusQuery.refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  // --- Chunk 50 DevOps & Observability hooks ---
  const environmentStatusQuery = useQuery(GET_ENVIRONMENT_STATUS_QUERY, {
    skip: activeTab !== 'devops'
  });

  const backupHistoryQuery = useQuery(GET_BACKUP_HISTORY_QUERY, {
    skip: activeTab !== 'devops'
  });

  const [triggerBackupDrill, { loading: triggeringBackup }] = useMutation(TRIGGER_BACKUP_DRILL_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'बैकअप फ़ाइल तैयार की गई!' : 'Database snapshot backup archive created successfully!');
      backupHistoryQuery.refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const [triggerRestoreDrill, { loading: triggeringRestore }] = useMutation(TRIGGER_RESTORE_DRILL_MUTATION, {
    onCompleted: () => {
      toast.success(isHi ? 'डाटाबेस रिस्टोर सिम्युलेशन सफल रहा!' : 'Simulated database state recovery completed successfully!');
      backupHistoryQuery.refetch();
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
        <Space orientation="vertical" style={{ width: '100%' }}>
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
          { key: 'reports', label: '📊 Report Builder' },
          { key: 'platform', label: '⚙️ Platform Settings' },
          { key: 'health', label: '📈 System Health' },
          { key: 'sqlAudit', label: '⚡ SQL Performance & Index Tuning' },
          { key: 'dbTuning', label: '💾 Database Cluster & Replication' },
          { key: 'devops', label: '🚀 DevOps Observability & Backups' },
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
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
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
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
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

      {/* 5.5 REPORT BUILDER, SCHEDULING & SHARING SYSTEM */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Row gutter={[16, 16]}>
            {/* Left sidebar: Templates and schedules list */}
            <Col xs={24} md={8}>
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                {/* Templates Card */}
                <Card
                  title="Report Templates"
                  extra={
                    <Button type="primary" size="small" style={{ background: '#be123c', borderColor: '#be123c' }} onClick={() => setIsReportModalOpen(true)}>
                      + Create Template
                    </Button>
                  }
                  style={{ borderRadius: 16 }}
                >
                  {/* Role filter */}
                  <div style={{ marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 12 }}>Filter templates by target role:</Text>
                    <Select
                      style={{ width: '100%', marginTop: 4 }}
                      value={reportRoleFilter}
                      onChange={setReportRoleFilter}
                      allowClear
                      placeholder="All Roles"
                    >
                      <Select.Option value="MOTHER">Mother Dashboard</Select.Option>
                      <Select.Option value="PARTNER">Partner Dashboard</Select.Option>
                      <Select.Option value="CENTER">Center Management</Select.Option>
                      <Select.Option value="FRANCHISE">Franchise Settlements</Select.Option>
                      <Select.Option value="STAFF">Staff Productivity</Select.Option>
                      <Select.Option value="PLATFORM">Platform Operations</Select.Option>
                    </Select>
                  </div>

                  <Table
                    dataSource={reportTemplatesQuery.data?.getReportTemplates || []}
                    loading={reportTemplatesQuery.loading}
                    rowKey="id"
                    showHeader={false}
                    pagination={{ pageSize: 5 }}
                    columns={[
                      {
                        key: 'template',
                        render: (_, record) => (
                          <div
                            style={{
                              padding: '6px 0',
                              cursor: 'pointer',
                              background: selectedTemplateId === record.id ? '#fcf0f2' : 'transparent',
                              borderRadius: 6
                            }}
                            onClick={() => {
                              setSelectedTemplateId(record.id);
                              setCustomReportFilters(record.filters || '{}');
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text strong style={{ color: selectedTemplateId === record.id ? '#be123c' : 'inherit' }}>{record.title}</Text>
                              <Tag color="cyan">{record.role}</Tag>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{record.description}</div>
                            {record.sharedWithRoles && (
                              <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 9 }}>Shared with: </Text>
                                <Tag color="geekblue" style={{ fontSize: 9 }}>{record.sharedWithRoles}</Tag>
                              </div>
                            )}
                          </div>
                        )
                      }
                    ]}
                  />
                </Card>

                {/* Schedules list */}
                <Card
                  title="Scheduled Email Reports"
                  extra={
                    <Button
                      size="small"
                      onClick={() => {
                        processScheduledReports();
                      }}
                    >
                      Simulate Cron
                    </Button>
                  }
                  style={{ borderRadius: 16 }}
                >
                  <Table
                    dataSource={reportSchedulesQuery.data?.getReportSchedules || []}
                    loading={reportSchedulesQuery.loading}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 3 }}
                    columns={[
                      {
                        title: 'Report / Freq',
                        key: 'desc',
                        render: (_, record) => (
                          <div>
                            <Text strong style={{ fontSize: 11 }}>{record.template?.title}</Text>
                            <div><Tag color="blue" style={{ fontSize: 9 }}>{record.frequency.toUpperCase()}</Tag></div>
                          </div>
                        )
                      },
                      {
                        title: 'Recipients',
                        dataIndex: 'recipientEmails',
                        key: 'emails',
                        render: (emails) => <Text style={{ fontSize: 10 }}>{emails}</Text>
                      },
                      {
                        key: 'actions',
                        render: (_, record) => (
                          <Button
                            size="small"
                            type="text"
                            danger
                            onClick={() => {
                              if (confirm('Delete this report schedule?')) {
                                deleteReportSchedule({ variables: { id: record.id } });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )
                      }
                    ]}
                  />
                </Card>
              </Space>
            </Col>

            {/* Right workspace: Selected Template Dashboard rendering */}
            <Col xs={24} md={16}>
              {selectedTemplateId ? (
                (() => {
                  const activeTpl = reportTemplatesQuery.data?.getReportTemplates?.find(t => t.id === selectedTemplateId);
                  const metrics = JSON.parse(reportDataQuery.data?.getReportData?.metrics || '{}');
                  return (
                    <Card
                      title={activeTpl?.title || 'Report Details'}
                      extra={
                        <Space>
                          <Button
                            size="small"
                            onClick={() => {
                              setShareRolesText(activeTpl?.sharedWithRoles || '');
                              setIsShareModalOpen(true);
                            }}
                          >
                            Share Dashboard
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setIsScheduleModalOpen(true);
                            }}
                          >
                            Schedule Dispatch
                          </Button>
                          <Button
                            type="text"
                            danger
                            onClick={() => {
                              if (confirm('Delete this report template?')) {
                                deleteReportTemplate({ variables: { id: selectedTemplateId } });
                              }
                            }}
                          >
                            Delete Template
                          </Button>
                        </Space>
                      }
                      style={{ borderRadius: 16 }}
                    >
                      <Paragraph style={{ color: '#64748b' }}>{activeTpl?.description}</Paragraph>

                      {/* Filters and Exports bar */}
                      <Card style={{ background: '#f8fafc', marginBottom: 20 }} bodyStyle={{ padding: 12 }}>
                        <Row gutter={[12, 12]} align="middle">
                          <Col xs={24} sm={12}>
                            <Text strong style={{ fontSize: 12 }}>Custom JSON query parameters:</Text>
                            <Input
                              value={customReportFilters}
                              onChange={e => setCustomReportFilters(e.target.value)}
                              style={{ marginTop: 4 }}
                            />
                          </Col>
                          <Col xs={24} sm={12} style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
                            <Button type="primary" onClick={() => reportDataQuery.refetch({ templateId: selectedTemplateId, filters: customReportFilters })}>
                              Apply Filters
                            </Button>
                            <Button
                              onClick={() => {
                                const csv = 'Metric,Value\n' + Object.entries(metrics).map(([k, v]) => `"${k}","${typeof v === 'object' ? JSON.stringify(v).replace(/"/g, '""') : v}"`).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${activeTpl?.title.toLowerCase().replace(/\s+/g, '-')}-metrics.csv`;
                                a.click();
                              }}
                            >
                              Export CSV
                            </Button>
                            <Button onClick={() => window.print()}>
                              Export PDF
                            </Button>
                          </Col>
                        </Row>
                      </Card>

                      {/* Dynamic widgets rendering based on role scope */}
                      {reportDataQuery.loading ? (
                        <Skeleton active />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {activeTpl?.role === 'MOTHER' && (
                            <Row gutter={[16, 16]}>
                              <Col xs={12} sm={8}>
                                <Card><Statistic title="Daily Logs logged" value={metrics.vitalsCount || 0} /></Card>
                              </Col>
                              <Col xs={12} sm={8}>
                                <Card><Statistic title="Content Bookmarks" value={metrics.bookmarksCount || 0} /></Card>
                              </Col>
                              <Col xs={12} sm={8}>
                                <Card><Statistic title="Worksheets Progress" value={metrics.progressCount || 0} /></Card>
                              </Col>
                              <Col xs={24}>
                                <Card>
                                  <Text strong>Mother Journey stage: </Text>
                                  <Tag color="magenta">{metrics.trimester}</Tag>
                                  <Text style={{ marginLeft: 12 }}>Active Streak: <strong>{metrics.streakDays} days</strong></Text>
                                </Card>
                              </Col>
                            </Row>
                          )}

                          {activeTpl?.role === 'PARTNER' && (
                            <Row gutter={[16, 16]}>
                              <Col xs={12} sm={12}>
                                <Card><Statistic title="Partner Activities log" value={metrics.partnerActivitiesCount || 0} /></Card>
                              </Col>
                              <Col xs={12} sm={12}>
                                <Card><Statistic title="Sensory Exercises done" value={metrics.sensoryActivitiesCount || 0} /></Card>
                              </Col>
                              <Col xs={24}>
                                <Card>
                                  <Text strong>Engagement Status: </Text>
                                  <Tag color="purple">{metrics.status}</Tag>
                                </Card>
                              </Col>
                            </Row>
                          )}

                          {activeTpl?.role === 'CENTER' && (
                            <Row gutter={[16, 16]}>
                              <Col xs={12} sm={12} md={8}>
                                <Card><Statistic title="Active Members" value={metrics.activeMothers || 0} /></Card>
                              </Col>
                              <Col xs={12} sm={12} md={8}>
                                <Card><Statistic title="Scheduled Appointments" value={metrics.upcomingAppointments || 0} /></Card>
                              </Col>
                              <Col xs={12} sm={24} md={8}>
                                <Card><Statistic title="Counseling Calls" value={metrics.counselingCallsCount || 0} /></Card>
                              </Col>
                              <Col xs={24}>
                                <Card style={{ background: '#fdf4ff' }}>
                                  <Statistic title="Total Revenue collected" value={metrics.localRevenue || 0.0} precision={2} prefix="₹" />
                                </Card>
                              </Col>
                            </Row>
                          )}

                          {activeTpl?.role === 'FRANCHISE' && (
                            <Row gutter={[16, 16]}>
                              <Col xs={24} sm={12}>
                                <Card><Statistic title="Franchise gross Revenue" value={metrics.totalFranchiseRevenue || 0.0} precision={2} prefix="₹" /></Card>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Card><Statistic title="Leads conversion Rate" value={metrics.leadsConversionRate || 0.0} precision={2} suffix="%" /></Card>
                              </Col>
                              <Col xs={24}>
                                <Card title="Revenue share breakdown by Center">
                                  <Table
                                    dataSource={metrics.centerRevenueBreakdown || []}
                                    rowKey="centerId"
                                    size="small"
                                    columns={[
                                      { title: 'Center Name', dataIndex: 'name', key: 'name' },
                                      { title: 'Revenue collected', dataIndex: 'revenue', key: 'revenue', render: (val) => `₹${parseFloat(val).toFixed(2)}` }
                                    ]}
                                  />
                                </Card>
                              </Col>
                            </Row>
                          )}

                          {activeTpl?.role === 'STAFF' && (
                            <Row gutter={[16, 16]}>
                              <Col xs={12} sm={12}>
                                <Card><Statistic title="Tasks completed" value={metrics.tasksCompleted || 0} /></Card>
                              </Col>
                              <Col xs={12} sm={12}>
                                <Card><Statistic title="Assigned open tickets" value={metrics.pendingTickets || 0} /></Card>
                              </Col>
                              <Col xs={24}>
                                <Card>
                                  <Text>Average Customer satisfaction score: </Text>
                                  <strong style={{ color: '#15803d' }}>{metrics.satisfactionRating} / 5.0</strong>
                                </Card>
                              </Col>
                            </Row>
                          )}

                          {activeTpl?.role === 'PLATFORM' && (
                            <Row gutter={[16, 16]}>
                              <Col xs={12} sm={8}>
                                <Card><Statistic title="Global Registered users" value={metrics.totalUsers || 0} /></Card>
                              </Col>
                              <Col xs={12} sm={8}>
                                <Card><Statistic title="Premium Conversion ratio" value={metrics.premiumConversionRatio || 0} precision={2} suffix="%" /></Card>
                              </Col>
                              <Col xs={12} sm={8}>
                                <Card><Statistic title="Global gross Revenue" value={metrics.grossRevenue || 0.0} precision={2} prefix="₹" /></Card>
                              </Col>
                              <Col xs={24}>
                                <Card style={{ background: '#f0fdf4' }}>
                                  <Text>Platform Infrastructure Uptime: </Text>
                                  <strong style={{ color: '#16a34a' }}>{metrics.serverUptime}</strong>
                                </Card>
                              </Col>
                            </Row>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })()
              ) : (
                <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
                  <Text type="secondary">Select a template from the list sidebar to render the analytics dashboard.</Text>
                </Card>
              )}
            </Col>
          </Row>

          {/* Create Report Template Modal */}
          <Modal
            title="Create Custom Report template"
            open={isReportModalOpen}
            onCancel={() => setIsReportModalOpen(false)}
            onOk={() => {
              createReportTemplate({
                variables: {
                  title: reportTitle,
                  description: reportDescription,
                  role: reportRole,
                  filters: reportFiltersText,
                  widgets: reportWidgetsText
                }
              });
            }}
            destroyOnClose
            style={{ borderRadius: 16 }}
          >
            <Form layout="vertical">
              <Form.Item label="Template Title" required>
                <Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="e.g. Center A Financials Overview" />
              </Form.Item>
              <Form.Item label="Description">
                <Input.TextArea value={reportDescription} onChange={e => setReportDescription(e.target.value)} placeholder="e.g. Monthly settlements overview" />
              </Form.Item>
              <Form.Item label="Target dashboard role scope" required>
                <Select value={reportRole} onChange={setReportRole}>
                  <Select.Option value="MOTHER">MOTHER</Select.Option>
                  <Select.Option value="PARTNER">PARTNER</Select.Option>
                  <Select.Option value="CENTER">CENTER</Select.Option>
                  <Select.Option value="FRANCHISE">FRANCHISE</Select.Option>
                  <Select.Option value="STAFF">STAFF</Select.Option>
                  <Select.Option value="PLATFORM">PLATFORM</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Default filters JSON" required>
                <Input.TextArea value={reportFiltersText} onChange={e => setReportFiltersText(e.target.value)} rows={2} />
              </Form.Item>
              <Form.Item label="Widgets config array JSON" required>
                <Input.TextArea value={reportWidgetsText} onChange={e => setReportWidgetsText(e.target.value)} rows={3} />
              </Form.Item>
            </Form>
          </Modal>

          {/* Share Report Access Modal */}
          <Modal
            title="Share Dashboard Access with Roles"
            open={isShareModalOpen}
            onCancel={() => setIsShareModalOpen(false)}
            onOk={() => {
              shareReportTemplate({
                variables: {
                  templateId: selectedTemplateId,
                  roles: shareRolesText
                }
              });
            }}
            destroyOnClose
            style={{ borderRadius: 16 }}
          >
            <Form layout="vertical">
              <Form.Item label="Roles allowed to view this report (comma-separated)" required>
                <Input
                  value={shareRolesText}
                  onChange={e => setShareRolesText(e.target.value)}
                  placeholder="e.g. CENTER, FRANCHISE, STAFF"
                />
              </Form.Item>
            </Form>
          </Modal>

          {/* Schedule Report Dispatch Modal */}
          <Modal
            title="Configure Recurring Email Dispatch"
            open={isScheduleModalOpen}
            onCancel={() => setIsScheduleModalOpen(false)}
            onOk={() => {
              createReportSchedule({
                variables: {
                  templateId: selectedTemplateId,
                  frequency: scheduleFrequency,
                  recipientEmails: scheduleEmails
                }
              });
            }}
            destroyOnClose
            style={{ borderRadius: 16 }}
          >
            <Form layout="vertical">
              <Form.Item label="Dispatch Frequency" required>
                <Select value={scheduleFrequency} onChange={setScheduleFrequency}>
                  <Select.Option value="daily">Daily</Select.Option>
                  <Select.Option value="weekly">Weekly</Select.Option>
                  <Select.Option value="monthly">Monthly</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Recipient Email Addresses (comma-separated)" required>
                <Input
                  value={scheduleEmails}
                  onChange={e => setScheduleEmails(e.target.value)}
                  placeholder="e.g. partner@example.com, admin@care.com"
                />
              </Form.Item>
            </Form>
          </Modal>
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

      {/* 6.5 PLATFORM CONFIGURATION & SYSTEM SETTINGS */}
      {activeTab === 'platform' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Row gutter={[16, 16]}>
            {/* System Settings Panel */}
            <Col xs={24} lg={8}>
              <Card title="⚙️ Global System Settings" style={{ borderRadius: '16px' }}>
                <Table
                  dataSource={systemSettingsQuery.data?.getSystemSettings || []}
                  loading={systemSettingsQuery.loading}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: 'Setting Key',
                      dataIndex: 'key',
                      key: 'key',
                      render: (k) => <Text strong style={{ fontSize: 11 }}>{k}</Text>
                    },
                    {
                      title: 'Value',
                      key: 'value',
                      render: (_, record) => (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.value}</Text>
                          <Button
                            size="small"
                            type="link"
                            onClick={() => {
                              setEditingSetting(record);
                              setSettingValueInput(record.value);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>

            {/* Feature Flags Panel */}
            <Col xs={24} lg={8}>
              <Card title="🚩 Feature Toggles" style={{ borderRadius: '16px' }}>
                <Table
                  dataSource={featureFlagsQuery.data?.getFeatureFlags || []}
                  loading={featureFlagsQuery.loading}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: 'Flag Name',
                      key: 'name',
                      render: (_, record) => (
                        <div>
                          <Text strong style={{ fontSize: 11 }}>{record.name}</Text>
                          <div style={{ fontSize: 9, color: '#64748b' }}>{record.description}</div>
                        </div>
                      )
                    },
                    {
                      title: 'Status',
                      key: 'status',
                      render: (_, record) => (
                        <Checkbox
                          checked={record.isEnabled}
                          onChange={(e) => {
                            updateFeatureFlag({
                              variables: {
                                name: record.name,
                                isEnabled: e.target.checked,
                                rules: record.rules
                              }
                            });
                          }}
                        />
                      )
                    },
                    {
                      title: 'Rules',
                      key: 'rules',
                      render: (_, record) => (
                        <Button
                          size="small"
                          type="text"
                          onClick={() => {
                            setEditingFlag(record);
                            setFlagRulesInput(record.rules || '{}');
                          }}
                        >
                          Rules
                        </Button>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>

            {/* Localization Settings Panel */}
            <Col xs={24} lg={8}>
              <Card
                title="🗣️ Dictionary Translations"
                extra={
                  <Select value={localeLang} onChange={setLocaleLang} size="small">
                    <Select.Option value="en">English (EN)</Select.Option>
                    <Select.Option value="hi">Hindi (HI)</Select.Option>
                  </Select>
                }
                style={{ borderRadius: '16px' }}
              >
                <Table
                  dataSource={localeStringsQuery.data?.getLocaleStrings || []}
                  loading={localeStringsQuery.loading}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: 'Key Code',
                      dataIndex: 'key',
                      key: 'key',
                      render: (k) => <Text code style={{ fontSize: 10 }}>{k}</Text>
                    },
                    {
                      title: 'Value',
                      key: 'value',
                      render: (_, record) => (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.value}</Text>
                          <Button
                            size="small"
                            type="link"
                            onClick={() => {
                              setEditingLocale(record);
                              setLocaleValueInput(record.value);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      )
                    }
                  ]}
                />
                <Divider style={{ margin: '10px 0' }} />
                <Button type="dashed" size="small" block onClick={() => {
                  setEditingLocale({ lang: localeLang, key: '', value: '' });
                  setLocaleValueInput('');
                }}>
                  + Add Dictionary Entry
                </Button>
              </Card>
            </Col>
          </Row>

          {/* Edit System Setting Modal */}
          <Modal
            title="Edit System Setting Value"
            open={editingSetting !== null}
            onCancel={() => setEditingSetting(null)}
            onOk={() => {
              updateSystemSetting({
                variables: {
                  key: editingSetting.key,
                  value: settingValueInput
                }
              });
            }}
            destroyOnClose
          >
            <Form layout="vertical">
              <Form.Item label="Setting Key">
                <Input value={editingSetting?.key} disabled />
              </Form.Item>
              <Form.Item label="Description">
                <Text type="secondary">{editingSetting?.description || 'No description provided.'}</Text>
              </Form.Item>
              <Form.Item label="Value" required>
                <Input.TextArea value={settingValueInput} onChange={e => setSettingValueInput(e.target.value)} rows={3} />
              </Form.Item>
            </Form>
          </Modal>

          {/* Edit Feature Flag Rules Modal */}
          <Modal
            title="Edit Feature Flag Cohort Rules"
            open={editingFlag !== null}
            onCancel={() => setEditingFlag(null)}
            onOk={() => {
              updateFeatureFlag({
                variables: {
                  name: editingFlag.name,
                  isEnabled: editingFlag.isEnabled,
                  rules: flagRulesInput
                }
              });
            }}
            destroyOnClose
          >
            <Form layout="vertical">
              <Form.Item label="Flag Name">
                <Input value={editingFlag?.name} disabled />
              </Form.Item>
              <Form.Item label="Description">
                <Text type="secondary">{editingFlag?.description || 'No description provided.'}</Text>
              </Form.Item>
              <Form.Item label="Rules JSON (e.g. {'centers': ['c1', 'c2']})" required>
                <Input.TextArea value={flagRulesInput} onChange={e => setFlagRulesInput(e.target.value)} rows={4} />
              </Form.Item>
            </Form>
          </Modal>

          {/* Upsert Localization String Modal */}
          <Modal
            title="Manage Localized Phrase"
            open={editingLocale !== null}
            onCancel={() => setEditingLocale(null)}
            onOk={() => {
              upsertLocaleString({
                variables: {
                  lang: editingLocale.lang,
                  key: editingLocale.key || document.getElementById('new_locale_key')?.value,
                  value: localeValueInput
                }
              });
            }}
            destroyOnClose
          >
            <Form layout="vertical">
              <Form.Item label="Target Language">
                <Tag color="purple">{editingLocale?.lang?.toUpperCase()}</Tag>
              </Form.Item>
              {editingLocale?.id ? (
                <Form.Item label="Key Code">
                  <Input value={editingLocale.key} disabled />
                </Form.Item>
              ) : (
                <Form.Item label="Key Code" required>
                  <Input id="new_locale_key" placeholder="e.g. login_welcome_message" />
                </Form.Item>
              )}
              <Form.Item label="Translation Value" required>
                <Input.TextArea value={localeValueInput} onChange={e => setLocaleValueInput(e.target.value)} rows={3} />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      )}

      {/* 6.6 SYSTEM HEALTH DIAGNOSTICS & LOGS EXPORTER */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Resource Diagnostics Widgets */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: '16px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>CPU Load average</Text>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#16a34a', marginTop: '4px' }}>
                  {serverDiagnosticsQuery.data?.getServerDiagnostics?.cpuLoad ? `${(serverDiagnosticsQuery.data.getServerDiagnostics.cpuLoad * 100).toFixed(1)}%` : '0%'}
                </div>
                <Progress percent={Math.round((serverDiagnosticsQuery.data?.getServerDiagnostics?.cpuLoad || 0) * 100)} showInfo={false} strokeColor="#16a34a" size="small" style={{ marginTop: 8 }} />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: '16px', background: '#eff6ff', border: '1px solid #dbeafe' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Server Memory allocation</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '4px' }}>
                  {serverDiagnosticsQuery.data?.getServerDiagnostics ? (
                    `${(serverDiagnosticsQuery.data.getServerDiagnostics.processMemory / (1024 * 1024)).toFixed(1)} MB / ${(serverDiagnosticsQuery.data.getServerDiagnostics.totalMem / (1024 * 1024 * 1024)).toFixed(1)} GB`
                  ) : '0 MB'}
                </div>
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  Free system memory: {serverDiagnosticsQuery.data?.getServerDiagnostics ? `${(serverDiagnosticsQuery.data.getServerDiagnostics.freeMem / (1024 * 1024 * 1024)).toFixed(1)} GB` : '0 GB'}
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: '16px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Uptime duration</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706', marginTop: '4px' }}>
                  {(() => {
                    const secs = serverDiagnosticsQuery.data?.getServerDiagnostics?.uptimeSeconds || 0;
                    const h = Math.floor(secs / 3600);
                    const m = Math.floor((secs % 3600) / 60);
                    const s = secs % 60;
                    return `${h}h ${m}m ${s}s`;
                  })()}
                </div>
                <Text type="secondary" style={{ fontSize: '10px' }}>Active DB Pool: {serverDiagnosticsQuery.data?.getServerDiagnostics?.activeDbConnections || 0} connections</Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: '16px', background: '#fdf2f8', border: '1px solid #fce7f3' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>System Exceptions Logged</Text>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#be123c', marginTop: '4px' }}>
                  {serverDiagnosticsQuery.data?.getServerDiagnostics?.errorCount || 0} errors
                </div>
                <Badge status="processing" text="Heartbeat healthy" style={{ marginTop: 8 }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Telemetry charts */}
            <Col xs={24} md={16}>
              <Card
                title="📈 Historical Telemetry"
                extra={
                  <Select value={selectedMetricType} onChange={setSelectedMetricType} size="small" style={{ width: 150 }}>
                    <Select.Option value="cpu">CPU Usage</Select.Option>
                    <Select.Option value="memory">Memory Usage</Select.Option>
                    <Select.Option value="latency">API Response Latency</Select.Option>
                  </Select>
                }
                style={{ borderRadius: '16px' }}
              >
                <div style={{ padding: '10px 0' }}>
                  {systemMetricsHistoryQuery.loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading telemetry...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {systemMetricsHistoryQuery.data?.getSystemMetricsHistory?.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic', padding: '20px 0' }}>No telemetry records logged yet.</div>
                      ) : (
                        systemMetricsHistoryQuery.data.getSystemMetricsHistory.map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Text type="secondary" style={{ fontSize: '11px', width: '130px' }}>
                              {new Date(m.timestamp).toLocaleTimeString()}
                            </Text>
                            <div style={{ flex: 1, background: '#f1f5f9', height: '14px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  background: selectedMetricType === 'cpu' ? '#16a34a' : selectedMetricType === 'memory' ? '#1d4ed8' : '#be123c',
                                  width: `${Math.min(m.value, 100)}%`,
                                  height: '100%',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                            <Text strong style={{ fontSize: '11px', width: '60px', textAlign: 'right' }}>
                              {m.value.toFixed(1)} {selectedMetricType === 'cpu' ? '%' : selectedMetricType === 'memory' ? 'MB' : 'ms'}
                            </Text>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Logs Exporter Card */}
            <Col xs={24} md={8}>
              <Card title="📁 Audit Logs & Operations Exporter" style={{ borderRadius: '16px' }}>
                <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                  Export security audit records, database transaction reports, and system operations logs as a formatted CSV spreadsheet file.
                </Paragraph>
                <Button
                  type="primary"
                  block
                  style={{ background: '#be123c', borderColor: '#be123c', fontWeight: 'bold', height: '40px', borderRadius: '8px' }}
                  onClick={async () => {
                    try {
                      const res = await exportSystemLogsQuery.refetch();
                      const csvContent = res.data?.exportSystemLogs || '';
                      if (!csvContent) {
                        toast.error('No logs available to export.');
                        return;
                      }
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success("Audit logs exported and downloaded successfully!");
                    } catch (err) {
                      toast.error('Failed to export system logs: ' + err.message);
                    }
                  }}
                >
                  Download System Audit Logs
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* 6.7 DATABASE PERFORMANCE & SQL AUDIT */}
      {activeTab === 'sqlAudit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card
            title="⚡ SQL Optimization & Performance Metrics"
            extra={
              <Space>
                <Text style={{ fontSize: '12px' }}>Tuning Threshold (ms):</Text>
                <InputNumber
                  value={slowQueryThreshold}
                  onChange={setSlowQueryThreshold}
                  min={10}
                  max={2000}
                  style={{ width: 80 }}
                />
                <Button
                  danger
                  onClick={() => clearSlowQueryLogs()}
                  loading={clearingSlowLogs}
                >
                  Clear Logs
                </Button>
              </Space>
            }
            style={{ borderRadius: '16px' }}
          >
            <Table
              dataSource={slowQueriesQuery.data?.getSlowQueriesReport || []}
              rowKey="id"
              loading={slowQueriesQuery.loading}
              columns={[
                {
                  title: 'SQL Statement',
                  dataIndex: 'sqlQuery',
                  key: 'sqlQuery',
                  render: (q) => <code style={{ fontSize: '11px', color: '#475569', wordBreak: 'break-all' }}>{q}</code>
                },
                {
                  title: 'Latency',
                  dataIndex: 'durationMs',
                  key: 'durationMs',
                  render: (lat) => <Tag color={lat > 100 ? 'red' : 'orange'}>{lat.toFixed(1)} ms</Tag>,
                  width: 120
                },
                {
                  title: 'Captured',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (t) => new Date(t).toLocaleTimeString(),
                  width: 130
                }
              ]}
              locale={{ emptyText: 'No queries exceeded this execution speed limit threshold.' }}
            />
          </Card>

          <Card title="🩺 Database Index Diagnostics Audit" style={{ borderRadius: '16px' }}>
            <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: 16 }}>
              The following audit scans all tables and validates whether proper indices exist on core foreign keys to avoid full table scans.
            </Paragraph>
            <Table
              dataSource={indexDiagnosticsQuery.data?.runDatabaseIndexDiagnostic || []}
              rowKey={(record) => `${record.table}_${record.field}`}
              loading={indexDiagnosticsQuery.loading}
              pagination={false}
              columns={[
                {
                  title: 'Table Name',
                  dataIndex: 'table',
                  key: 'table',
                  render: (txt) => <Text strong>{txt}</Text>
                },
                {
                  title: 'Field',
                  dataIndex: 'field',
                  key: 'field',
                  render: (txt) => <code style={{ color: '#0f172a' }}>{txt}</code>
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (st) => <Tag color={st === 'OK' ? 'success' : 'warning'}>{st}</Tag>,
                  width: 100
                },
                {
                  title: 'Tuning Advice',
                  dataIndex: 'recommendation',
                  key: 'recommendation',
                  render: (rec) => <Text style={{ fontSize: '12px' }}>{rec}</Text>
                }
              ]}
            />
          </Card>
        </div>
      )}

      {/* 6.8 DATABASE REPLICATION & POOL TUNING */}
      {activeTab === 'dbTuning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card style={{ borderRadius: '16px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Primary Write Node</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a', marginTop: '4px' }}>
                  {databaseClusterStatusQuery.data?.getDatabaseClusterStatus?.primaryNodeHealthy ? '🟢 ONLINE & ACTIVE' : '🔴 UNHEALTHY / DOWN'}
                </div>
                <Text type="secondary" style={{ fontSize: '10px' }}>Role: master-node-primary-01</Text>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card style={{ borderRadius: '16px', background: '#eff6ff', border: '1px solid #dbeafe' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Replica replication lag</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '4px' }}>
                  {databaseClusterStatusQuery.data?.getDatabaseClusterStatus?.replicaLagMs ?? 0} ms
                </div>
                <Text type="secondary" style={{ fontSize: '10px' }}>Status: Sync complete</Text>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card style={{ borderRadius: '16px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Active Pool Connections</Text>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706', marginTop: '4px' }}>
                  {databaseClusterStatusQuery.data?.getDatabaseClusterStatus?.activeConnections ?? 0} / {databaseClusterStatusQuery.data?.getDatabaseClusterStatus?.maxPoolSize ?? 20}
                </div>
                <Text type="secondary" style={{ fontSize: '10px' }}>Idle connections count: {databaseClusterStatusQuery.data?.getDatabaseClusterStatus?.idleConnections ?? 0}</Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="⚙️ Database Pool Parameters Configuration" style={{ borderRadius: '16px' }}>
                <Form layout="vertical" onFinish={() => {
                  updateConnectionPoolConfig({
                    variables: {
                      maxConnections: parseInt(maxConnectionsInput),
                      idleTimeoutMs: parseInt(idleTimeoutInput)
                    }
                  });
                }}>
                  <Form.Item label="Max Connection Pool Limit" required>
                    <InputNumber
                      value={maxConnectionsInput}
                      onChange={setMaxConnectionsInput}
                      min={5}
                      max={200}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="Idle Connection Timeout (ms)" required>
                    <InputNumber
                      value={idleTimeoutInput}
                      onChange={setIdleTimeoutInput}
                      min={1000}
                      max={60000}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updatingPool}
                    style={{ background: '#be123c', borderColor: '#be123c', fontWeight: 'bold', borderRadius: '8px' }}
                  >
                    Apply Pool Configuration
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="💾 Cluster Failover Sequence Simulation" style={{ borderRadius: '16px' }}>
                <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                  Trigger a manual node failover diagnostic sequence to test platform fallback logic and high-availability redirection.
                </Paragraph>
                <Button
                  type="primary"
                  danger
                  loading={triggeringFailover}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Confirm Node Failover',
                      content: 'Are you sure you want to trigger manual cluster failover sequence? This will simulate primary database failover.',
                      okText: 'Trigger Failover',
                      okType: 'danger',
                      cancelText: 'Cancel',
                      onOk: () => triggerFailoverSimulation()
                    });
                  }}
                  style={{ fontWeight: 'bold', height: '40px', borderRadius: '8px' }}
                >
                  Initiate Replica Failover
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* 6.9 DEVOPS OBSERVABILITY & ENVIRONMENT GOVERNANCE */}
      {activeTab === 'devops' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Row gutter={[16, 16]}>
            {/* Environment Governance Details */}
            <Col xs={24} md={8}>
              <Card title="🚀 Active Node Environment" style={{ borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Release Version</Text>
                    <div><Text strong style={{ fontSize: '15px' }}>{environmentStatusQuery.data?.getEnvironmentStatus?.releaseVersion || 'v1.4.0-stable'}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Environment Type</Text>
                    <div><Tag color="cyan">{(environmentStatusQuery.data?.getEnvironmentStatus?.envMode || 'production').toUpperCase()}</Tag></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Node Runtime Engine</Text>
                    <div><Text style={{ fontFamily: 'monospace' }}>{environmentStatusQuery.data?.getEnvironmentStatus?.nodeVersion || 'v20.11.0'}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Server Host OS</Text>
                    <div><Text style={{ textTransform: 'capitalize' }}>{environmentStatusQuery.data?.getEnvironmentStatus?.platform || 'win32'}</Text></div>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Observability Backup Logs */}
            <Col xs={24} md={16}>
              <Card
                title="💾 Database Backup Registry Log"
                extra={
                  <Button
                    type="primary"
                    onClick={() => triggerBackupDrill()}
                    loading={triggeringBackup}
                    style={{ background: '#be123c', borderColor: '#be123c', fontWeight: 'bold' }}
                  >
                    Archive Database Snapshot
                  </Button>
                }
                style={{ borderRadius: '16px' }}
              >
                <Table
                  dataSource={backupHistoryQuery.data?.getBackupHistory || []}
                  rowKey="id"
                  loading={backupHistoryQuery.loading}
                  columns={[
                    {
                      title: 'Archive Filename',
                      dataIndex: 'fileName',
                      key: 'fileName',
                      render: (name) => <Text style={{ fontFamily: 'monospace', fontSize: '11px' }}>{name}</Text>
                    },
                    {
                      title: 'Size',
                      dataIndex: 'backupSize',
                      key: 'backupSize',
                      render: (size) => `${size.toFixed(1)} MB`,
                      width: 100
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (st) => <Tag color="success">{st}</Tag>,
                      width: 100
                    },
                    {
                      title: 'Created At',
                      dataIndex: 'timestamp',
                      key: 'timestamp',
                      render: (t) => new Date(t).toLocaleString(),
                      width: 170
                    },
                    {
                      title: 'Restore Test',
                      key: 'restore',
                      render: (_, record) => (
                        <Button
                          size="small"
                          danger
                          onClick={() => {
                            Modal.confirm({
                              title: 'Trigger Restore Test',
                              content: `Confirm restore test execution using backup: ${record.fileName}? This will validate snapshot readability.`,
                              okText: 'Run Restore Drill',
                              okType: 'danger',
                              onOk: () => triggerRestoreDrill({ variables: { backupId: record.id } })
                            });
                          }}
                        >
                          Restore Drill
                        </Button>
                      ),
                      width: 120
                    }
                  ]}
                  locale={{ emptyText: 'No database snapshots archived yet.' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
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
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
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
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
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

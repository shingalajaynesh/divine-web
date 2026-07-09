import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { 
  Card, Tabs, Select, Button, Spin, Tag, Row, Col, Space, Typography, 
  Modal, Avatar, Input, List, Checkbox, Form, InputNumber, Divider, Table 
} from 'antd';
import { 
  CalendarOutlined, VideoCameraOutlined, CloseCircleOutlined, UserOutlined, 
  PlusOutlined, DeleteOutlined, SaveOutlined, ScheduleOutlined, 
  CheckCircleOutlined, AlertOutlined, BookOutlined 
} from '@ant-design/icons';
import { 
  GET_PRESCRIPTION_SUMMARY_QUERY, 
  SUBMIT_CASE_NOTES_MUTATION,
  SUBMIT_INTAKE_FORM_MUTATION
} from '../graphql/operations';

const { Title, Paragraph, Text } = Typography;

const GET_EXPERT_SCHEDULES = gql`
  query GetExpertSchedules {
    getExpertSchedules {
      id
      dayOfWeek
      startTime
      endTime
      slotDurationMins
      expert {
        id
        displayName
        emailAddress
      }
    }
  }
`;

const GET_MY_CONSULTATIONS = gql`
  query GetMyConsultations {
    getMyConsultations {
      id
      scheduleSlot
      videoCallUrl
      status
      caseNotes
      followUpTasks
      intakeForm
      prescriptions
      documents
      followUpDate
      user {
        id
        displayName
        emailAddress
      }
      expert {
        id
        displayName
      }
    }
  }
`;

const BOOK_CONSULTATION = gql`
  mutation BookConsultation($expertId: ID!, $scheduleSlot: String!) {
    bookConsultation(expertId: $expertId, scheduleSlot: $scheduleSlot) {
      id
      scheduleSlot
      videoCallUrl
    }
  }
`;

const CANCEL_CONSULTATION = gql`
  mutation CancelConsultation($bookingId: ID!) {
    cancelConsultation(bookingId: $bookingId)
  }
`;

// NEW mutations for Slot setup and Status updates
const CREATE_EXPERT_SCHEDULE = gql`
  mutation CreateExpertSchedule($dayOfWeek: Int!, $startTime: String!, $endTime: String!, $slotDurationMins: Int!) {
    createExpertSchedule(dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime, slotDurationMins: $slotDurationMins) {
      id
      dayOfWeek
      startTime
      endTime
      slotDurationMins
    }
  }
`;

const DELETE_EXPERT_SCHEDULE = gql`
  mutation DeleteExpertSchedule($id: ID!) {
    deleteExpertSchedule(id: $id)
  }
`;

const UPDATE_CONSULTATION_STATUS = gql`
  mutation UpdateConsultationStatus($bookingId: ID!, $status: String!) {
    updateConsultationStatus(bookingId: $bookingId, status: $status) {
      id
      status
    }
  }
`;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ExpertConsultation({ user, t = {}, lang = 'en' }) {
  const isHi = lang === 'hi';
  const isExpert = user?.role?.roleType === 'GUIDE' || user?.role?.roleType === 'STAFF' || user?.role?.roleType === 'ADMIN';

  // Queries
  const { data: schedulesData, loading: loadingSchedules, refetch: refetchSchedules } = useQuery(GET_EXPERT_SCHEDULES);
  const { data: consultsData, loading: loadingConsults, refetch: refetchConsults } = useQuery(GET_MY_CONSULTATIONS);

  // Mutations
  const [bookConsultation, { loading: booking }] = useMutation(BOOK_CONSULTATION);
  const [cancelConsultation, { loading: cancelling }] = useMutation(CANCEL_CONSULTATION);
  const [submitCaseNotes] = useMutation(SUBMIT_CASE_NOTES_MUTATION);
  
  const [submitIntakeForm, { loading: submittingIntake }] = useMutation(SUBMIT_INTAKE_FORM_MUTATION, {
    onCompleted: () => {
      refetchConsults();
      setIsIntakeModalOpen(false);
      resetIntakeForm();
      toast.success(isHi ? 'प्रवेश पत्र सफलतापूर्वक सबमिट किया गया!' : 'Intake form submitted successfully!');
    },
    onError: (err) => toast.error(err.message)
  });
  
  const [createExpertSchedule, { loading: creatingSchedule }] = useMutation(CREATE_EXPERT_SCHEDULE, {
    onCompleted: () => {
      refetchSchedules();
      toast.success(isHi ? 'शेड्यूल स्लॉट बनाया गया!' : 'Schedule slot created successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [deleteExpertSchedule] = useMutation(DELETE_EXPERT_SCHEDULE, {
    onCompleted: () => {
      refetchSchedules();
      toast.success(isHi ? 'स्लॉट हटा दिया गया!' : 'Slot deleted successfully!');
    },
    onError: (err) => toast.error(err.message)
  });

  const [updateConsultationStatus] = useMutation(UPDATE_CONSULTATION_STATUS, {
    onCompleted: () => {
      refetchConsults();
      toast.success(isHi ? 'स्थिति अपडेट की गई!' : 'Consultation status updated!');
    },
    onError: (err) => toast.error(err.message)
  });

  // State
  const [activeTab, setActiveTab] = useState(isExpert ? 'queue' : 'book');
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotTime, setSelectedSlotTime] = useState('');

  // Add schedule slot state
  const [newDayOfWeek, setNewDayOfWeek] = useState(1); // Monday
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [newDuration, setNewDuration] = useState(30);

  // Intake Form state
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [intakeBookingId, setIntakeBookingId] = useState('');
  const [intakeGestationalWeeks, setIntakeGestationalWeeks] = useState(12);
  const [intakeSymptoms, setIntakeSymptoms] = useState([]);
  const [intakeConcerns, setIntakeConcerns] = useState('');
  const [intakeHistory, setIntakeHistory] = useState('');

  const resetIntakeForm = () => {
    setIntakeBookingId('');
    setIntakeGestationalWeeks(12);
    setIntakeSymptoms([]);
    setIntakeConcerns('');
    setIntakeHistory('');
  };

  // Case notes editor states
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [caseNotes, setCaseNotes] = useState('');
  const [followUpTasks, setFollowUpTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const [prescriptions, setPrescriptions] = useState([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedDuration, setNewMedDuration] = useState(7);

  const [documents, setDocuments] = useState([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  const [followUpDate, setFollowUpDate] = useState('');

  const schedules = schedulesData?.getExpertSchedules || [];
  const consults = consultsData?.getMyConsultations || [];

  // Group unique experts for Mother view
  const uniqueExperts = [];
  schedules.forEach((s) => {
    if (!uniqueExperts.some((e) => e.id === s.expert.id)) {
      uniqueExperts.push(s.expert);
    }
  });

  const expertSchedules = schedules.filter((s) => s.expert.id === selectedExpertId);

  // Filter only schedules belonging to the logged-in expert
  const mySchedules = schedules.filter(s => s.expert?.id === user?.id);

  const getDateOptions = () => {
    const options = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();

      const hasSched = expertSchedules.some((s) => s.dayOfWeek === dayOfWeek);
      if (hasSched) {
        options.push({
          dateStr: date.toISOString().split('T')[0],
          label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        });
      }
    }
    return options;
  };

  const getSlotOptions = () => {
    if (!selectedDate) return [];
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay();

    const matchedSchedules = expertSchedules.filter((s) => s.dayOfWeek === dayOfWeek);
    const slots = [];

    matchedSchedules.forEach((s) => {
      let current = new Date(`${selectedDate}T${s.startTime}:00`);
      const end = new Date(`${selectedDate}T${s.endTime}:00`);

      while (current < end) {
        const timeStr = current.toTimeString().split(' ')[0].substring(0, 5);
        slots.push(timeStr);
        current.setMinutes(current.getMinutes() + s.slotDurationMins);
      }
    });

    return slots;
  };

  const handleBook = async () => {
    if (!selectedExpertId || !selectedDate || !selectedSlotTime) {
      toast.error(isHi ? 'कृपया सभी फ़ील्ड चुनें' : 'Please select all slots');
      return;
    }

    try {
      const slotTimestamp = new Date(`${selectedDate}T${selectedSlotTime}:00`).toISOString();
      await bookConsultation({
        variables: { expertId: selectedExpertId, scheduleSlot: slotTimestamp }
      });
      toast.success(isHi ? 'परामर्श सफलतापूर्वक बुक किया गया!' : 'Consultation booked successfully!');
      refetchConsults();
      setActiveTab('appointments');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await cancelConsultation({ variables: { bookingId } });
      toast.success(isHi ? 'परामर्श रद्द कर दिया गया' : 'Consultation cancelled successfully');
      refetchConsults();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSaveNotes = async (bookingId) => {
    try {
      await submitCaseNotes({
        variables: {
          input: {
            bookingId,
            caseNotes,
            followUpTasks,
            prescriptions: prescriptions.length > 0 ? JSON.stringify(prescriptions) : null,
            documents: documents.length > 0 ? JSON.stringify(documents) : null,
            followUpDate: followUpDate || null
          }
        }
      });
      toast.success(isHi ? "केस नोट्स सहेजे गए" : "Case notes submitted successfully");
      setEditingBookingId(null);
      refetchConsults();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleCreateSchedule = () => {
    if (!newStartTime || !newEndTime) {
      toast.error(isHi ? 'प्रारंभ और समाप्ति समय प्रदान करें' : 'Please provide start and end hours');
      return;
    }
    createExpertSchedule({
      variables: {
        dayOfWeek: parseInt(newDayOfWeek),
        startTime: newStartTime,
        endTime: newEndTime,
        slotDurationMins: parseInt(newDuration)
      }
    });
  };

  const addTask = () => {
    if (!newTaskInput.trim()) return;
    setFollowUpTasks([...followUpTasks, newTaskInput.trim()]);
    setNewTaskInput('');
  };

  const deleteTask = (index) => {
    setFollowUpTasks(followUpTasks.filter((_, i) => i !== index));
  };

  const startEditNotes = (consult) => {
    setEditingBookingId(consult.id);
    setCaseNotes(consult.caseNotes || '');
    try {
      setFollowUpTasks(JSON.parse(consult.followUpTasks || '[]'));
    } catch (e) {
      setFollowUpTasks([]);
    }
    try {
      setPrescriptions(JSON.parse(consult.prescriptions || '[]'));
    } catch (e) {
      setPrescriptions([]);
    }
    try {
      setDocuments(JSON.parse(consult.documents || '[]'));
    } catch (e) {
      setDocuments([]);
    }
    setFollowUpDate(consult.followUpDate || '');
  };

  // Render Experts Tab headers
  const tabsItems = isExpert ? [
    { key: 'queue', label: isHi ? 'परामर्श कतार' : 'Consultation Queue' },
    { key: 'slots', label: isHi ? 'साप्ताहिक स्लॉट सेटिंग्स' : 'Manage Weekly Slots' }
  ] : [
    { key: 'book', label: isHi ? 'सलाहकार बुक करें' : 'Book a Consultation' },
    { key: 'appointments', label: isHi ? 'मेरे अप्वाइंटमेंट' : 'My Appointments' }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>
          👩‍⚕️ {isExpert ? (isHi ? "विशेषज्ञ क्लिनिकल कंसोल" : "Expert Clinical Dashboard") : (isHi ? "डॉक्टर और विशेषज्ञ व्यक्तिगत परामर्श" : "Doctor & Expert Personal Consultation")}
        </Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          {isExpert 
            ? (isHi ? "अपनी वीडियो परामर्श नियुक्तियों को प्रबंधित करें, साप्ताहिक स्लॉट घंटे जोड़ें और नुस्खे/केस नोट्स सहेजें।" : "Configure your weekly availability hours, join secure video sessions, and submit clinical case diagnostics.")
            : (isHi ? "स्त्री रोग विशेषज्ञों, बाल रोग विशेषज्ञों और प्रसव-पूर्व सलाहकारों के साथ वन-टू-वन वीडियो सत्र बुक करें।" : "Schedule 1-to-1 video guidance call sessions with gynecologists and pediatric experts.")
          }
        </Paragraph>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabsItems}
        style={{ marginBottom: '24px' }}
      />

      {/* ======================================================== */}
      {/* EXPERT TAB 1: CONSULTATION QUEUE */}
      {/* ======================================================== */}
      {isExpert && activeTab === 'queue' && (
        <div>
          {loadingConsults ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
          ) : consults.length === 0 ? (
            <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0', margin: 0, fontStyle: 'italic' }}>
              {isHi ? "अभी कोई बुक किया गया अपॉइंटमेंट नहीं मिला।" : "No booked appointments assigned for you."}
            </Paragraph>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {consults.map((consult) => {
                let taskList = [];
                try {
                  taskList = JSON.parse(consult.followUpTasks || '[]');
                } catch (e) {
                  taskList = [];
                }

                return (
                  <Card key={consult.id} style={{ width: '100%', borderRadius: 20, border: '1px solid #e2e8f0' }} styles={{ body: { padding: '24px' } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <Space size="middle">
                          <Avatar icon={<UserOutlined />} style={{ background: '#ffedd5', color: '#f97316' }} />
                          <div>
                            <Text strong style={{ fontSize: '15px', display: 'block' }}>
                              Patient: {consult.user?.displayName || 'Unknown Member'}
                            </Text>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {consult.user?.emailAddress}
                            </div>
                            <Tag color="orange" icon={<CalendarOutlined />} style={{ fontWeight: 'bold', marginTop: '6px' }}>
                              {new Date(consult.scheduleSlot).toLocaleString(undefined, {
                                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </Tag>
                            <Tag color={
                              consult.status === 'confirmed' ? 'blue' :
                              consult.status === 'completed' ? 'green' : 'red'
                            } style={{ fontWeight: 'bold' }}>
                              {consult.status.toUpperCase()}
                            </Tag>
                          </div>
                        </Space>
                      </div>

                      <Space orientation="vertical" align="end">
                        <Space>
                          <Button 
                            type="primary" 
                            href={consult.videoCallUrl} 
                            target="_blank" 
                            icon={<VideoCameraOutlined />}
                            style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 'bold' }}
                          >
                            {isHi ? "वीडियो कॉल में शामिल हों" : "Join Video Call"}
                          </Button>
                          {consult.status !== 'cancelled' && (
                            <Button 
                              type="text" 
                              danger
                              onClick={() => handleCancel(consult.id)} 
                              loading={cancelling}
                              icon={<CloseCircleOutlined />}
                              style={{ fontWeight: 'bold' }}
                            >
                              {isHi ? "रद्द करें" : "Cancel"}
                            </Button>
                          )}
                        </Space>

                        <div style={{ marginTop: '8px' }}>
                          <Text style={{ fontSize: '12px', marginRight: '8px' }}>Update Status:</Text>
                          <Select 
                            value={consult.status} 
                            onChange={(val) => updateConsultationStatus({ variables: { bookingId: consult.id, status: val } })}
                            style={{ width: '130px' }}
                            size="small"
                          >
                            <Select.Option value="confirmed">Confirmed</Select.Option>
                            <Select.Option value="completed">Completed</Select.Option>
                            <Select.Option value="no_show">No Show</Select.Option>
                          </Select>
                        </div>
                      </Space>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    {/* Patient Intake Form Details */}
                    {consult.intakeForm && (
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                        <Text strong style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                          📋 Patient Pre-Consultation Intake Form
                        </Text>
                        {(() => {
                          try {
                            const intake = JSON.parse(consult.intakeForm);
                            return (
                              <Row gutter={[16, 8]}>
                                <Col span={12}><Text type="secondary" style={{ fontSize: '11px' }}>Gestational Age:</Text> <Text style={{ fontSize: '12px' }} strong>{intake.gestationalWeeks} Weeks</Text></Col>
                                <Col span={12}><Text type="secondary" style={{ fontSize: '11px' }}>Reported Symptoms:</Text> <Text style={{ fontSize: '12px' }} strong>{(intake.symptoms || []).join(', ') || 'None'}</Text></Col>
                                <Col span={24}><Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Key Concerns:</Text> <Text style={{ fontSize: '12px' }}>{intake.concerns || 'N/A'}</Text></Col>
                                <Col span={24}><Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Medical History:</Text> <Text style={{ fontSize: '12px' }}>{intake.medicalHistory || 'None recorded'}</Text></Col>
                              </Row>
                            );
                          } catch (e) {
                            return <Text type="danger">Error parsing intake form.</Text>;
                          }
                        })()}
                      </div>
                    )}

                    {/* Case prescription editor */}
                    <div>
                      {editingBookingId === consult.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                          <Title level={5} style={{ margin: 0, color: '#be123c' }}>👩‍⚕️ Case Prescription & Clinical Notes Editor</Title>
                          
                          <div>
                            <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Clinical Session Notes *</Text>
                            <Input.TextArea 
                              value={caseNotes} 
                              onChange={e => setCaseNotes(e.target.value)} 
                              placeholder="Describe maternal wellness vitals, health status, and medical suggestions..." 
                              rows={3} 
                            />
                          </div>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Recommended Follow-up Date</Text>
                              <Input 
                                type="date" 
                                value={followUpDate} 
                                onChange={e => setFollowUpDate(e.target.value)} 
                              />
                            </Col>
                          </Row>

                          {/* Prescriptions medicines section */}
                          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: '#be123c' }}>Medicines / Supplements Prescription</Text>
                            <Row gutter={8} align="bottom" style={{ marginBottom: '8px' }}>
                              <Col span={10}>
                                <Text style={{ fontSize: '10px' }}>Med Name</Text>
                                <Input size="small" placeholder="e.g. Iron & Folic Acid" value={newMedName} onChange={e => setNewMedName(e.target.value)} />
                              </Col>
                              <Col span={8}>
                                <Text style={{ fontSize: '10px' }}>Dosage</Text>
                                <Input size="small" placeholder="e.g. Once daily after lunch" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} />
                              </Col>
                              <Col span={4}>
                                <Text style={{ fontSize: '10px' }}>Days</Text>
                                <InputNumber size="small" min={1} style={{ width: '100%' }} value={newMedDuration} onChange={setNewMedDuration} />
                              </Col>
                              <Col span={2}>
                                <Button 
                                  size="small" 
                                  type="primary" 
                                  icon={<PlusOutlined />} 
                                  onClick={() => {
                                    if (!newMedName) return;
                                    setPrescriptions([...prescriptions, { name: newMedName, dosage: newMedDosage, durationDays: newMedDuration }]);
                                    setNewMedName('');
                                    setNewMedDosage('');
                                    setNewMedDuration(7);
                                  }}
                                />
                              </Col>
                            </Row>
                            <List
                              size="small"
                              dataSource={prescriptions}
                              renderItem={(item, index) => (
                                <List.Item actions={[<Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => setPrescriptions(prescriptions.filter((_, idx) => idx !== index))} />]}>
                                  <Text style={{ fontSize: '12px' }}>💊 <Text strong>{item.name}</Text> - {item.dosage} ({item.durationDays} Days)</Text>
                                </List.Item>
                              )}
                            />
                          </div>

                          {/* Documents attachments section */}
                          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: '#be123c' }}>Add Diagnostic / Ultrasound Reports</Text>
                            <Row gutter={8} align="bottom" style={{ marginBottom: '8px' }}>
                              <Col span={10}>
                                <Text style={{ fontSize: '10px' }}>Document Name</Text>
                                <Input size="small" placeholder="e.g. Trimester 1 Scan" value={newDocName} onChange={e => setNewDocName(e.target.value)} />
                              </Col>
                              <Col span={12}>
                                <Text style={{ fontSize: '10px' }}>Document URL</Text>
                                <Input size="small" placeholder="e.g. https://cloud.com/report.pdf" value={newDocUrl} onChange={e => setNewDocUrl(e.target.value)} />
                              </Col>
                              <Col span={2}>
                                <Button 
                                  size="small" 
                                  type="primary" 
                                  icon={<PlusOutlined />} 
                                  onClick={() => {
                                    if (!newDocName || !newDocUrl) return;
                                    setDocuments([...documents, { name: newDocName, url: newDocUrl }]);
                                    setNewDocName('');
                                    setNewDocUrl('');
                                  }}
                                />
                              </Col>
                            </Row>
                            <List
                              size="small"
                              dataSource={documents}
                              renderItem={(item, index) => (
                                <List.Item actions={[<Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => setDocuments(documents.filter((_, idx) => idx !== index))} />]}>
                                  <Text style={{ fontSize: '12px' }}>📄 <a href={item.url} target="_blank" rel="noreferrer">{item.name}</a></Text>
                                </List.Item>
                              )}
                            />
                          </div>
                          
                          <div>
                            <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Maternal Follow-up Tasks</Text>
                            <Space style={{ display: 'flex', marginBottom: '8px' }}>
                              <Input 
                                placeholder="Add daily action task (e.g. walk 20 mins)" 
                                value={newTaskInput} 
                                onChange={e => setNewTaskInput(e.target.value)} 
                                onPressEnter={addTask} 
                              />
                              <Button type="primary" onClick={addTask} icon={<PlusOutlined />} />
                            </Space>
                            <List
                              size="small"
                              bordered
                              dataSource={followUpTasks}
                              renderItem={(item, index) => (
                                <List.Item actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTask(index)} />]}>
                                  {item}
                                </List.Item>
                              )}
                            />
                          </div>

                          <Space>
                            <Button type="primary" onClick={() => handleSaveNotes(consult.id)} icon={<SaveOutlined />} style={{ background: '#0f766e', borderColor: '#0f766e' }}>
                              Save Session Notes
                            </Button>
                            <Button onClick={() => setEditingBookingId(null)}>Cancel</Button>
                          </Space>
                        </div>
                      ) : (
                        <div>
                          {consult.caseNotes ? (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bcf0da', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                              <Text strong style={{ color: '#14532d', display: 'block', marginBottom: '8px' }}>
                                📋 {isHi ? "सत्र केस नोट्स और सलाह" : "Clinical Session Advice & Notes"}
                              </Text>
                              <Paragraph style={{ fontSize: '13px', color: '#166534', margin: '0 0 12px 0' }}>{consult.caseNotes}</Paragraph>
                              
                              {/* Render Prescriptions */}
                              {(() => {
                                try {
                                  const list = JSON.parse(consult.prescriptions || '[]');
                                  if (list.length > 0) {
                                    return (
                                      <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                        <Text strong style={{ fontSize: '12px', color: '#166534', display: 'block', marginBottom: '4px' }}>
                                          💊 Recommended Medicines / Supplements:
                                        </Text>
                                        <List
                                          size="small"
                                          dataSource={list}
                                          renderItem={item => (
                                            <List.Item style={{ border: 0, padding: '2px 0' }}>
                                              <Text style={{ fontSize: '12px', color: '#14532d' }}>• <Text strong>{item.name}</Text>: {item.dosage} ({item.durationDays} Days)</Text>
                                            </List.Item>
                                          )}
                                        />
                                      </div>
                                    );
                                  }
                                } catch (e) {}
                                return null;
                              })()}

                              {/* Render Documents */}
                              {(() => {
                                try {
                                  const list = JSON.parse(consult.documents || '[]');
                                  if (list.length > 0) {
                                    return (
                                      <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                        <Text strong style={{ fontSize: '12px', color: '#166534', display: 'block', marginBottom: '4px' }}>
                                          📄 Shared Reports & Documents:
                                        </Text>
                                        {list.map((doc, idx) => (
                                          <div key={idx} style={{ fontSize: '12px', color: '#14532d' }}>
                                            • <a href={doc.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: '#15803d' }}>{doc.name}</a>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }
                                } catch (e) {}
                                return null;
                              })()}

                              {/* Follow up date */}
                              {consult.followUpDate && (
                                <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                  <Text strong style={{ fontSize: '12px', color: '#166534' }}>
                                    📅 Suggested Follow-up Target:
                                  </Text>
                                  <Text style={{ fontSize: '12px', color: '#14532d', marginLeft: '6px' }}>{new Date(consult.followUpDate).toLocaleDateString()}</Text>
                                </div>
                              )}

                              {taskList.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                  <Text strong style={{ fontSize: '12px', color: '#166534', display: 'block', marginBottom: '6px' }}>
                                    ✅ {isHi ? "आवश्यक अनुवर्ती कार्य" : "Assigned Follow-up Actions"}
                                  </Text>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {taskList.map((task, idx) => (
                                      <Checkbox key={idx} checked disabled>
                                        <span style={{ fontSize: '12px', color: '#14532d' }}>{task}</span>
                                      </Checkbox>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Paragraph type="secondary" style={{ fontStyle: 'italic', margin: 0, fontSize: '12px' }}>
                              {isHi ? "सत्र पूरा होने के बाद डॉक्टर के नोट्स यहाँ दिखाई देंगे।" : "Doctor session clinical notes and prescriptions will appear here after call is complete."}
                            </Paragraph>
                          )}

                          <Button 
                            type="dashed" 
                            onClick={() => startEditNotes(consult)}
                            style={{ marginTop: '12px' }}
                            icon={<SaveOutlined />}
                          >
                            {consult.caseNotes ? "Edit Session Notes" : "Write Session Notes"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* EXPERT TAB 2: SLOT MANAGER */}
      {/* ======================================================== */}
      {isExpert && activeTab === 'slots' && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card title={isHi ? "नया समय ब्लॉक जोड़ें" : "Add Availability Time Block"} style={{ borderRadius: 16 }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Day of Week</Text>
                  <Select 
                    value={newDayOfWeek} 
                    onChange={setNewDayOfWeek} 
                    style={{ width: '100%' }}
                  >
                    {DAYS.map((d, i) => (
                      <Select.Option key={i} value={i}>{d}</Select.Option>
                    ))}
                  </Select>
                </div>
                <Row gutter={12}>
                  <Col span={12}>
                    <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Start Time (e.g. 09:00)</Text>
                    <Input placeholder="09:00" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>End Time (e.g. 17:00)</Text>
                    <Input placeholder="17:00" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
                  </Col>
                </Row>
                <div>
                  <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Slot Duration (minutes)</Text>
                  <Select value={newDuration} onChange={setNewDuration} style={{ width: '100%' }}>
                    <Select.Option value={15}>15 mins</Select.Option>
                    <Select.Option value={30}>30 mins</Select.Option>
                    <Select.Option value={45}>45 mins</Select.Option>
                    <Select.Option value={60}>60 mins</Select.Option>
                  </Select>
                </div>
                <Button 
                  type="primary" 
                  block 
                  icon={<PlusOutlined />} 
                  onClick={handleCreateSchedule}
                  loading={creatingSchedule}
                  style={{ background: '#be123c', borderColor: '#be123c' }}
                >
                  Create Schedule Slot
                </Button>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={14}>
            <Card title={isHi ? "आपकी वर्तमान उपलब्धता" : "Your Active Availability Slots"} style={{ borderRadius: 16 }}>
              <Table 
                dataSource={mySchedules}
                rowKey="id"
                loading={loadingSchedules}
                locale={{ emptyText: 'No availability blocks configured yet.' }}
                columns={[
                  {
                    title: 'Day',
                    dataIndex: 'dayOfWeek',
                    key: 'day',
                    render: (d) => DAYS[d]
                  },
                  {
                    title: 'Hours',
                    key: 'hours',
                    render: (_, record) => `${record.startTime} - ${record.endTime}`
                  },
                  {
                    title: 'Duration',
                    dataIndex: 'slotDurationMins',
                    key: 'duration',
                    render: (m) => `${m} mins`
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    width: 80,
                    render: (_, record) => (
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => deleteExpertSchedule({ variables: { id: record.id } })}
                      />
                    )
                  }
                ]}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* ======================================================== */}
      {/* MOTHER TAB 1: BOOK CONSULTATION */}
      {/* ======================================================== */}
      {!isExpert && activeTab === 'book' && (
        <Space orientation="vertical" size="large" style={{ width: '100%', maxWidth: '600px' }}>
          {/* Select Expert */}
          <div>
            <Text strong type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              {isHi ? "सलाहकार चुनें" : "Select Expert Guide"}
            </Text>
            {loadingSchedules ? (
              <Spin description="Loading expert list..." style={{ width: '100%', padding: '20px 0' }} />
            ) : uniqueExperts.length === 0 ? (
              <Paragraph type="secondary" style={{ fontStyle: 'italic' }}>
                {isHi ? "इस समय कोई विशेषज्ञ उपलब्ध नहीं है।" : "No expert schedules configured at this time."}
              </Paragraph>
            ) : (
              <Row gutter={[12, 12]}>
                {uniqueExperts.map((expert) => (
                  <Col xs={24} sm={12} key={expert.id}>
                    <Card
                      hoverable
                      onClick={() => {
                        setSelectedExpertId(expert.id);
                        setSelectedDate('');
                        setSelectedSlotTime('');
                      }}
                      style={{
                        borderRadius: 16,
                        border: `2px solid ${selectedExpertId === expert.id ? '#be123c' : '#f1f5f9'}`,
                        background: selectedExpertId === expert.id ? '#fffaf8' : '#fff'
                      }}
                      styles={{ body: { padding: '16px' } }}
                    >
                      <Space size="middle">
                        <Avatar size="large" icon={<UserOutlined />} style={{ background: '#ffe4e6', color: '#be123c' }} />
                        <div>
                          <Text strong style={{ fontSize: '13px', display: 'block' }}>👩‍⚕️ {expert.displayName}</Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>{isHi ? "प्रसव-पूर्व विशेषज्ञ" : "Prenatal Consultant"}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Select Date */}
          {selectedExpertId && (
            <div>
              <Text strong type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                {isHi ? "दिनांक चुनें" : "Select Date"}
              </Text>
              <Select
                value={selectedDate}
                onChange={(val) => {
                  setSelectedDate(val);
                  setSelectedSlotTime('');
                }}
                style={{ width: '100%' }}
                placeholder={isHi ? "-- उपलब्ध तिथि चुनें --" : "-- Choose Available Date --"}
                size="large"
                options={getDateOptions().map((opt) => ({
                  value: opt.dateStr,
                  label: opt.label
                }))}
              />
            </div>
          )}

          {/* Select Time Slot */}
          {selectedDate && (
            <div>
              <Text strong type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                {isHi ? "उपलब्ध समय स्लॉट" : "Available Time Slots"}
              </Text>
              <Row gutter={[8, 8]}>
                {getSlotOptions().map((time) => (
                  <Col span={6} key={time}>
                    <Button
                      type={selectedSlotTime === time ? "primary" : "default"}
                      onClick={() => setSelectedSlotTime(time)}
                      block
                      style={{ fontWeight: 'bold' }}
                    >
                      {time}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Confirm Button */}
          {selectedSlotTime && (
            <Button 
              type="primary" 
              onClick={handleBook} 
              loading={booking}
              size="large"
              block
              style={{ height: '48px', fontWeight: 'bold', marginTop: '16px', background: '#be123c', borderColor: '#be123c' }}
            >
              {isHi ? "परामर्श बुकिंग की पुष्टि करें" : "Confirm Consultation Booking"}
            </Button>
          )}
        </Space>
      )}

      {/* ======================================================== */}
      {/* MOTHER TAB 2: MY APPOINTMENTS */}
      {/* ======================================================== */}
      {!isExpert && activeTab === 'appointments' && (
        <div>
          {loadingConsults ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
          ) : consults.filter((c) => c.status === 'confirmed').length === 0 ? (
            <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0', margin: 0, fontStyle: 'italic' }}>
              {isHi ? "कोई अपॉइंटमेंट नहीं मिला।" : "No confirmed appointments found."}
            </Paragraph>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {consults.filter((c) => c.status === 'confirmed').map((consult) => {
                let taskList = [];
                try {
                  taskList = JSON.parse(consult.followUpTasks || '[]');
                } catch (e) {
                  taskList = [];
                }

                return (
                  <Card key={consult.id} style={{ width: '100%', borderRadius: 20, border: '1px solid #e2e8f0' }} styles={{ body: { padding: '24px' } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <Space size="middle">
                          <Avatar icon={<UserOutlined />} style={{ background: '#ffe4e6', color: '#be123c' }} />
                          <div>
                            <Text strong style={{ fontSize: '15px', display: 'block' }}>
                              Consultant: {consult.expert?.displayName || 'Unknown Doctor'}
                            </Text>
                            <Tag color="orange" icon={<CalendarOutlined />} style={{ fontWeight: 'bold', marginTop: '6px' }}>
                              {new Date(consult.scheduleSlot).toLocaleString(undefined, {
                                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </Tag>
                            {consult.intakeForm ? (
                              <Tag color="green" style={{ fontWeight: 'bold' }}>✓ Intake Submitted</Tag>
                            ) : (
                              <Tag color="red" style={{ fontWeight: 'bold' }}>⚠ Intake Pending</Tag>
                            )}
                          </div>
                        </Space>
                      </div>

                      <Space>
                        <Button 
                          type="primary" 
                          href={consult.videoCallUrl} 
                          target="_blank" 
                          icon={<VideoCameraOutlined />}
                          style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 'bold' }}
                        >
                          {isHi ? "वीडियो कॉल में शामिल हों" : "Join Video Call"}
                        </Button>
                        <Button 
                          type="text" 
                          danger
                          onClick={() => handleCancel(consult.id)} 
                          loading={cancelling}
                          icon={<CloseCircleOutlined />}
                          style={{ fontWeight: 'bold' }}
                        >
                          {isHi ? "रद्द करें" : "Cancel"}
                        </Button>
                      </Space>
                    </div>

                    {!consult.intakeForm && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: '12px', color: '#b45309' }}>
                          ⚠ Please fill in the pre-consultation medical intake details for the doctor.
                        </Text>
                        <Button 
                          size="small" 
                          type="primary" 
                          style={{ background: '#be123c', borderColor: '#be123c', fontSize: '11px' }}
                          onClick={() => {
                            setIntakeBookingId(consult.id);
                            setIsIntakeModalOpen(true);
                          }}
                        >
                          Fill Intake Form
                        </Button>
                      </div>
                    )}

                    <Divider style={{ margin: '16px 0' }} />

                    {/* Prescription read-only */}
                    <div>
                      {consult.caseNotes ? (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bcf0da', padding: '16px', borderRadius: '12px' }}>
                          <Text strong style={{ color: '#14532d', display: 'block', marginBottom: '8px' }}>
                            📋 {isHi ? "सत्र केस नोट्स और सलाह" : "Clinical Session Advice & Notes"}
                          </Text>
                          <Paragraph style={{ fontSize: '13px', color: '#166534', margin: '0 0 12px 0' }}>{consult.caseNotes}</Paragraph>
                          
                          {/* Render Prescriptions */}
                          {(() => {
                            try {
                              const list = JSON.parse(consult.prescriptions || '[]');
                              if (list.length > 0) {
                                return (
                                  <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                    <Text strong style={{ fontSize: '12px', color: '#166534', display: 'block', marginBottom: '4px' }}>
                                      💊 Recommended Medicines / Supplements:
                                    </Text>
                                    <List
                                      size="small"
                                      dataSource={list}
                                      renderItem={item => (
                                        <List.Item style={{ border: 0, padding: '2px 0' }}>
                                          <Text style={{ fontSize: '12px', color: '#14532d' }}>• <Text strong>{item.name}</Text>: {item.dosage} ({item.durationDays} Days)</Text>
                                        </List.Item>
                                      )}
                                    />
                                  </div>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}

                          {/* Render Documents */}
                          {(() => {
                            try {
                              const list = JSON.parse(consult.documents || '[]');
                              if (list.length > 0) {
                                return (
                                  <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                    <Text strong style={{ fontSize: '12px', color: '#166534', display: 'block', marginBottom: '4px' }}>
                                      📄 Shared Reports & Documents:
                                    </Text>
                                    {list.map((doc, idx) => (
                                      <div key={idx} style={{ fontSize: '12px', color: '#14532d' }}>
                                        • <a href={doc.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: '#15803d' }}>{doc.name}</a>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}

                          {/* Follow up date */}
                          {consult.followUpDate && (
                            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                              <Text strong style={{ fontSize: '12px', color: '#166534' }}>
                                📅 Suggested Follow-up Target:
                              </Text>
                              <Text style={{ fontSize: '12px', color: '#14532d', marginLeft: '6px' }}>{new Date(consult.followUpDate).toLocaleDateString()}</Text>
                            </div>
                          )}

                          {taskList.length > 0 && (
                            <div>
                              <Text strong style={{ fontSize: '12px', color: '#166534', display: 'block', marginBottom: '6px' }}>
                                ✅ {isHi ? "आवश्यक अनुवर्ती कार्य" : "Assigned Follow-up Actions"}
                              </Text>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {taskList.map((task, idx) => (
                                  <Checkbox key={idx} defaultChecked={false}>
                                    <span style={{ fontSize: '12px', color: '#14532d' }}>{task}</span>
                                  </Checkbox>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Paragraph type="secondary" style={{ fontStyle: 'italic', margin: 0, fontSize: '12px' }}>
                          {isHi ? "सत्र पूरा होने के बाद डॉक्टर के नोट्स यहाँ दिखाई देंगे।" : "Doctor session clinical notes and prescriptions will appear here after call is complete."}
                        </Paragraph>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pre-Consultation Intake Form Modal */}
      <Modal
        title={isHi ? "पूर्व-परामर्श प्रवेश पत्र (Pre-Consultation Intake)" : "Pre-Consultation Intake Form"}
        open={isIntakeModalOpen}
        onCancel={() => { setIsIntakeModalOpen(false); resetIntakeForm(); }}
        footer={[
          <Button key="cancel" onClick={() => { setIsIntakeModalOpen(false); resetIntakeForm(); }}>Cancel</Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={submittingIntake}
            onClick={() => {
              if (!intakeConcerns) {
                toast.error("Please mention your key concerns.");
                return;
              }
              submitIntakeForm({
                variables: {
                  bookingId: intakeBookingId,
                  gestationalWeeks: parseInt(intakeGestationalWeeks),
                  symptoms: intakeSymptoms,
                  concerns: intakeConcerns,
                  medicalHistory: intakeHistory
                }
              });
            }}
            style={{ background: '#be123c', borderColor: '#be123c' }}
          >
            Submit Intake Form
          </Button>
        ]}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Gestational Stage (Weeks) *" required>
            <InputNumber min={1} max={42} value={intakeGestationalWeeks} onChange={setIntakeGestationalWeeks} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Are you experiencing any of these symptoms?">
            <Checkbox.Group 
              value={intakeSymptoms} 
              onChange={setIntakeSymptoms}
              options={[
                { label: 'Nausea / Vomiting', value: 'Nausea' },
                { label: 'Fatigue', value: 'Fatigue' },
                { label: 'Back Pain', value: 'Back Pain' },
                { label: 'Swelling', value: 'Swelling' },
                { label: 'Mood swings', value: 'Mood Swings' }
              ]}
            />
          </Form.Item>
          <Form.Item label="Key Concerns / Questions for the Expert *" required>
            <Input.TextArea 
              rows={3} 
              placeholder="Describe what you want to discuss with the doctor..." 
              value={intakeConcerns} 
              onChange={e => setIntakeConcerns(e.target.value)} 
            />
          </Form.Item>
          <Form.Item label="Relevant Medical History (Optional)">
            <Input.TextArea 
              rows={2} 
              placeholder="Prior pregnancies, chronic conditions, thyroid, etc..." 
              value={intakeHistory} 
              onChange={e => setIntakeHistory(e.target.value)} 
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

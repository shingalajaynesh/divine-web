import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Tabs, Select, Button, Spin, Tag, Row, Col, Space, Typography, Modal, Avatar, Input, List, Checkbox } from 'antd';
import { CalendarOutlined, VideoCameraOutlined, CloseCircleOutlined, UserOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { 
  GET_PRESCRIPTION_SUMMARY_QUERY, 
  SUBMIT_CASE_NOTES_MUTATION 
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
      user {
        id
        displayName
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

export default function ExpertConsultation({ user, t, lang }) {
  const isHi = lang === 'hi';
  const isExpert = user?.role?.roleType === 'STAFF' || user?.role?.roleType === 'ADMIN';

  const { data: schedulesData, loading: loadingSchedules } = useQuery(GET_EXPERT_SCHEDULES);
  const { data: consultsData, loading: loadingConsults, refetch: refetchConsults } = useQuery(GET_MY_CONSULTATIONS);
  const [bookConsultation, { loading: booking }] = useMutation(BOOK_CONSULTATION);
  const [cancelConsultation, { loading: cancelling }] = useMutation(CANCEL_CONSULTATION);
  const [submitCaseNotes] = useMutation(SUBMIT_CASE_NOTES_MUTATION);

  const [activeSubTab, setActiveSubTab] = useState('book');
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotTime, setSelectedSlotTime] = useState('');

  // Case notes editor states
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [caseNotes, setCaseNotes] = useState('');
  const [followUpTasks, setFollowUpTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const WEBSITE = 'https://www.thedivinegarbhsanskar.com';

  const schedules = schedulesData?.getExpertSchedules || [];
  const consults = consultsData?.getMyConsultations || [];

  // Group unique experts
  const uniqueExperts = [];
  schedules.forEach((s) => {
    if (!uniqueExperts.some((e) => e.id === s.expert.id)) {
      uniqueExperts.push(s.expert);
    }
  });

  const expertSchedules = schedules.filter((s) => s.expert.id === selectedExpertId);

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
      setActiveSubTab('appointments');
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
            followUpTasks
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
  };

  const tabItems = [
    {
      key: 'book',
      label: isHi ? 'सलाहकार बुक करें' : 'Book a Consultation',
    },
    {
      key: 'appointments',
      label: isHi ? 'मेरे अप्वाइंटमेंट' : 'My Appointments',
    }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>
          👩‍⚕️ {isHi ? "डॉक्टर और विशेषज्ञ व्यक्तिगत परामर्श" : "Doctor & Expert Personal Consultation"}
        </Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          {isHi 
            ? "स्त्री रोग विशेषज्ञों, बाल रोग विशेषज्ञों और प्रसव-पूर्व सलाहकारों के साथ वन-टू-वन वीडियो सत्र बुक करें।" 
            : "Schedule 1-to-1 video guidance call sessions with gynecologists and pediatric experts."}
        </Paragraph>
      </div>

      <Tabs 
        activeKey={activeSubTab} 
        onChange={setActiveSubTab} 
        items={tabItems}
        style={{ marginBottom: '24px' }}
      />

      {activeSubTab === 'book' ? (
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
                        border: `2px solid ${selectedExpertId === expert.id ? '#f97316' : '#f1f5f9'}`,
                        background: selectedExpertId === expert.id ? '#fffaf8' : '#fff'
                      }}
                      styles={{ body: { padding: '16px' } }}
                    >
                      <Space size="middle">
                        <Avatar size="large" icon={<UserOutlined />} style={{ background: '#ffedd5', color: '#f97316' }} />
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
              style={{ height: '48px', fontWeight: 'bold', marginTop: '16px', background: '#0f766e', borderColor: '#0f766e' }}
            >
              {isHi ? "परामर्श बुकिंग की पुष्टि करें" : "Confirm Consultation Booking"}
            </Button>
          )}
        </Space>
      ) : (
        /* My Appointments List */
        <div>
          {loadingConsults ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin description="Loading your booked slots..." />
            </div>
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
                          <Avatar icon={<UserOutlined />} style={{ background: '#ffedd5', color: '#f97316' }} />
                          <div>
                            <Text strong style={{ fontSize: '15px', display: 'block' }}>
                              {isExpert 
                                ? (isHi ? `मरीज: ${consult.user.displayName}` : `Patient: ${consult.user.displayName}`)
                                : (isHi ? `डॉक्टर: ${consult.expert.displayName}` : `Consultant: ${consult.expert.displayName}`)
                              }
                            </Text>
                            <Tag color="orange" icon={<CalendarOutlined />} style={{ fontWeight: 'bold', marginTop: '6px' }}>
                              {new Date(consult.scheduleSlot).toLocaleString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Tag>
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

                    <Divider style={{ margin: '16px 0' }} />

                    {/* Prescription and Notes Area */}
                    <div>
                      {editingBookingId === consult.id ? (
                        /* Expert Notes Editor Mode */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                          <Title level={5} style={{ margin: 0 }}>👩‍⚕️ Case Prescription Editor</Title>
                          <div>
                            <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Clinical Session Notes</Text>
                            <Input.TextArea 
                              value={caseNotes} 
                              onChange={e => setCaseNotes(e.target.value)} 
                              placeholder="Describe maternal wellness vitals, health status, and medical suggestions..." 
                              rows={4} 
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
                        /* Read-only notes display */
                        <div>
                          {consult.caseNotes ? (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bcf0da', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                              <Text strong style={{ color: '#14532d', display: 'block', marginBottom: '8px' }}>
                                📋 {isHi ? "सत्र केस नोट्स और सलाह" : "Clinical Session Advice & Notes"}
                              </Text>
                              <Paragraph style={{ fontSize: '13px', color: '#166534', margin: '0 0 12px 0' }}>{consult.caseNotes}</Paragraph>
                              
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

                          {isExpert && (
                            <Button 
                              type="dashed" 
                              onClick={() => startEditNotes(consult)}
                              style={{ marginTop: '12px' }}
                            >
                              ✍️ {consult.caseNotes ? "Edit Session Notes" : "Write Session Notes"}
                            </Button>
                          )}
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
    </Card>
  );
}

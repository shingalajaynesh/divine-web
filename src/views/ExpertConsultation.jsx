import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Tabs, Select, Button, Spin, Tag, Row, Col, Space, Typography, Modal, Avatar } from 'antd';
import { CalendarOutlined, VideoCameraOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons';

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

export default function ExpertConsultation({ t }) {
  const { data: schedulesData, loading: loadingSchedules } = useQuery(GET_EXPERT_SCHEDULES);
  const { data: consultsData, loading: loadingConsults, refetch: refetchConsults } = useQuery(GET_MY_CONSULTATIONS);
  const [bookConsultation, { loading: booking }] = useMutation(BOOK_CONSULTATION);
  const [cancelConsultation, { loading: cancelling }] = useMutation(CANCEL_CONSULTATION);

  const [activeSubTab, setActiveSubTab] = useState('book');
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotTime, setSelectedSlotTime] = useState('');

  const schedules = schedulesData?.getExpertSchedules || [];
  const consults = consultsData?.getMyConsultations || [];

  // Group unique experts from schedules
  const uniqueExperts = [];
  schedules.forEach((s) => {
    if (!uniqueExperts.some((e) => e.id === s.expert.id)) {
      uniqueExperts.push(s.expert);
    }
  });

  // Get schedules for selected expert
  const expertSchedules = schedules.filter((s) => s.expert.id === selectedExpertId);

  // Generate date options for the next 7 days matching the expert's available days
  const getDateOptions = () => {
    const options = [];
    const daysName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();

      const hasSched = expertSchedules.some((s) => s.dayOfWeek === dayOfWeek);
      if (hasSched) {
        options.push({
          dateStr: date.toISOString().split('T')[0],
          label: `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} (${daysName[dayOfWeek]})`,
          dayOfWeek
        });
      }
    }
    return options;
  };

  // Generate slots based on start/end times
  const getSlotOptions = () => {
    if (!selectedDate) return [];
    const dateOpt = getDateOptions().find((o) => o.dateStr === selectedDate);
    if (!dateOpt) return [];

    const daySched = expertSchedules.find((s) => s.dayOfWeek === dateOpt.dayOfWeek);
    if (!daySched) return [];

    const slots = [];
    const [startHour, startMin] = daySched.startTime.split(':').map(Number);
    const [endHour, endMin] = daySched.endTime.split(':').map(Number);

    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    while (current < end) {
      const timeStr = current.toTimeString().substring(0, 5);
      slots.push(timeStr);
      current.setMinutes(current.getMinutes() + daySched.slotDurationMins);
    }
    return slots;
  };

  const handleBook = async () => {
    if (!selectedExpertId || !selectedDate || !selectedSlotTime) {
      toast.error('Please select an expert, date, and slot time.');
      return;
    }

    const slotTimestamp = new Date(`${selectedDate}T${selectedSlotTime}:00`).toISOString();

    try {
      await bookConsultation({
        variables: {
          expertId: selectedExpertId,
          scheduleSlot: slotTimestamp,
        },
      });

      toast.success('Consultation booked successfully!');
      setSelectedDate('');
      setSelectedSlotTime('');
      refetchConsults();
      setActiveSubTab('my-bookings');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (bookingId) => {
    Modal.confirm({
      title: 'Cancel Consultation',
      content: 'Are you sure you want to cancel this consultation booking?',
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const result = await cancelConsultation({
            variables: { bookingId },
          });
          if (result.data.cancelConsultation) {
            toast.success('Appointment cancelled successfully.');
            refetchConsults();
          }
        } catch (err) {
          toast.error(err.message);
        }
      }
    });
  };

  const tabItems = [
    { key: 'book', label: 'Schedule Session' },
    { key: 'my-bookings', label: `My Appointments (${consults.filter((c) => c.status === 'confirmed').length})` }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>👩‍⚕️ Expert 1-on-1 Consulting</Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          Book private calls with dietitians, psychologists, and Garbh Sanskar guides
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
              Select Expert Guide
            </Text>
            {loadingSchedules ? (
              <Spin description="Loading expert list..." style={{ width: '100%', padding: '20px 0' }} />
            ) : uniqueExperts.length === 0 ? (
              <Paragraph type="secondary" style={{ fontStyle: 'italic' }}>No expert schedules configured at this time.</Paragraph>
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
                          <Text type="secondary" style={{ fontSize: '11px' }}>Prenatal Consultant</Text>
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
                Select Date
              </Text>
              <Select
                value={selectedDate}
                onChange={(val) => {
                  setSelectedDate(val);
                  setSelectedSlotTime('');
                }}
                style={{ width: '100%' }}
                placeholder="-- Choose Available Date --"
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
                Available Time Slots
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
              style={{ height: '48px', fontWeight: 'bold', marginTop: '16px' }}
            >
              Confirm Consultation Booking
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
              No confirmed appointments found. Link a time slot on the schedule tab!
            </Paragraph>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {consults.filter((c) => c.status === 'confirmed').map((consult) => (
                <Card key={consult.id} style={{ width: '100%', borderRadius: 16, border: '1px solid #f1f5f9' }} styles={{ body: { padding: '20px' } }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <Space>
                        <Avatar icon={<UserOutlined />} style={{ background: '#ffedd5', color: '#f97316' }} />
                        <div>
                          <Text strong style={{ fontSize: '13px', display: 'block' }}>Session with Guide {consult.expert.displayName}</Text>
                          <Tag color="orange" icon={<CalendarOutlined />} style={{ fontWeight: 'bold', marginTop: '4px' }}>
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
                        Join Video Call
                      </Button>
                      <Button 
                        type="text" 
                        danger
                        onClick={() => handleCancel(consult.id)} 
                        loading={cancelling}
                        icon={<CloseCircleOutlined />}
                        style={{ fontWeight: 'bold' }}
                      >
                        Cancel
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

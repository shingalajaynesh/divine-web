import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_LIVE_CLASSES_DETAILED_QUERY, 
  BOOK_LIVE_CLASS_DETAILED_MUTATION, 
  SUBMIT_LIVE_CLASS_FEEDBACK_MUTATION 
} from '../graphql/operations';
import toast from 'react-hot-toast';
import { Card, Button, Tag, Spin, Typography, Rate, Input, Divider, Space } from 'antd';
import { VideoCameraOutlined, CalendarOutlined, PlayCircleOutlined, StarOutlined, CheckOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function LiveClasses({ user }) {
  const userLang = user?.language || 'en';
  const isHi = userLang === 'hi';

  const { data, loading, refetch } = useQuery(GET_LIVE_CLASSES_DETAILED_QUERY);
  const [bookLiveClass] = useMutation(BOOK_LIVE_CLASS_DETAILED_MUTATION, { onCompleted: () => refetch() });
  const [submitFeedback] = useMutation(SUBMIT_LIVE_CLASS_FEEDBACK_MUTATION, { onCompleted: () => refetch() });

  // Feedback states
  const [activeFeedbackId, setActiveFeedbackId] = useState(null);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const handleBooking = async (liveClassId) => {
    try {
      await bookLiveClass({ variables: { liveClassId } });
      toast.success(isHi ? "कार्यशाला सफलतापूर्वक बुक की गई!" : "Workshop booked successfully!");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleFeedbackSubmit = async (liveClassId) => {
    try {
      await submitFeedback({
        variables: {
          input: {
            liveClassId,
            feedbackScore,
            feedbackNotes
          }
        }
      });
      toast.success(isHi ? "प्रतिक्रिया सबमिट करने के लिए धन्यवाद!" : "Thank you for your feedback!");
      setActiveFeedbackId(null);
      setFeedbackNotes('');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleAddToCalendar = (item) => {
    const startDate = new Date(item.startTime);
    
    // Format to YYYYMMDDTHHMMSSZ
    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const formattedStart = formatICSDate(startDate);
    const endDate = new Date(startDate.getTime() + item.durationMins * 60 * 1000);
    const formattedEnd = formatICSDate(endDate);

    const title = isHi ? item.titleHi : item.titleEn;

    const icsContent = 
      "BEGIN:VCALENDAR\n" +
      "VERSION:2.0\n" +
      "BEGIN:VEVENT\n" +
      `URL:${item.videoCallUrl}\n` +
      `DTSTART:${formattedStart}\n` +
      `DTEND:${formattedEnd}\n` +
      `SUMMARY:${title}\n` +
      `DESCRIPTION:Live Garbh Sanskar session with instructor ${item.instructor}.\n` +
      "END:VEVENT\n" +
      "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isHi ? "कैलेंडर फ़ाइल डाउनलोड की गई" : "Calendar invitation downloaded");
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>
          👩‍⚕️ {isHi ? "इंटरैक्टिव लाइव कक्षाएं और कार्यशालाएं" : "Live Classes & Interactive Workshops"}
        </Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          {isHi 
            ? "योग प्रशिक्षकों, स्त्री रोग विशेषज्ञों और ध्यान प्रशिक्षकों के साथ लाइव सत्र बुक करें।" 
            : "Book sessions with prenatal yoga trainers, gynecologists, and meditation guides."}
        </Paragraph>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin description={isHi ? "कक्षाएं लोड हो रही हैं..." : "Loading live workshops..."} />
        </div>
      ) : data?.getLiveClassesDetailed && data.getLiveClassesDetailed.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.getLiveClassesDetailed.map((item) => {
            const isPast = new Date(item.startTime) < new Date();
            const title = isHi ? item.titleHi : item.titleEn;

            return (
              <Card key={item.id} style={{ width: '100%', borderRadius: 16, border: '1px solid #f1f5f9' }} styles={{ body: { padding: '20px' } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <Space wrap>
                      <Tag color={isPast ? "default" : "orange"} icon={<CalendarOutlined />} style={{ fontWeight: 'bold', padding: '2px 8px' }}>
                        {new Date(item.startTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Tag>
                      {item.booked && <Tag color="green"><CheckOutlined /> {isHi ? "बुक किया गया" : "Booked"}</Tag>}
                      {isPast && <Tag color="blue">{isHi ? "पूर्ण सत्र" : "Completed Session"}</Tag>}
                    </Space>
                    <Title level={5} style={{ margin: '12px 0 4px 0', fontSize: '15px' }}>{title}</Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {isHi ? "प्रशिक्षक" : "Instructor"}: <Text strong>{item.instructor}</Text> ({item.durationMins} mins)
                    </Text>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <Space>
                      {item.booked && !isPast && (
                        <Button 
                          icon={<CalendarOutlined />} 
                          onClick={() => handleAddToCalendar(item)}
                        >
                          {isHi ? "कैलेंडर में जोड़ें" : "Add to Calendar"}
                        </Button>
                      )}

                      {item.replayUrl && (
                        <Button 
                          type="primary" 
                          href={item.replayUrl} 
                          target="_blank" 
                          icon={<PlayCircleOutlined />}
                          style={{ background: '#7c3aed', borderColor: '#7c3aed', fontWeight: 'bold' }}
                        >
                          {isHi ? "रीप्ले देखें" : "Watch Replay"}
                        </Button>
                      )}

                      {item.booked ? (
                        !isPast ? (
                          <Button 
                            type="primary" 
                            href={item.videoCallUrl} 
                            target="_blank" 
                            icon={<VideoCameraOutlined />}
                            style={{ background: '#22c55e', borderColor: '#22c55e', fontWeight: 'bold' }}
                          >
                            {isHi ? "लाइव शामिल हों" : "Join Live Call"}
                          </Button>
                        ) : (
                          !item.feedbackScore && (
                            <Button 
                              type="primary" 
                              onClick={() => {
                                setActiveFeedbackId(activeFeedbackId === item.id ? null : item.id);
                                setFeedbackScore(5);
                              }}
                              icon={<StarOutlined />}
                              style={{ background: '#eab308', borderColor: '#eab308' }}
                            >
                              {isHi ? "फीडबैक दें" : "Give Feedback"}
                            </Button>
                          )
                        )
                      ) : (
                        !isPast && (
                          <Button 
                            type="primary" 
                            onClick={() => handleBooking(item.id)}
                            style={{ fontWeight: 'bold' }}
                          >
                            {isHi ? "सीट बुक करें" : "Book Seat"}
                          </Button>
                        )
                      )}
                    </Space>

                    {item.feedbackScore && (
                      <div style={{ marginTop: '8px', textAlign: 'right' }}>
                        <Rate disabled defaultValue={item.feedbackScore} style={{ fontSize: '12px' }} />
                        {item.feedbackNotes && (
                          <Paragraph style={{ margin: '4px 0 0 0', fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>
                            "{item.feedbackNotes}"
                          </Paragraph>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {activeFeedbackId === item.id && (
                  <div style={{ marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <Divider style={{ margin: '0 0 12px 0' }} />
                    <Title level={5} style={{ fontSize: '12px', margin: '0 0 8px 0' }}>
                      {isHi ? "इस सत्र को रेट करें" : "Rate this Session"}
                    </Title>
                    <Rate value={feedbackScore} onChange={setFeedbackScore} style={{ marginBottom: '12px' }} />
                    <Input.TextArea 
                      value={feedbackNotes} 
                      onChange={e => setFeedbackNotes(e.target.value)} 
                      placeholder={isHi ? "अपनी प्रतिक्रिया यहाँ लिखें..." : "Share what you loved or how we can improve..."}
                      rows={2}
                    />
                    <Space style={{ marginTop: '12px' }}>
                      <Button type="primary" onClick={() => handleFeedbackSubmit(item.id)}>
                        {isHi ? "सबमिट करें" : "Submit"}
                      </Button>
                      <Button onClick={() => setActiveFeedbackId(null)}>
                        {isHi ? "रद्द करें" : "Cancel"}
                      </Button>
                    </Space>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0', margin: 0, fontStyle: 'italic' }}>
          {isHi ? "कोई लाइव कार्यशाला निर्धारित नहीं है।" : "No workshops scheduled. Check back soon."}
        </Paragraph>
      )}
    </Card>
  );
}

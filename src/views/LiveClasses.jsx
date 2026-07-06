import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_LIVE_CLASSES_QUERY, BOOK_LIVE_CLASS_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';
import { Card, Button, Tag, Spin, Typography } from 'antd';
import { VideoCameraOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function LiveClasses() {
  const { data, loading, refetch } = useQuery(GET_LIVE_CLASSES_QUERY);
  const [bookLiveClass] = useMutation(BOOK_LIVE_CLASS_MUTATION, { onCompleted: () => refetch() });

  const handleBooking = async (classId) => {
    try {
      await bookLiveClass({ variables: { classId } });
      toast.success("Workshop booked successfully! See you live.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>👩‍⚕️ Live Classes & Interactive Workshops</Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          Book a session with yoga trainers, gynecologists, and meditation guides
        </Paragraph>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin description="Loading live workshops..." />
        </div>
      ) : data?.getLiveClasses && data.getLiveClasses.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.getLiveClasses.map((item) => (
            <Card key={item.id} style={{ width: '100%', borderRadius: 16, border: '1px solid #f1f5f9' }} styles={{ body: { padding: '20px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <Tag color="orange" icon={<CalendarOutlined />} style={{ fontWeight: 'bold', padding: '2px 8px' }}>
                    {new Date(item.startTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Tag>
                  <Title level={5} style={{ margin: '12px 0 4px 0', fontSize: '15px' }}>{item.title}</Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Instructor: <Text strong>{item.instructor}</Text> ({item.durationMins} mins)
                  </Text>
                </div>

                <div>
                  {item.isBooked ? (
                    <Button 
                      type="primary" 
                      href={item.videoCallUrl} 
                      target="_blank" 
                      icon={<VideoCameraOutlined />}
                      style={{ background: '#22c55e', borderColor: '#22c55e', fontWeight: 'bold' }}
                    >
                      Join Live Call
                    </Button>
                  ) : (
                    <Button 
                      type="primary" 
                      onClick={() => handleBooking(item.id)}
                      style={{ fontWeight: 'bold' }}
                    >
                      Book Seat
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0', margin: 0, fontStyle: 'italic' }}>
          No workshops scheduled. Check back soon.
        </Paragraph>
      )}
    </Card>
  );
}

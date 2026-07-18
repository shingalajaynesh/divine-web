import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Table, Card, Select, Button, Space, Alert, Spin, Tag, Typography, 
  Switch 
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  GET_LIVE_CLASSES_QUERY, 
  GET_CLASS_BOOKINGS_QUERY, 
  RECORD_ATTENDANCE_MUTATION 
} from '../../../graphql/operations';

const { Title, Text } = Typography;

export default function ProgrammeParticipants({ user, lang }) {
  const isHi = lang === 'hi';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role?.roleType);

  const [selectedClassId, setSelectedClassId] = useState(null);

  // 1. Fetch live classes list
  const { data: classData, loading: loadingClasses, error: classError, refetch: refetchClasses } = useQuery(GET_LIVE_CLASSES_QUERY, {
    fetchPolicy: 'network-only'
  });

  // 2. Fetch bookings/participants for selected class
  const { data: bookingData, loading: loadingBookings, error: bookingError, refetch: refetchBookings } = useQuery(GET_CLASS_BOOKINGS_QUERY, {
    variables: { classId: selectedClassId },
    skip: !selectedClassId,
    fetchPolicy: 'network-only'
  });

  // 3. Mark attendance mutation
  const [recordAttendance, { loading: recording }] = useMutation(RECORD_ATTENDANCE_MUTATION, {
    onCompleted: () => {
      refetchBookings();
      toast.success(isHi ? 'उपस्थिति दर्ज की गई।' : 'Attendance recorded successfully.');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleAttendanceToggle = async (userId, currentlyAttended) => {
    if (currentlyAttended && !isAdmin) {
      // Normal staff cannot correct attendance (changing true back to false)
      toast.error('Only administrators can correct attendance logs.');
      return;
    }
    await recordAttendance({
      variables: {
        classId: selectedClassId,
        userId,
        attended: !currentlyAttended
      }
    });
  };

  const classes = classData?.getLiveClassesDetailed || [];
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const bookings = bookingData?.getLiveClassBookings || [];

  const columns = [
    {
      title: 'Member Name',
      dataIndex: ['user', 'displayName'],
      key: 'displayName',
      render: (text) => <span style={{ fontWeight: 500 }}>{text || 'Anonymous'}</span>
    },
    {
      title: 'Email',
      dataIndex: ['user', 'emailAddress'],
      key: 'emailAddress'
    },
    {
      title: 'Mobile',
      dataIndex: ['user', 'mobileNo'],
      key: 'mobileNo',
      render: (text) => text || '-'
    },
    {
      title: 'Attendance',
      dataIndex: 'attended',
      key: 'attended',
      render: (attended, record) => (
        <Space>
          <Switch
            checked={attended}
            onChange={() => handleAttendanceToggle(record.userId, attended)}
            disabled={recording || (!isAdmin && attended)}
            checkedChildren="Present"
            unCheckedChildren="Absent"
          />
          {attended && <Tag color="green">Marked</Tag>}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Programmes & Live Class Attendance"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetchClasses()}>Reload Classes</Button>
        }
        style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        {(classError || bookingError) && (
          <Alert
            message="Unable to load data. Please retry."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Live Class Session:</Text>
          <Select
            placeholder="Choose live class..."
            value={selectedClassId}
            onChange={(val) => setSelectedClassId(val)}
            style={{ width: '100%', maxWidth: '500px' }}
            loading={loadingClasses}
            options={classes.map(c => ({
              value: c.id,
              label: `${c.titleEn || c.title} (${c.instructor}) · ${c.batchName || 'Default Batch'} · ${new Date(c.startTime).toLocaleString()}`
            }))}
          />
        </div>

        {selectedClassId && (
          <div>
            <Divider />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Class Participants Checklist
                </Title>
                {selectedClass && (
                  <Text type="secondary">
                    {selectedClass.seriesTitle || 'Session'} Batch: {selectedClass.batchName} · Duration: {selectedClass.durationMins} mins
                  </Text>
                )}
              </div>
              <Button icon={<ReloadOutlined />} onClick={() => refetchBookings()} loading={loadingBookings}>
                Refresh Booking List
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={bookings}
              rowKey="userId"
              loading={loadingBookings}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'No mothers booked for this class.' }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

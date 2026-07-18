import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Table, Card, Input, Select, Button, Space, Alert, Spin, Tag, Typography, 
  Popconfirm 
} from 'antd';
import { SearchOutlined, ReloadOutlined, CloseCircleOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

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
        emailAddress
        mobileNo
      }
      expert {
        id
        displayName
      }
    }
  }
`;

const CANCEL_CONSULTATION = gql`
  mutation CancelConsultation($bookingId: ID!) {
    cancelConsultation(bookingId: $bookingId)
  }
`;

export default function AppointmentList({ user, lang }) {
  const isHi = lang === 'hi';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 1. Query appointments list
  const { data, loading, error, refetch } = useQuery(GET_MY_CONSULTATIONS, {
    fetchPolicy: 'network-only'
  });

  // 2. Cancel appointment mutation
  const [cancelBooking, { loading: cancelling }] = useMutation(CANCEL_CONSULTATION, {
    onCompleted: () => {
      refetch();
      toast.success(isHi ? 'नियुक्ति सफलतापूर्वक रद्द कर दी गई।' : 'Appointment cancelled successfully.');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleCancel = async (bookingId) => {
    await cancelBooking({ variables: { bookingId } });
  };

  const appointments = data?.getMyConsultations || [];
  
  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const patientName = a.user?.displayName || '';
    const expertName = a.expert?.displayName || '';
    const matchesSearch = !search.trim() || 
      patientName.toLowerCase().includes(search.toLowerCase()) || 
      expertName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      title: 'Patient Mother',
      dataIndex: ['user', 'displayName'],
      key: 'mother',
      render: (text) => <span style={{ fontWeight: 500, color: '#be123c' }}>{text || 'Anonymous'}</span>
    },
    {
      title: 'Consulting Expert',
      dataIndex: ['expert', 'displayName'],
      key: 'expert',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Slot Date & Time',
      dataIndex: 'scheduleSlot',
      key: 'scheduleSlot',
      render: (dateStr) => {
        try {
          return new Date(dateStr).toLocaleString();
        } catch {
          return dateStr || '-';
        }
      }
    },
    {
      title: 'Video Call Link',
      dataIndex: 'videoCallUrl',
      key: 'videoCallUrl',
      render: (url, record) => record.status === 'confirmed' && url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          Join Consultation Room
        </a>
      ) : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = {
          confirmed: 'green',
          completed: 'blue',
          cancelled: 'default'
        }[status] || 'green';
        return <Tag color={color}>{status ? status.toUpperCase() : 'CONFIRMED'}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => record.status === 'confirmed' ? (
        <Popconfirm
          title="Cancel appointment?"
          description="Are you sure you want to cancel this appointment?"
          onConfirm={() => handleCancel(record.id)}
          okText="Yes, cancel"
          cancelText="No"
        >
          <Button 
            type="primary" 
            danger 
            ghost 
            size="small" 
            icon={<CloseCircleOutlined />}
            loading={cancelling}
          >
            Cancel
          </Button>
        </Popconfirm>
      ) : '-'
    }
  ];

  return (
    <div>
      <Card
        title="Appointment & Consultations Directory"
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
            placeholder="Search by mother or expert..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />

          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: '150px' }}
          >
            <Select.Option value="all">All Appointments</Select.Option>
            <Select.Option value="confirmed">Confirmed</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredAppointments}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

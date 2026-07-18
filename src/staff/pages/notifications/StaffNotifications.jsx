import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Card, Table, Button, Space, Tag, Typography, Alert, Spin } from 'antd';
import { ReloadOutlined, CheckOutlined, BellOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  GET_MY_NOTIFICATIONS_QUERY, 
  SET_NOTIFICATION_STATUS_MUTATION, 
  MARK_ALL_NOTIFICATIONS_READ_MUTATION 
} from '../../../graphql/operations';

const { Title, Text, Paragraph } = Typography;

export default function StaffNotifications({ user, lang }) {
  const isHi = lang === 'hi';

  // 1. Fetch user notifications list
  const { data, loading, error, refetch } = useQuery(GET_MY_NOTIFICATIONS_QUERY, {
    variables: { limit: 50, offset: 0 },
    fetchPolicy: 'network-only'
  });

  // 2. Mutations
  const [markRead, { loading: marking }] = useMutation(SET_NOTIFICATION_STATUS_MUTATION, {
    onCompleted: () => {
      refetch();
      toast.success(isHi ? 'सूचना को पढ़ा गया के रूप में चिह्नित किया गया।' : 'Notification marked as read.');
    },
    onError: (err) => toast.error(err.message)
  });

  const [markAllRead, { loading: markingAll }] = useMutation(MARK_ALL_NOTIFICATIONS_READ_MUTATION, {
    onCompleted: () => {
      refetch();
      toast.success(isHi ? 'सभी सूचनाओं को पढ़ा गया के रूप में चिह्नित किया गया।' : 'All notifications marked as read.');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleMarkRead = async (id) => {
    await markRead({ variables: { id, status: 'read' } });
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const notificationsInbox = data?.myNotifications;
  const items = notificationsInbox?.items || [];
  const unreadCount = notificationsInbox?.unreadCount || 0;

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Message Body',
      dataIndex: 'body',
      key: 'body'
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => {
        try {
          return new Date(val).toLocaleString();
        } catch {
          return val || '-';
        }
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'unread' ? 'rose' : 'default'}>
          {status ? status.toUpperCase() : 'READ'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => record.status === 'unread' ? (
        <Button 
          type="link" 
          icon={<CheckOutlined />} 
          onClick={() => handleMarkRead(record.id)}
          loading={marking}
        >
          Mark Read
        </Button>
      ) : null
    }
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <BellOutlined style={{ color: '#be123c' }} />
            <span>Notification Centre ({unreadCount} unread)</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Reload</Button>
            {unreadCount > 0 && (
              <Button type="primary" ghost onClick={handleMarkAllRead} loading={markingAll}>
                Mark All as Read
              </Button>
            )}
          </Space>
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

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Table, Card, Input, Select, Button, Space, Drawer, Form, 
  Descriptions, Alert, Spin, Tag, Typography, Divider, List 
} from 'antd';
import { SearchOutlined, ReloadOutlined, MessageOutlined, ArrowRightOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { GET_INQUIRIES, REPLY_TO_INQUIRY, UPDATE_INQUIRY_STATUS } from '../../../graphql/operations';

const { Title, Text, Paragraph } = Typography;

export default function InquiryList({ user, lang }) {
  const isHi = lang === 'hi';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [updateStatusVal, setUpdateStatusVal] = useState('');

  // 1. Query inquiries paginated
  const { data, loading, error, refetch } = useQuery(GET_INQUIRIES, {
    variables: {
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search.trim() || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize
    },
    fetchPolicy: 'network-only'
  });

  // 2. Mutations
  const [updateInquiryStatus, { loading: updatingStatus }] = useMutation(UPDATE_INQUIRY_STATUS, {
    onCompleted: (res) => {
      refetch().then(updated => {
        const fresh = updated.data?.getInquiries?.items?.find(i => i.id === selectedInquiry?.id);
        if (fresh) setSelectedInquiry(fresh);
      });
      toast.success(isHi ? 'स्थिति सफलतापूर्वक अपडेट की गई।' : 'Inquiry status updated.');
    },
    onError: (err) => toast.error(err.message)
  });

  const [replyToInquiry, { loading: replying }] = useMutation(REPLY_TO_INQUIRY, {
    onCompleted: (res) => {
      refetch().then(updated => {
        const fresh = updated.data?.getInquiries?.items?.find(i => i.id === selectedInquiry?.id);
        if (fresh) setSelectedInquiry(fresh);
      });
      setReplyText('');
      toast.success(isHi ? 'प्रतिक्रिया भेज दी गई है।' : 'Reply sent successfully.');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleOpenDrawer = (record) => {
    setSelectedInquiry(record);
    setUpdateStatusVal(record.status);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedInquiry(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedInquiry) return;
    
    // Status transition validation rules matching backend
    const current = selectedInquiry.status;
    const allowed = {
      pending: ['in_progress', 'closed'],
      in_progress: ['resolved', 'closed'],
      resolved: ['closed'],
      closed: []
    };

    if (current !== newStatus && !allowed[current]?.includes(newStatus)) {
      toast.error(`Invalid status transition from ${current} to ${newStatus}`);
      return;
    }

    await updateInquiryStatus({
      variables: { id: selectedInquiry.id, status: newStatus }
    });
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !selectedInquiry) return;
    await replyToInquiry({
      variables: { id: selectedInquiry.id, content: replyText.trim() }
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = {
          pending: 'orange',
          in_progress: 'blue',
          resolved: 'success',
          closed: 'default'
        }[status] || 'blue';
        return <Tag color={color}>{status ? status.toUpperCase() : 'PENDING'}</Tag>;
      }
    },
    {
      title: 'Submitted At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateStr) => {
        try {
          return new Date(dateStr).toLocaleDateString();
        } catch {
          return dateStr || '-';
        }
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          icon={<MessageOutlined />} 
          onClick={() => handleOpenDrawer(record)}
        >
          Details & Reply
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Inquiry Management"
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
            placeholder="Search inquiries by name/phone/city..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: '300px' }}
          />

          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            style={{ width: '150px' }}
          >
            <Select.Option value="all">All Statuses</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="resolved">Resolved</Select.Option>
            <Select.Option value="closed">Closed</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={data?.getInquiries?.items || []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: data?.getInquiries?.total || 0,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true
          }}
        />
      </Card>

      {/* Inquiry Detail & Reply Drawer */}
      <Drawer
        title={`Inquiry Details: ${selectedInquiry?.name || ''}`}
        width={600}
        onClose={handleCloseDrawer}
        open={drawerOpen}
        destroyOnClose
      >
        {selectedInquiry && (
          <div>
            <Descriptions title="Lead Details" bordered column={1} size="small">
              <Descriptions.Item label="Phone">{selectedInquiry.phone}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedInquiry.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Preferred Call Time">{selectedInquiry.preferredCallTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="Inquiry Message">{selectedInquiry.message || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>Update Status</Title>
              <Select
                value={updateStatusVal}
                onChange={(val) => {
                  setUpdateStatusVal(val);
                  handleStatusChange(val);
                }}
                disabled={updatingStatus}
                style={{ width: 160 }}
              >
                <Select.Option value="pending" disabled={selectedInquiry.status !== 'pending'}>Pending</Select.Option>
                <Select.Option value="in_progress" disabled={!['pending', 'in_progress'].includes(selectedInquiry.status)}>In Progress</Select.Option>
                <Select.Option value="resolved" disabled={!['in_progress', 'resolved'].includes(selectedInquiry.status)}>Resolved</Select.Option>
                <Select.Option value="closed" disabled={selectedInquiry.status === 'closed'}>Closed</Select.Option>
              </Select>
            </div>

            <Divider />

            <Title level={5}>Staff Response History</Title>
            <List
              dataSource={selectedInquiry.responses || []}
              rowKey="id"
              renderItem={(item) => (
                <List.Item>
                  <Card size="small" style={{ width: '100%', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong>{item.author?.displayName || 'Staff'}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </div>
                    <Paragraph style={{ margin: 0 }}>{item.content}</Paragraph>
                  </Card>
                </List.Item>
              )}
              locale={{ emptyText: 'No responses logged yet.' }}
            />

            <Divider />

            {selectedInquiry.status !== 'closed' && (
              <div>
                <Title level={5}>Send Reply Note</Title>
                <Form layout="vertical" onFinish={handleReplySubmit}>
                  <Form.Item label="Message Response" required>
                    <Input.TextArea
                      rows={4}
                      placeholder="Write response email or call note here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={replying}
                      disabled={!replyText.trim()}
                      icon={<ArrowRightOutlined />}
                    >
                      Log Reply & Resolve
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

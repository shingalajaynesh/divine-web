import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Table, Button, Input, Select, Tag, Space, Modal, Form, Typography, Row, Col } from 'antd';
import { SearchOutlined, MessageOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  GET_INQUIRIES,
  REPLY_TO_INQUIRY,
  UPDATE_INQUIRY_STATUS,
} from '../features/inquiries/inquiryOperations';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function StaffConsole({ isHi }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedInqId, setSelectedInqId] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_INQUIRIES, {
    variables: {
      status: null,
      limit: 100,
      offset: 0,
    },
    fetchPolicy: 'network-only',
  });
  const [updateInquiryStatus, { loading: updatingStatus }] = useMutation(UPDATE_INQUIRY_STATUS);
  const [replyToInquiry, { loading: sendingReply }] = useMutation(REPLY_TO_INQUIRY);
  const inquiries = data?.getInquiries?.items || [];

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateInquiryStatus({ variables: { id, status: newStatus } });
      await refetch();
      toast.success(`Ticket status updated to ${newStatus}!`);
    } catch (mutationError) {
      toast.error(mutationError.message);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await replyToInquiry({ variables: { id: selectedInqId, content: replyText.trim() } });
      await refetch();
      setReplyText('');
      setSelectedInqId(null);
      toast.success("Reply recorded and ticket resolved!");
    } catch (mutationError) {
      toast.error(mutationError.message);
    }
  };

  const filtered = inquiries.filter(inq => {
    const matchesStatus = filterStatus === 'all' || inq.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch = inq.name.toLowerCase().includes(query) ||
                          (inq.email || '').toLowerCase().includes(query) ||
                          inq.phone.toLowerCase().includes(query) ||
                          (inq.message || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const selectedInq = inquiries.find(i => i.id === selectedInqId);

  const total = inquiries.length;
  const pending = inquiries.filter(i => i.status === 'pending').length;
  const inProgress = inquiries.filter(i => i.status === 'in_progress').length;
  const resolved = inquiries.filter(i => i.status === 'resolved').length;

  const columns = [
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
        <Space size="small">
          {record.status === 'pending' && (
            <Button 
              size="small" 
              type="default" 
              onClick={() => handleUpdateStatus(record.id, 'in_progress')}
              loading={updatingStatus}
            >
              Start work
            </Button>
          )}
          {record.status !== 'resolved' && (
            <Button 
              size="small" 
              type="primary" 
              onClick={() => setSelectedInqId(record.id)}
            >
              Reply
            </Button>
          )}
          {record.status === 'resolved' && (
            <Tag color="success" style={{ fontWeight: 'bold' }}>Resolved</Tag>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>💼 Staff Inquiry Console</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
            Manage, reply, and resolve client ticket submissions
          </Paragraph>
        </div>

        <Space>
          <Tag color="warning" style={{ padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>Pending: {pending}</Tag>
          <Tag color="processing" style={{ padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>Progress: {inProgress}</Tag>
          <Tag color="success" style={{ padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>Resolved: {resolved}</Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={16}>
          <Input 
            placeholder="Search inquiries (Name, Email, Message)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined />}
            size="large"
          />
        </Col>
        <Col xs={24} sm={8}>
          <Select 
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: '100%' }}
            size="large"
            options={[
              { value: 'all', label: `All Inquiries (${total})` },
              { value: 'pending', label: `Pending (${pending})` },
              { value: 'in_progress', label: `In Progress (${inProgress})` },
              { value: 'resolved', label: `Resolved (${resolved})` }
            ]}
          />
        </Col>
      </Row>

      <Table 
        dataSource={filtered} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        locale={{ emptyText: error ? `Unable to load inquiries: ${error.message}` : 'No inquiries found' }}
        pagination={{ pageSize: 5 }}
        style={{ borderRadius: 16, overflow: 'hidden' }}
        scroll={{ x: 'max-content' }}
      />

      {/* Reply Modal */}
      <Modal
        title={`Respond to ${selectedInq?.name}`}
        open={selectedInqId !== null}
        onCancel={() => setSelectedInqId(null)}
        onOk={handleSendReply}
        confirmLoading={sendingReply}
        okText="Send response & resolve ticket"
        destroyOnClose
      >
        {selectedInq && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginTop: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <Text type="secondary" strong style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Original Message</Text>
              <Text italic style={{ fontSize: '13px', color: '#475569' }}>"{selectedInq.message}"</Text>
            </div>
            
            <Form layout="vertical">
              <Form.Item label={<Text strong style={{ fontSize: '12px' }}>Reply message / Action taken:</Text>} required>
                <TextArea 
                  rows={4} 
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)} 
                  placeholder="Describe responses or medical suggestions..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  );
}

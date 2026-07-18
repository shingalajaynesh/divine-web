import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  Card, Row, Col, List, Tag, Select, Button, Input, Space, Divider, 
  Checkbox, Typography, Alert, Spin, Empty 
} from 'antd';
import { 
  ReloadOutlined, SendOutlined, CustomerServiceOutlined, 
  ClockCircleOutlined, AlertOutlined, MessageOutlined 
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  GET_STAFF_SUPPORT_TICKETS_QUERY,
  GET_CANNED_REPLIES_QUERY,
  ADD_STAFF_SUPPORT_MESSAGE_MUTATION,
  UPDATE_SUPPORT_TICKET_STATUS_MUTATION
} from '../../../graphql/operations';

const { Text, Title, Paragraph } = Typography;

export default function StaffSupportTickets({ user, lang }) {
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendAsInternal, setSendAsInternal] = useState(false);

  // 1. Query staff tickets
  const { data, loading, error, refetch } = useQuery(GET_STAFF_SUPPORT_TICKETS_QUERY, {
    variables: { status: statusFilter },
    fetchPolicy: 'network-only'
  });

  // 2. Query canned replies
  const { data: cannedData } = useQuery(GET_CANNED_REPLIES_QUERY);

  // 3. Mutations
  const [addStaffMessage, { loading: sending }] = useMutation(ADD_STAFF_SUPPORT_MESSAGE_MUTATION, {
    onCompleted: () => {
      refetch();
      setReplyText('');
      setSendAsInternal(false);
      toast.success('Message posted successfully.');
    },
    onError: (err) => toast.error(err.message)
  });

  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_SUPPORT_TICKET_STATUS_MUTATION, {
    onCompleted: () => {
      refetch();
      toast.success('Ticket status updated.');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedTicketId) return;
    const finalMsg = sendAsInternal ? `[INTERNAL] ${replyText.trim()}` : replyText.trim();
    await addStaffMessage({
      variables: { ticketId: selectedTicketId, message: finalMsg }
    });
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedTicketId) return;
    await updateStatus({
      variables: { ticketId: selectedTicketId, status: newStatus }
    });
  };

  const tickets = data?.getStaffSupportTickets || [];
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const cannedReplies = cannedData?.getCannedReplies || [];

  return (
    <div>
      <Card 
        title="Support Desk Control"
        extra={<Button icon={<ReloadOutlined />} onClick={() => refetch()}>Reload Queue</Button>}
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

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: '180px' }}
            placeholder="Filter by Status"
            allowClear
          >
            <Select.Option value="open">Open</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="resolved">Resolved</Select.Option>
            <Select.Option value="closed">Closed</Select.Option>
          </Select>
        </div>

        <Row gutter={[16, 16]}>
          {/* Tickets list panel */}
          <Col xs={24} md={9}>
            <div style={{ maxHeight: '600px', overflowY: 'auto', borderRight: '1px solid #e5e7eb', paddingRight: 8 }}>
              {loading && !data ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}><Spin /></div>
              ) : tickets.length === 0 ? (
                <Empty description="No support tickets in queue." />
              ) : (
                <List
                  dataSource={tickets}
                  rowKey="id"
                  renderItem={(item) => {
                    const isSelected = item.id === selectedTicketId;
                    const isSlaBreached = item.slaBreached || new Date(item.slaExpiresAt) < new Date();
                    return (
                      <List.Item 
                        onClick={() => setSelectedTicketId(item.id)}
                        style={{ 
                          cursor: 'pointer', 
                          padding: '12px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? '#fff1f2' : 'transparent',
                          border: isSelected ? '1px solid #fda4af' : '1px solid transparent',
                          marginBottom: 8,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text strong style={{ fontSize: 13 }}>{item.subject}</Text>
                            <Tag color={isSlaBreached && item.status !== 'resolved' ? 'red' : 'blue'}>
                              {item.status.toUpperCase()}
                            </Tag>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              From: {item.user?.displayName || 'Client'}
                            </Text>
                            {isSlaBreached && item.status !== 'resolved' && (
                              <Tag color="error" icon={<AlertOutlined />} style={{ fontSize: 10 }}>SLA BREACHED</Tag>
                            )}
                          </div>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>
          </Col>

          {/* Details & chat editor */}
          <Col xs={24} md={15}>
            {selectedTicket ? (
              <Card bordered style={{ height: '100%', minHeight: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>{selectedTicket.subject}</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Category: {selectedTicket.category?.toUpperCase()} · Priority: {selectedTicket.priority?.toUpperCase()}
                    </Text>
                  </div>
                  <Select
                    value={selectedTicket.status}
                    onChange={handleStatusUpdate}
                    disabled={updatingStatus}
                    style={{ width: 140 }}
                  >
                    <Select.Option value="open">Open</Select.Option>
                    <Select.Option value="pending">Pending</Select.Option>
                    <Select.Option value="resolved">Resolved</Select.Option>
                    <Select.Option value="closed">Closed</Select.Option>
                  </Select>
                </div>

                <div style={{ height: '300px', overflowY: 'auto', padding: '12px', border: '1px solid #f3f4f6', borderRadius: '6px', marginBottom: 16, backgroundColor: '#f9fafb' }}>
                  <List
                    dataSource={selectedTicket.messages || []}
                    rowKey="id"
                    renderItem={(m) => {
                      const isStaffNote = m.message.startsWith('[INTERNAL]');
                      const displayMsg = isStaffNote ? m.message.replace('[INTERNAL]', '').trim() : m.message;
                      return (
                        <div style={{ 
                          marginBottom: 12, 
                          textAlign: m.senderType === 'user' ? 'left' : 'right' 
                        }}>
                          <div style={{ 
                            display: 'inline-block', 
                            maxWidth: '75%', 
                            padding: '8px 12px', 
                            borderRadius: '8px',
                            backgroundColor: isStaffNote ? '#fef3c7' : (m.senderType === 'user' ? '#fff' : '#be123c'),
                            color: isStaffNote ? '#92400e' : (m.senderType === 'user' ? '#1f2937' : '#fff'),
                            border: isStaffNote ? '1px solid #fde68a' : (m.senderType === 'user' ? '1px solid #e5e7eb' : 'none'),
                            textAlign: 'left'
                          }}>
                            {isStaffNote && <Text strong style={{ fontSize: 10, display: 'block', color: '#b45309' }}>INTERNAL STAFF NOTE</Text>}
                            <Paragraph style={{ margin: 0, fontSize: 13 }}>{displayMsg}</Paragraph>
                            <Text style={{ fontSize: 9, opacity: 0.8, display: 'block', marginTop: 4, textAlign: 'right' }}>
                              {m.sender?.displayName || (m.senderType === 'user' ? 'Customer' : 'Staff')} · {new Date(m.createdAt).toLocaleTimeString()}
                            </Text>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>

                {selectedTicket.status !== 'closed' && (
                  <div>
                    {cannedReplies.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, marginRight: 8 }}>Use Canned Reply:</Text>
                        <Select
                          placeholder="Insert canned reply..."
                          style={{ width: '250px' }}
                          onChange={(val) => setReplyText(val)}
                        >
                          {cannedReplies.map(r => (
                            <Select.Option key={r.id} value={r.content}>{r.title}</Select.Option>
                          ))}
                        </Select>
                      </div>
                    )}

                    <Input.TextArea
                      rows={3}
                      placeholder="Write message reply or staff note..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      style={{ marginBottom: 12 }}
                    />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Checkbox 
                        checked={sendAsInternal} 
                        onChange={(e) => setSendAsInternal(e.target.checked)}
                      >
                        Send as Internal Staff Note (Hidden from Customer)
                      </Checkbox>
                      <Button 
                        type="primary" 
                        icon={<SendOutlined />} 
                        onClick={handleSendMessage}
                        loading={sending}
                        disabled={!replyText.trim()}
                      >
                        Send Note
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card style={{ height: '100%', minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Empty description="Select a ticket from the queue to view details." />
              </Card>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
}

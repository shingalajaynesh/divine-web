import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Form, Input, Button, List, Tag, Typography, Row, Col, Space, Tabs, Rate, Divider, Alert, Select, Progress, Empty, Modal } from 'antd';
import { 
  GET_SUPPORT_TICKETS_QUERY, 
  GET_STAFF_SUPPORT_TICKETS_QUERY,
  GET_CANNED_REPLIES_QUERY,
  GET_SUPPORT_DASHBOARD_METRICS_QUERY,
  CREATE_SUPPORT_TICKET, 
  ADD_SUPPORT_MESSAGE, 
  CLOSE_SUPPORT_TICKET, 
  REQUEST_WHATSAPP_HANDOFF,
  CREATE_CANNED_REPLY_MUTATION,
  ADD_STAFF_SUPPORT_MESSAGE_MUTATION,
  UPDATE_SUPPORT_TICKET_STATUS_MUTATION,
  CHECK_SLA_ESCALATIONS_MUTATION
} from '../graphql/operations';
import { 
  CustomerServiceOutlined, 
  PlusOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  WhatsAppOutlined, 
  SendOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  AlertOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function SupportHub({ user, lang }) {
  const isHi = lang === 'hi';
  const isStaff = ['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role?.roleType);

  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Member Queries
  const { data: memberData, loading: loadingMember, refetch: refetchMember } = useQuery(GET_SUPPORT_TICKETS_QUERY);
  
  // Staff Queries
  const [staffStatusFilter, setStaffStatusFilter] = useState(undefined);
  const { data: staffData, loading: loadingStaff, refetch: refetchStaff } = useQuery(GET_STAFF_SUPPORT_TICKETS_QUERY, {
    variables: { status: staffStatusFilter },
    skip: !isStaff
  });
  const { data: cannedData, refetch: refetchCanned } = useQuery(GET_CANNED_REPLIES_QUERY, { skip: !isStaff });
  const { data: metricsData, refetch: refetchMetrics } = useQuery(GET_SUPPORT_DASHBOARD_METRICS_QUERY, { skip: !isStaff });

  // Mutations
  const [createTicket] = useMutation(CREATE_SUPPORT_TICKET, { onCompleted: () => refetchMember() });
  const [addMessage] = useMutation(ADD_SUPPORT_MESSAGE, {
    onCompleted: (res) => {
      refetchMember().then(updated => {
        if (selectedTicket) {
          const fresh = updated.data?.getSupportTickets?.find(t => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      });
    }
  });
  const [closeTicket] = useMutation(CLOSE_SUPPORT_TICKET, {
    onCompleted: (res) => {
      refetchMember().then(updated => {
        const fresh = updated.data?.getSupportTickets?.find(t => t.id === selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
      });
    }
  });
  const [requestHandoff] = useMutation(REQUEST_WHATSAPP_HANDOFF, {
    onCompleted: (res) => {
      refetchMember().then(updated => {
        const fresh = updated.data?.getSupportTickets?.find(t => t.id === selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
      });
    }
  });

  // Staff mutations
  const [createCannedReply] = useMutation(CREATE_CANNED_REPLY_MUTATION, { onCompleted: () => refetchCanned() });
  const [addStaffMessage] = useMutation(ADD_STAFF_SUPPORT_MESSAGE_MUTATION, {
    onCompleted: () => {
      refetchStaff().then(updated => {
        if (selectedTicket) {
          const fresh = updated.data?.getStaffSupportTickets?.find(t => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      });
    }
  });
  const [updateSupportTicketStatus] = useMutation(UPDATE_SUPPORT_TICKET_STATUS_MUTATION, {
    onCompleted: () => {
      refetchStaff().then(updated => {
        if (selectedTicket) {
          const fresh = updated.data?.getStaffSupportTickets?.find(t => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      });
      refetchMetrics();
      toast.success('Ticket status updated.');
    }
  });
  const [checkSlaEscalations] = useMutation(CHECK_SLA_ESCALATIONS_MUTATION, {
    onCompleted: () => {
      refetchStaff();
      refetchMetrics();
      toast.success('SLA Escalations checked.');
    }
  });

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [replyText, setReplyText] = useState('');

  // Staff Form states
  const [staffReplyText, setStaffReplyText] = useState('');
  const [cannedReplyTitle, setCannedReplyTitle] = useState('');
  const [cannedReplyContent, setCannedReplyContent] = useState('');
  const [cannedReplyCategory, setCannedReplyCategory] = useState('general');
  const [isCannedModalOpen, setIsCannedModalOpen] = useState(false);

  // CSAT rating states
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');

  const tickets = memberData?.getSupportTickets || [];
  const staffTickets = staffData?.getStaffSupportTickets || [];
  const cannedReplies = cannedData?.getCannedReplies || [];
  const metrics = metricsData?.getSupportDashboardMetrics;

  const handleCreateTicket = async () => {
    if (!subject || !description) return;
    try {
      await createTicket({
        variables: {
          input: { subject, description, priority, category }
        }
      });
      toast.success(isHi ? 'टिकट सफलतापूर्वक बनाया गया!' : 'Support ticket raised successfully!');
      setSubject('');
      setDescription('');
      setActiveTab('tickets');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSendReply = async () => {
    if (!replyText || !selectedTicket) return;
    try {
      await addMessage({
        variables: {
          input: { ticketId: selectedTicket.id, message: replyText }
        }
      });
      setReplyText('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSendStaffReply = async () => {
    if (!staffReplyText || !selectedTicket) return;
    try {
      await addStaffMessage({
        variables: {
          ticketId: selectedTicket.id,
          message: staffReplyText
        }
      });
      setStaffReplyText('');
      toast.success('Reply submitted.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateCannedReply = async () => {
    if (!cannedReplyTitle || !cannedReplyContent) return;
    try {
      await createCannedReply({
        variables: {
          title: cannedReplyTitle,
          content: cannedReplyContent,
          category: cannedReplyCategory
        }
      });
      toast.success('Canned reply template added.');
      setCannedReplyTitle('');
      setCannedReplyContent('');
      setIsCannedModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await closeTicket({
        variables: {
          input: {
            ticketId: selectedTicket.id,
            satisfactionScore: ratingValue,
            satisfactionFeedback: ratingFeedback
          }
        }
      });
      toast.success(isHi ? 'टिकट बंद कर दिया गया है।' : 'Ticket marked as resolved.');
      setRatingFeedback('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleWhatsAppHandoff = async () => {
    if (!selectedTicket) return;
    try {
      await requestHandoff({ variables: { id: selectedTicket.id } });
      const text = `Hello Divine team, I need live agent help with support ticket #${selectedTicket.id}. Subject: ${selectedTicket.subject}`;
      const url = `https://wa.me/919638484545?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getSlaTimeRemaining = (expiryStr) => {
    const diff = new Date(expiryStr) - new Date();
    if (diff <= 0) return isHi ? 'SLA समय समाप्त' : 'SLA Target Breached';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return isHi ? `${hours} घंटे ${mins} मिनट शेष` : `${hours}h ${mins}m target remaining`;
  };

  const handleSelectCanned = (val) => {
    const matched = cannedReplies.find(c => c.id === val);
    if (matched) {
      setStaffReplyText(matched.content);
    }
  };

  const tabItems = [
    { key: 'tickets', label: isHi ? 'मेरे टिकट' : 'My Support Tickets' },
    { key: 'new', label: <span><PlusOutlined /> {isHi ? 'नया टिकट बनाएं' : 'Raise New Ticket'}</span> }
  ];

  if (isStaff) {
    tabItems.push(
      { key: 'console', label: <span><DatabaseOutlined /> Support Desk Console</span> },
      { key: 'metrics', label: <span><DashboardOutlined /> CSAT & SLA Metrics</span> }
    );
  }

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>📞 {isHi ? "सहायता केंद्र" : "Help & Support Hub"}</Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          {isHi 
            ? "हमारे सहायता विशेषज्ञों से जुड़ें, टिकट बनाएं और लाइव चैट करें।" 
            : "Connect with our pregnancy experts and support staff to resolve issues."}
        </Paragraph>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={(k) => { setActiveTab(k); setSelectedTicket(null); }}
        items={tabItems}
        style={{ marginBottom: '24px' }}
      />

      {/* RAISE NEW TICKET */}
      {activeTab === 'new' && (
        <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0' }} styles={{ body: { padding: '24px' } }}>
          <Form layout="vertical" onFinish={handleCreateTicket}>
            <Form.Item required label={<Text strong style={{ fontSize: '12px' }}>Ticket Subject / Topic</Text>}>
              <Input 
                placeholder="e.g. Diet Plan query, App crash, Medical checklist help..." 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                size="large"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={<Text strong style={{ fontSize: '12px' }}>Category</Text>}>
                  <Select value={category} onChange={setCategory} size="large">
                    <Select.Option value="general">General Guidance</Select.Option>
                    <Select.Option value="technical">Technical Issue</Select.Option>
                    <Select.Option value="diet">Diet & Nutrition</Select.Option>
                    <Select.Option value="obstetric">Obstetrician Consultation</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<Text strong style={{ fontSize: '12px' }}>Priority Level</Text>}>
                  <Select value={priority} onChange={setPriority} size="large">
                    <Select.Option value="low">Low (Resolve in 24h)</Select.Option>
                    <Select.Option value="medium">Medium (Resolve in 12h)</Select.Option>
                    <Select.Option value="high">High (Urgent - Resolve in 4h)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item required label={<Text strong style={{ fontSize: '12px' }}>Detailed Query Description</Text>}>
              <TextArea 
                placeholder="Describe your issue or medical question in detail so our team can assist you better..." 
                rows={4} 
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </Form.Item>

            <Button type="primary" block style={{ background: '#be123c', borderColor: '#be123c', height: '48px', fontWeight: 'bold' }} onClick={handleCreateTicket}>
              Submit Support Ticket
            </Button>
          </Form>
        </Card>
      )}

      {/* MEMBER TICKETS VIEW */}
      {activeTab === 'tickets' && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card title={isHi ? "टिकट सूची" : "Support Tickets"} style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}>
              {tickets.length === 0 ? (
                <Empty description={isHi ? "कोई टिकट नहीं मिला।" : "No support tickets raised yet."} />
              ) : (
                <List
                  dataSource={tickets}
                  loading={loadingMember}
                  renderItem={ticket => (
                    <List.Item 
                      style={{ cursor: 'pointer', background: selectedTicket?.id === ticket.id ? '#fff5f5' : 'transparent', padding: '12px 16px', borderRadius: '12px', marginBottom: '8px' }}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <List.Item.Meta
                        title={<strong>{ticket.subject}</strong>}
                        description={
                          <div style={{ marginTop: '4px' }}>
                            <Space wrap>
                              <Tag color={ticket.status === 'resolved' ? 'green' : 'orange'}>{ticket.status.toUpperCase()}</Tag>
                              <Tag color="blue">{ticket.category}</Tag>
                              <Tag color="red">{ticket.priority.toUpperCase()}</Tag>
                            </Space>
                            <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginTop: '6px' }}>
                              SLA: {getSlaTimeRemaining(ticket.slaExpiresAt)}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} md={14}>
            {selectedTicket ? (
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{selectedTicket.subject}</span>
                    <Tag color="magenta">#{selectedTicket.id.substring(0, 8)}</Tag>
                  </div>
                }
                style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}
              >
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '16px', marginBottom: '16px' }}>
                  {selectedTicket.messages.map(msg => {
                    const isSelf = msg.senderType === 'user';
                    return (
                      <div 
                        key={msg.id}
                        style={{
                          alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          background: isSelf ? '#be123c' : '#ffffff',
                          color: isSelf ? '#ffffff' : '#1e293b',
                          padding: '10px 16px',
                          borderRadius: '16px',
                          maxWidth: '80%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          border: isSelf ? 'none' : '1px solid #e2e8f0'
                        }}
                      >
                        <Text strong style={{ fontSize: '10px', display: 'block', color: isSelf ? '#ffe4e6' : '#64748b', marginBottom: '4px' }}>
                          {isSelf ? 'You' : (msg.sender?.displayName || 'Support Agent')}
                        </Text>
                        <Text style={{ color: isSelf ? '#ffffff' : '#334155', fontSize: '12px' }}>{msg.message}</Text>
                        <Text style={{ fontSize: '8px', color: isSelf ? '#fda4af' : '#94a3b8', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </Text>
                      </div>
                    );
                  })}
                </div>

                {selectedTicket.status !== 'resolved' ? (
                  <div>
                    <Alert
                      message={isHi ? "लाइव चैट सहायता" : "Instant WhatsApp Support Handoff"}
                      description={isHi ? "व्हाट्सएप पर तत्काल प्रतिक्रिया के लिए हमारे लाइव एजेंट से संपर्क करें।" : "Move this support conversation to WhatsApp instantly for faster resolution and push updates."}
                      type="info"
                      showIcon
                      action={
                        <Button size="small" type="primary" onClick={handleWhatsAppHandoff} style={{ background: '#25D366', borderColor: '#25D366' }} icon={<WhatsAppOutlined />}>
                          WhatsApp
                        </Button>
                      }
                      style={{ marginBottom: '16px', borderRadius: '12px' }}
                    />

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <Input 
                        placeholder={isHi ? "जवाब लिखें..." : "Type your reply..."} 
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onPressEnter={handleSendReply}
                      />
                      <Button type="primary" onClick={handleSendReply} style={{ background: '#be123c', borderColor: '#be123c' }} icon={<SendOutlined />} />
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div style={{ background: '#fcfcfc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                      <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Rate & Close Support Ticket</Text>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Rate value={ratingValue} onChange={setRatingValue} />
                        <Input 
                          placeholder="Leave feedback comments (optional)" 
                          value={ratingFeedback} 
                          onChange={e => setRatingFeedback(e.target.value)} 
                        />
                        <Button type="dashed" danger onClick={handleCloseTicket} block icon={<CheckCircleOutlined />}>
                          Mark Ticket as Resolved
                        </Button>
                      </Space>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <CheckCircleOutlined style={{ fontSize: '28px', color: '#16a34a', marginBottom: '8px' }} />
                    <Title level={5}>Ticket Resolved</Title>
                    <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                      Thank you! You rated this support resolution:
                    </Paragraph>
                    <Rate disabled value={selectedTicket.satisfactionScore || 5} />
                    {selectedTicket.satisfactionFeedback && (
                      <Paragraph style={{ fontStyle: 'italic', marginTop: '8px', background: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
                        "{selectedTicket.satisfactionFeedback}"
                      </Paragraph>
                    )}
                  </div>
                )}
              </Card>
            ) : (
              <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <div style={{ textAlign: 'center' }}>
                  <CustomerServiceOutlined style={{ fontSize: '32px', color: '#be123c', marginBottom: '12px' }} />
                  <Title level={5}>No Ticket Selected</Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    Select a ticket from the left panel to review message logs or reply.
                  </Paragraph>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      )}

      {/* STAFF SUPPORT DESK CONSOLE */}
      {isStaff && activeTab === 'console' && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card title="Active Queue" style={{ borderRadius: 20 }} extra={
              <Space>
                <Select value={staffStatusFilter} onChange={setStaffStatusFilter} style={{ width: 120 }}>
                  <Select.Option value={undefined}>All Statuses</Select.Option>
                  <Select.Option value="open">Open</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="resolved">Resolved</Select.Option>
                </Select>
                <Button size="small" type="primary" onClick={() => checkSlaEscalations()} icon={<AlertOutlined />}>Check SLA</Button>
              </Space>
            }>
              {staffTickets.length === 0 ? (
                <Empty description="No tickets in queue." />
              ) : (
                <List
                  dataSource={staffTickets}
                  loading={loadingStaff}
                  renderItem={ticket => {
                    const isOverdue = new Date(ticket.slaExpiresAt) < new Date() && ticket.status !== 'resolved';
                    return (
                      <List.Item 
                        style={{ cursor: 'pointer', background: selectedTicket?.id === ticket.id ? '#fff5f5' : 'transparent', padding: '12px 16px', borderRadius: '12px', marginBottom: '8px' }}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <List.Item.Meta
                          title={<span><strong>{ticket.subject}</strong> <Text type="secondary" style={{ fontSize: '11px' }}>({ticket.user?.displayName || 'Mother'})</Text></span>}
                          description={
                            <div style={{ marginTop: '4px' }}>
                              <Space wrap>
                                <Tag color={ticket.status === 'resolved' ? 'green' : 'orange'}>{ticket.status.toUpperCase()}</Tag>
                                <Tag color={isOverdue ? 'red' : 'blue'}>{ticket.priority.toUpperCase()}</Tag>
                                {ticket.slaBreached && <Tag color="error">SLA BREACHED</Tag>}
                              </Space>
                              <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginTop: '6px' }}>
                                SLA Expires: {new Date(ticket.slaExpiresAt).toLocaleString()}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} md={14}>
            {selectedTicket ? (
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{selectedTicket.subject}</span>
                    <Space>
                      <Select 
                        value={selectedTicket.status} 
                        onChange={(status) => updateSupportTicketStatus({ variables: { ticketId: selectedTicket.id, status } })}
                        style={{ width: 110 }}
                      >
                        <Select.Option value="open">Open</Select.Option>
                        <Select.Option value="pending">Pending</Select.Option>
                        <Select.Option value="resolved">Resolved</Select.Option>
                        <Select.Option value="closed">Closed</Select.Option>
                      </Select>
                      <Tag color="magenta">#{selectedTicket.id.substring(0, 8)}</Tag>
                    </Space>
                  </div>
                }
                style={{ borderRadius: 20 }}
              >
                {/* Chat bubble logs */}
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '16px', marginBottom: '16px' }}>
                  {selectedTicket.messages.map(msg => {
                    const isAgent = msg.senderType === 'staff';
                    return (
                      <div 
                        key={msg.id}
                        style={{
                          alignSelf: isAgent ? 'flex-end' : 'flex-start',
                          background: isAgent ? '#be123c' : '#ffffff',
                          color: isAgent ? '#ffffff' : '#1e293b',
                          padding: '10px 16px',
                          borderRadius: '16px',
                          maxWidth: '80%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          border: isAgent ? 'none' : '1px solid #e2e8f0'
                        }}
                      >
                        <Text strong style={{ fontSize: '10px', display: 'block', color: isAgent ? '#ffe4e6' : '#64748b', marginBottom: '4px' }}>
                          {isAgent ? 'Support Agent (Staff)' : (msg.sender?.displayName || 'Mother')}
                        </Text>
                        <Text style={{ color: isAgent ? '#ffffff' : '#334155', fontSize: '12px' }}>{msg.message}</Text>
                        <Text style={{ fontSize: '8px', color: isAgent ? '#fda4af' : '#94a3b8', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </Text>
                      </div>
                    );
                  })}
                </div>

                {/* Reply section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Canned replies selection dropdown */}
                  <div>
                    <Text strong style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      ⚡ Select Canned Reply template:
                    </Text>
                    <Select 
                      placeholder="Search common answers..." 
                      onChange={handleSelectCanned} 
                      style={{ width: '100%' }}
                      showSearch
                      optionFilterProp="children"
                    >
                      {cannedReplies.map(c => (
                        <Select.Option key={c.id} value={c.id}>{c.title}</Select.Option>
                      ))}
                    </Select>
                  </div>

                  <TextArea 
                    placeholder="Type your response to the mother..." 
                    rows={3} 
                    value={staffReplyText}
                    onChange={e => setStaffReplyText(e.target.value)}
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button onClick={() => setIsCannedModalOpen(true)} icon={<PlusOutlined />} size="small">
                      Add New Template
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={handleSendStaffReply} 
                      style={{ background: '#be123c', borderColor: '#be123c' }} 
                      icon={<SendOutlined />}
                    >
                      Send Message
                    </Button>
                  </div>

                </div>
              </Card>
            ) : (
              <Card style={{ borderRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <div style={{ textAlign: 'center' }}>
                  <MessageOutlined style={{ fontSize: '32px', color: '#be123c', marginBottom: '12px' }} />
                  <Title level={5}>No Ticket Selected</Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    Select a ticket from the left panel to review message logs or reply.
                  </Paragraph>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      )}

      {/* STAFF CSAT & SLA METRICS DASHBOARD */}
      {isStaff && activeTab === 'metrics' && metrics && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card style={{ borderRadius: 16, background: '#f8fafc' }}>
                <Progress type="circle" percent={metrics.totalTicketsCount > 0 ? Math.round((metrics.resolvedTicketsCount / metrics.totalTicketsCount) * 100) : 0} width={80} strokeColor="#be123c" />
                <div style={{ marginTop: '12px' }}>
                  <Text strong style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>RESOLUTION RATE</Text>
                  <Title level={4} style={{ margin: 0 }}>{metrics.resolvedTicketsCount} / {metrics.totalTicketsCount}</Title>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ borderRadius: 16, background: '#f8fafc' }}>
                <div style={{ height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Rate disabled allowHalf value={metrics.averageSatisfactionScore || 5.0} style={{ fontSize: '18px' }} />
                </div>
                <div style={{ marginTop: '12px' }}>
                  <Text strong style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>CSAT RATING AVERAGE</Text>
                  <Title level={4} style={{ margin: 0 }}>{metrics.averageSatisfactionScore ? metrics.averageSatisfactionScore.toFixed(1) : 'N/A'} Stars</Title>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ borderRadius: 16, background: '#f8fafc' }}>
                <Progress type="circle" percent={metrics.totalTicketsCount > 0 ? Math.round((metrics.slaBreachedCount / metrics.totalTicketsCount) * 100) : 0} width={80} status="exception" />
                <div style={{ marginTop: '12px' }}>
                  <Text strong style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>SLA BREACH RATE</Text>
                  <Title level={4} style={{ margin: 0 }}>{metrics.slaBreachedCount} Breached</Title>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ borderRadius: 16, background: '#f8fafc' }}>
                <div style={{ height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Title level={2} style={{ color: '#f59e0b', margin: 0 }}>{metrics.pendingTicketsCount}</Title>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <Text strong style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>ACTIVE BACKLOG</Text>
                  <Title level={4} style={{ margin: 0 }}>{metrics.pendingTicketsCount} Pending</Title>
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="CSAT Satisfaction Distribution" style={{ borderRadius: 20 }}>
            {metrics.satisfactionDistribution.map(dist => (
              <Row key={dist.score} align="middle" style={{ marginBottom: '8px' }}>
                <Col span={3}>
                  <Text>{dist.score} Star</Text>
                </Col>
                <Col span={18}>
                  <Progress percent={metrics.totalTicketsCount > 0 ? Math.round((dist.count / metrics.totalTicketsCount) * 100) : 0} strokeColor="#22c55e" showInfo={false} />
                </Col>
                <Col span={3} style={{ textAlign: 'right' }}>
                  <Text strong>{dist.count} tickets</Text>
                </Col>
              </Row>
            ))}
          </Card>
        </div>
      )}

      {/* CREATE CANNED REPLY MODAL */}
      <Modal
        title="Add Canned Reply Template"
        open={isCannedModalOpen}
        onCancel={() => setIsCannedModalOpen(false)}
        onOk={handleCreateCannedReply}
        okButtonProps={{ style: { background: '#be123c', borderColor: '#be123c' } }}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Template Title *" required>
            <Input 
              placeholder="e.g. Diet Plan Query answer" 
              value={cannedReplyTitle} 
              onChange={e => setCannedReplyTitle(e.target.value)} 
            />
          </Form.Item>
          <Form.Item label="Category">
            <Select value={cannedReplyCategory} onChange={setCannedReplyCategory}>
              <Select.Option value="general">General Guidance</Select.Option>
              <Select.Option value="technical">Technical troubleshooting</Select.Option>
              <Select.Option value="diet">Diet planner support</Select.Option>
              <Select.Option value="medical">Medical Red Flags warning</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Canned Content *" required>
            <TextArea 
              placeholder="Write the full response message here..." 
              value={cannedReplyContent} 
              onChange={e => setCannedReplyContent(e.target.value)} 
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

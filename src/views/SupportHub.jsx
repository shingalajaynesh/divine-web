import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Form, Input, Button, List, Tag, Typography, Row, Col, Space, Tabs, Rate, Divider, Alert, Select } from 'antd';
import { 
  GET_SUPPORT_TICKETS_QUERY, 
  CREATE_SUPPORT_TICKET, 
  ADD_SUPPORT_MESSAGE, 
  CLOSE_SUPPORT_TICKET, 
  REQUEST_WHATSAPP_HANDOFF 
} from '../graphql/operations';
import { 
  CustomerServiceOutlined, 
  PlusOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  WhatsAppOutlined, 
  LockOutlined, 
  SendOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function SupportHub({ user, lang }) {
  const isHi = lang === 'hi';

  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Queries & Mutations
  const { data, loading, refetch } = useQuery(GET_SUPPORT_TICKETS_QUERY);
  const [createTicket] = useMutation(CREATE_SUPPORT_TICKET, { onCompleted: () => refetch() });
  const [addMessage] = useMutation(ADD_SUPPORT_MESSAGE, {
    onCompleted: (res) => {
      refetch().then(updated => {
        if (selectedTicket) {
          const fresh = updated.data?.getSupportTickets?.find(t => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      });
    }
  });
  const [closeTicket] = useMutation(CLOSE_SUPPORT_TICKET, {
    onCompleted: (res) => {
      refetch().then(updated => {
        const fresh = updated.data?.getSupportTickets?.find(t => t.id === selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
      });
    }
  });
  const [requestHandoff] = useMutation(REQUEST_WHATSAPP_HANDOFF, {
    onCompleted: (res) => {
      refetch().then(updated => {
        const fresh = updated.data?.getSupportTickets?.find(t => t.id === selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
      });
    }
  });

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [replyText, setReplyText] = useState('');

  // CSAT rating states
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');

  const tickets = data?.getSupportTickets || [];

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
        items={[
          { key: 'tickets', label: isHi ? 'मेरे टिकट' : 'My Support Tickets' },
          { key: 'new', label: <span><PlusOutlined /> {isHi ? 'नया टिकट बनाएं' : 'Raise New Ticket'}</span> }
        ]}
        style={{ marginBottom: '24px' }}
      />

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

            <Button type="primary" htmlType="submit" block style={{ background: '#be123c', borderColor: '#be123c', height: '48px', fontWeight: 'bold' }}>
              Submit Support Ticket
            </Button>
          </Form>
        </Card>
      )}

      {activeTab === 'tickets' && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card title={isHi ? "टिकट सूची" : "Support Tickets"} style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}>
              {tickets.length === 0 ? (
                <Paragraph type="secondary" style={{ fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
                  No support tickets raised yet.
                </Paragraph>
              ) : (
                <List
                  dataSource={tickets}
                  loading={loading}
                  renderItem={ticket => {
                    const isOpen = ticket.status === 'open';
                    return (
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
                    <Tag color="magenta">#{selectedTicket.id.substring(0, 8)}</Tag>
                  </div>
                }
                style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}
              >
                {/* Chat Message dialog */}
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
                    {/* Live Handoff alert info */}
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

                    {/* Chat inputs */}
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

                    {/* Resolution Form */}
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
                    <Title level={5} style={{ margin: 0 }}>Ticket Resolved</Title>
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
    </Card>
  );
}

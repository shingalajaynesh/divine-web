import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { Form, Input, Button, List, Tag, Typography, Row, Col, Space, Divider, Alert, Empty } from 'antd';
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
  SendOutlined,
  MessageOutlined
} from '@ant-design/icons';
import {
  EnterpriseCard,
  EnterprisePageHeader,
  EnterpriseLoading,
  EnterpriseEmptyState,
  EnterpriseErrorState,
  getRoleTheme
} from '../shared/components';
import { enterpriseTokens } from '../shared/theme/enterpriseTokens';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function SupportHub({ lang = 'en' }) {
  const isHi = lang === 'hi';
  const theme = getRoleTheme('MOTHER');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  // Customer Queries
  const { data, loading, error, refetch } = useQuery(GET_SUPPORT_TICKETS_QUERY);

  // Mutations
  const [createTicket, { loading: creating }] = useMutation(CREATE_SUPPORT_TICKET, { onCompleted: () => refetch() });
  const [addMessage, { loading: sendingMsg }] = useMutation(ADD_SUPPORT_MESSAGE, {
    onCompleted: (res) => {
      refetch().then(updated => {
        if (selectedTicket) {
          const fresh = updated.data?.getSupportTickets?.find(t => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      });
      setChatMessage('');
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

  const tickets = data?.getSupportTickets || [];

  const handleCreateTicket = async () => {
    if (!newTicketSubject || !newTicketDesc) {
      toast.error(isHi ? "कृपया विषय और विवरण दर्ज करें।" : "Please enter subject and description.");
      return;
    }
    try {
      await createTicket({
        variables: {
          subject: newTicketSubject,
          description: newTicketDesc
        }
      });
      setNewTicketSubject('');
      setNewTicketDesc('');
      toast.success(isHi ? "टिकट सफलतापूर्वक बनाया गया!" : "Support ticket created successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      await addMessage({
        variables: {
          ticketId: selectedTicket.id,
          message: chatMessage
        }
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <EnterpriseLoading type="card" count={2} />;
  if (error) return <EnterpriseErrorState error={error} activeRole="MOTHER" />;

  return (
    <div>
      <EnterprisePageHeader
        activeRole="MOTHER"
        kicker="HELP & DESK"
        title="Help & Customer Support"
        subtitle="Submit tickets, review conversations or request immediate WhatsApp help with our support guides."
      />

      <Row gutter={[24, 24]}>
        {/* Left Side: Create & List Tickets */}
        <Col xs={24} md={10}>
          <EnterpriseCard activeRole="MOTHER" title={isHi ? "नया सहायता टिकट खोलें" : "Create Support Ticket"} hoverable={false} style={{ marginBottom: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong style={{ fontSize: '12px' }}>Subject:</Text>
                <Input 
                  value={newTicketSubject} 
                  onChange={(e) => setNewTicketSubject(e.target.value)} 
                  placeholder="e.g. Video playback buffering error" 
                />
              </div>
              <div>
                <Text strong style={{ fontSize: '12px' }}>Describe your issue:</Text>
                <TextArea 
                  rows={4} 
                  value={newTicketDesc} 
                  onChange={(e) => setNewTicketDesc(e.target.value)} 
                  placeholder="Please provide details so our guides can resolve it." 
                />
              </div>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                loading={creating} 
                onClick={handleCreateTicket} 
                block
                style={{ borderRadius: '8px', fontWeight: 'bold' }}
              >
                Submit Ticket
              </Button>
            </Space>
          </EnterpriseCard>

          <EnterpriseCard activeRole="MOTHER" title={isHi ? "मेरे सक्रिय टिकट" : "My Support Tickets"} hoverable={false}>
            {tickets.length > 0 ? (
              <List
                dataSource={tickets}
                renderItem={ticket => (
                  <List.Item
                    onClick={() => setSelectedTicket(ticket)}
                    style={{
                      cursor: 'pointer',
                      background: selectedTicket?.id === ticket.id ? '#fff5f5' : 'transparent',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      border: selectedTicket?.id === ticket.id ? `1px solid ${theme.borderColor}` : '1px solid transparent'
                    }}
                  >
                    <List.Item.Meta
                      title={<strong>{ticket.subject}</strong>}
                      description={
                        <Space>
                          <Tag color={ticket.status === 'open' ? 'orange' : 'green'}>{ticket.status}</Tag>
                          <span style={{ fontSize: '11px' }}>
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <EnterpriseEmptyState title="No active tickets" description="If you experience issues, create a ticket above." />
            )}
          </EnterpriseCard>
        </Col>

        {/* Right Side: Conversation Panel */}
        <Col xs={24} md={14}>
          {selectedTicket ? (
            <EnterpriseCard 
              activeRole="MOTHER" 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{selectedTicket.subject}</span>
                  <Space>
                    {selectedTicket.status !== 'closed' && (
                      <Button
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={async () => {
                          try {
                            await closeTicket({ variables: { id: selectedTicket.id } });
                            toast.success("Ticket closed.");
                          } catch (e) {
                            toast.error(e.message);
                          }
                        }}
                      >
                        Close Ticket
                      </Button>
                    )}
                    <Button
                      size="small"
                      type="primary"
                      icon={<WhatsAppOutlined />}
                      style={{ backgroundColor: '#25d366', borderColor: '#25d366' }}
                      onClick={async () => {
                        try {
                          await requestHandoff({ variables: { ticketId: selectedTicket.id } });
                          toast.success("WhatsApp help requested!");
                        } catch (e) {
                          toast.error(e.message);
                        }
                      }}
                    >
                      WhatsApp Help
                    </Button>
                  </Space>
                </div>
              }
              hoverable={false}
            >
              {/* Chat messages viewport */}
              <div style={{ height: '320px', overflowY: 'auto', padding: '12px', background: '#fafafa', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>System Intake Message:</Text>
                  <Paragraph style={{ padding: '8px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '4px 0 0 0' }}>
                    {selectedTicket.description}
                  </Paragraph>
                </div>

                {selectedTicket.messages && selectedTicket.messages.map((msg, idx) => {
                  const isStaffMsg = msg.senderRole !== 'MOTHER';
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: isStaffMsg ? 'flex-start' : 'flex-end',
                        marginBottom: '12px'
                      }}
                    >
                      <span style={{ fontSize: '10px', color: theme.textSecondary, marginBottom: '2px' }}>
                        {isStaffMsg ? (isHi ? "सपोर्ट टीम" : "Support Agent") : (isHi ? "आप" : "You")} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div 
                        style={{ 
                          padding: '8px 12px', 
                          borderRadius: '12px', 
                          background: isStaffMsg ? '#fff' : '#be123c', 
                          color: isStaffMsg ? '#24191a' : '#fff',
                          border: isStaffMsg ? '1px solid #e2e8f0' : 'none',
                          maxWidth: '80%'
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTicket.status !== 'closed' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input 
                    value={chatMessage} 
                    onChange={(e) => setChatMessage(e.target.value)} 
                    onPressEnter={handleSendMessage}
                    placeholder="Type your message reply..." 
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />} 
                    loading={sendingMsg} 
                    onClick={handleSendMessage}
                  />
                </div>
              ) : (
                <Alert message="This ticket is closed. You can create a new ticket if you have further queries." type="info" showIcon />
              )}
            </EnterpriseCard>
          ) : (
            <EnterpriseCard activeRole="MOTHER" hoverable={false} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '340px' }}>
              <div style={{ textAlign: 'center' }}>
                <MessageOutlined style={{ fontSize: '48px', color: theme.borderColor, marginBottom: '16px' }} />
                <Title level={5}>No Ticket Selected</Title>
                <Paragraph type="secondary">
                  Choose a ticket from the left panel list to view conversation history.
                </Paragraph>
              </div>
            </EnterpriseCard>
          )}
        </Col>
      </Row>
    </div>
  );
}

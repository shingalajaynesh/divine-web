import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Table, Button, Input, Select, Tag, Space, Modal, Form, Typography, Row, Col, Tabs, Drawer, List, Divider } from 'antd';
import { 
  SearchOutlined, 
  MessageOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined,
  UserOutlined,
  BookOutlined,
  HistoryOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  GET_INQUIRIES,
  REPLY_TO_INQUIRY,
  UPDATE_INQUIRY_STATUS,
} from '../features/inquiries/inquiryOperations';
import { gql } from '@apollo/client';

const GET_CRM_USERS_QUERY = gql`
  query GetCrmUsers {
    getCrmUsers {
      id
      displayName
      email
      phone
      pregnancyStartDate
      pregnancyDay
      role {
        roleType
      }
      subscriptions {
        id
        status
        plan {
          name
        }
      }
    }
  }
`;

const GET_CRM_NOTES_QUERY = gql`
  query GetCrmNotes($userId: ID!) {
    getCrmNotes(userId: $userId) {
      id
      note
      createdAt
      author {
        displayName
      }
    }
  }
`;

const ADD_CRM_NOTE_MUTATION = gql`
  mutation AddCrmNote($userId: ID!, $note: String!) {
    addCrmNote(userId: $userId, note: $note) {
      id
      note
    }
  }
`;

const GET_AUDIT_LOGS_QUERY = gql`
  query GetAuditLogs {
    getAuditLogs {
      id
      action
      targetType
      targetId
      payload
      createdAt
      user {
        displayName
        email
      }
    }
  }
`;

const MANAGE_CONTENT_QUERY = gql`
  query ManageContent {
    manageContent {
      id
      slug
      contentType
      status
      medicalReviewed
      translations {
        id
        language
        title
      }
    }
  }
`;

const REVIEW_CONTENT_ITEM_MUTATION = gql`
  mutation ReviewContentItem($id: ID!, $reviewed: Boolean!) {
    reviewContentItem(id: $id, reviewed: $reviewed) {
      id
      medicalReviewed
    }
  }
`;

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function StaffConsole({ isHi }) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedInqId, setSelectedInqId] = useState(null);

  // CRM states
  const [selectedUser, setSelectedUser] = useState(null);
  const [crmSearch, setCrmSearch] = useState('');
  const [newCrmNote, setNewCrmNote] = useState('');

  // Queries & Mutations
  const { data, loading, refetch } = useQuery(GET_INQUIRIES, {
    variables: { status: null, limit: 100, offset: 0 },
    fetchPolicy: 'network-only',
  });
  const [updateInquiryStatus] = useMutation(UPDATE_INQUIRY_STATUS, { onCompleted: () => refetch() });
  const [replyToInquiry] = useMutation(REPLY_TO_INQUIRY, { onCompleted: () => { refetch(); setReplyText(''); setSelectedInqId(null); toast.success("Reply recorded and ticket resolved!"); } });

  // CRM Queries & Mutations
  const crmUsersQuery = useQuery(GET_CRM_USERS_QUERY, { skip: activeTab !== 'crm' });
  const manageContentQuery = useQuery(MANAGE_CONTENT_QUERY, { skip: activeTab !== 'review' });
  const [reviewContent] = useMutation(REVIEW_CONTENT_ITEM_MUTATION, { onCompleted: () => { manageContentQuery.refetch(); toast.success('Content medical review updated'); } });

  const crmNotesQuery = useQuery(GET_CRM_NOTES_QUERY, {
    variables: { userId: selectedUser?.id },
    skip: !selectedUser
  });
  const auditLogsQuery = useQuery(GET_AUDIT_LOGS_QUERY, { skip: activeTab !== 'audit' });

  const [addCrmNote] = useMutation(ADD_CRM_NOTE_MUTATION, {
    onCompleted: () => {
      crmNotesQuery.refetch();
      setNewCrmNote('');
      toast.success('Clinical coaching note saved');
    }
  });

  const inquiries = data?.getInquiries?.items || [];
  const crmUsers = crmUsersQuery.data?.getCrmUsers || [];
  const crmNotes = crmNotesQuery.data?.getCrmNotes || [];
  const auditLogs = auditLogsQuery.data?.getAuditLogs || [];

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateInquiryStatus({ variables: { id, status: newStatus } });
      toast.success(`Ticket status updated to ${newStatus}!`);
    } catch (mutationError) {
      toast.error(mutationError.message);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await replyToInquiry({ variables: { id: selectedInqId, content: replyText.trim() } });
    } catch (mutationError) {
      toast.error(mutationError.message);
    }
  };

  const handleAddCrmNoteSubmit = async () => {
    if (!newCrmNote.trim() || !selectedUser) return;
    try {
      await addCrmNote({ variables: { userId: selectedUser.id, note: newCrmNote.trim() } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    const matchesStatus = filterStatus === 'all' || inq.status === filterStatus;
    const query = searchQuery.toLowerCase();
    return matchesStatus && (
      inq.name.toLowerCase().includes(query) ||
      (inq.email || '').toLowerCase().includes(query) ||
      inq.phone.toLowerCase().includes(query)
    );
  });

  const filteredCrmUsers = crmUsers.filter(u => {
    const q = crmSearch.toLowerCase();
    return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q);
  });

  const selectedInq = inquiries.find(i => i.id === selectedInqId);

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
        <Space orientation="vertical" style={{ width: '100%' }}>
          {record.status !== 'resolved' && (
            <Button 
              type="primary" 
              icon={<MessageOutlined />} 
              block 
              onClick={() => setSelectedInqId(record.id)}
              style={{ background: '#be123c', borderColor: '#be123c' }}
            >
              Reply & Resolve
            </Button>
          )}
          <Select 
            value={record.status} 
            onChange={(val) => handleUpdateStatus(record.id, val)}
            style={{ width: '100%' }}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="resolved">Resolved</Select.Option>
          </Select>
        </Space>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>🩺 {isHi ? "चिकित्सीय एवं प्रशासनिक कंसोल" : "Clinical & Coaching Console"}</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
            Manage user directories, clinical notes logs, ticket inquiries, and audit events.
          </Paragraph>
        </div>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          { key: 'tickets', label: '📞 Member Inquiries' },
          { key: 'crm', label: '👥 CRM Member Directory' },
          { key: 'review', label: '🩺 Medical Article Review' },
          { key: 'audit', label: '🛡️ Security Audit Trail' }
        ]}
        style={{ marginBottom: '24px' }}
      />

      {activeTab === 'tickets' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Input 
              placeholder="Search by name, email or phone..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              style={{ flex: 1, minWidth: '240px', borderRadius: '10px' }}
            />
            <Select 
              value={filterStatus} 
              onChange={setFilterStatus}
              style={{ width: '160px' }}
            >
              <Select.Option value="all">All Tickets</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="resolved">Resolved</Select.Option>
            </Select>
          </div>

          <Table 
            dataSource={filteredInquiries} 
            columns={columns} 
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            style={{ borderRadius: '12px', overflow: 'hidden' }}
          />
        </div>
      )}

      {activeTab === 'crm' && (
        <div>
          <Input 
            placeholder="Search CRM by name, email or phone..." 
            value={crmSearch}
            onChange={e => setCrmSearch(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ marginBottom: '20px', borderRadius: '10px' }}
          />

          <Table
            dataSource={filteredCrmUsers}
            rowKey="id"
            columns={[
              {
                title: 'Name',
                dataIndex: 'displayName',
                key: 'displayName',
                render: (text, record) => (
                  <div>
                    <Text strong>{text}</Text>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{record.email}</div>
                  </div>
                )
              },
              {
                title: 'Pregnancy Day',
                dataIndex: 'pregnancyDay',
                key: 'pregnancyDay',
                render: (day) => day ? `Day ${day}` : 'Not set'
              },
              {
                title: 'Subscription Status',
                key: 'sub',
                render: (_, record) => {
                  const sub = record.subscriptions?.[0];
                  if (!sub) return <Tag color="gray">Free Tier</Tag>;
                  return <Tag color="rose">{sub.plan?.name} ({sub.status.toUpperCase()})</Tag>;
                }
              },
              {
                title: 'Action',
                key: 'action',
                render: (_, record) => (
                  <Button type="link" icon={<UserOutlined />} onClick={() => setSelectedUser(record)}>
                    View clinical profile
                  </Button>
                )
              }
            ]}
          />
        </div>
      )}

      {activeTab === 'audit' && (
        <Table
          dataSource={auditLogs}
          rowKey="id"
          columns={[
            {
              title: 'Staff/Admin',
              key: 'user',
              render: (_, record) => `${record.user?.displayName} (${record.user?.email})`
            },
            {
              title: 'Action',
              dataIndex: 'action',
              key: 'action',
              render: (act) => <Tag color="blue">{act.toUpperCase()}</Tag>
            },
            {
              title: 'Target ID',
              key: 'target',
              render: (_, record) => `${record.targetType || ''} (${record.targetId || ''})`
            },
            {
              title: 'Timestamp',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (t) => new Date(t).toLocaleString()
            }
          ]}
        />
      )}

      {activeTab === 'review' && (
        <Table
          dataSource={manageContentQuery.data?.manageContent || []}
          rowKey="id"
          columns={[
            {
              title: 'Article / Guide Title',
              key: 'title',
              render: (_, record) => {
                const translation = record.translations?.find(t => t.language === 'en') || record.translations?.[0];
                return (
                  <div>
                    <Text strong>{translation?.title || record.slug}</Text>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Type: {record.contentType} · Status: {record.status}</div>
                  </div>
                );
              }
            },
            {
              title: 'Medical Review Status',
              dataIndex: 'medicalReviewed',
              key: 'medicalReviewed',
              render: (reviewed) => (
                <Tag color={reviewed ? 'green' : 'red'}>
                  {reviewed ? 'APPROVED CLINICAL GUIDE' : 'PENDING REVIEW'}
                </Tag>
              )
            },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Space>
                  {!record.medicalReviewed ? (
                    <Button 
                      size="small" 
                      type="primary" 
                      onClick={() => reviewContent({ variables: { id: record.id, reviewed: true } })}
                      style={{ background: '#be123c', borderColor: '#be123c' }}
                    >
                      Approve Clinical Guide
                    </Button>
                  ) : (
                    <Button 
                      size="small" 
                      onClick={() => reviewContent({ variables: { id: record.id, reviewed: false } })}
                    >
                      Revoke Approval
                    </Button>
                  )}
                </Space>
              )
            }
          ]}
        />
      )}

      {/* Ticket response dialog */}
      <Modal
        title="Reply & Close Ticket Inquiry"
        open={selectedInqId !== null}
        onCancel={() => setSelectedInqId(null)}
        footer={[
          <Button key="cancel" onClick={() => setSelectedInqId(null)}>Cancel</Button>,
          <Button key="send" type="primary" onClick={handleSendReply} style={{ background: '#be123c', borderColor: '#be123c' }}>
            Submit Reply
          </Button>
        ]}
      >
        {selectedInq && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
            <Text><strong>Ticket sender:</strong> {selectedInq.name}</Text>
            <Text><strong>Inquiry message:</strong> "{selectedInq.message}"</Text>
            <TextArea 
              rows={4} 
              placeholder="Type clinical advice or administrative response here..." 
              value={replyText} 
              onChange={e => setReplyText(e.target.value)} 
            />
          </div>
        )}
      </Modal>

      {/* CRM User Clinical profile drawer */}
      <Drawer
        title={`🩺 Clinical Profile - ${selectedUser?.displayName}`}
        width={480}
        onClose={() => setSelectedUser(null)}
        open={selectedUser !== null}
      >
        {selectedUser && (
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={5}>Patient Info</Title>
              <Paragraph style={{ margin: 0 }}>Email: {selectedUser.email}</Paragraph>
              <Paragraph style={{ margin: 0 }}>Phone: {selectedUser.phone || 'Not provided'}</Paragraph>
              <Paragraph style={{ margin: 0 }}>Pregnancy Start: {selectedUser.pregnancyStartDate ? new Date(selectedUser.pregnancyStartDate).toLocaleDateString() : 'Not set'}</Paragraph>
              <Paragraph style={{ margin: 0 }}>Current Day: Day {selectedUser.pregnancyDay || 'Not set'}</Paragraph>
            </div>

            <Divider />

            <div>
              <Title level={5}>Coaching & Clinical Notes</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <TextArea 
                  rows={3} 
                  placeholder="Enter medical coach note, daily diet tweaks, etc..." 
                  value={newCrmNote}
                  onChange={e => setNewCrmNote(e.target.value)}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCrmNoteSubmit} style={{ background: '#be123c', borderColor: '#be123c', alignSelf: 'flex-end' }}>
                  Save Note
                </Button>
              </div>

              <List
                dataSource={crmNotes}
                renderItem={n => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong style={{ fontSize: '12px' }}>{n.author?.displayName} · <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleDateString()}</span></Text>}
                      description={<Text style={{ fontSize: '12px', color: '#334155' }}>"{n.note}"</Text>}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Space>
        )}
      </Drawer>
    </Card>
  );
}

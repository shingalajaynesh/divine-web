import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Table, Card, Input, Select, Button, Space, Drawer, Form, 
  Descriptions, Alert, Spin, Tag, Typography, Divider, Modal 
} from 'antd';
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, AlertOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';

const { Title, Text, Paragraph } = Typography;

const MANAGE_CONTENT_QUERY = gql`
  query StaffManageContent {
    manageContent {
      id
      slug
      contentType
      status
      medicalReviewed
      reviewedBy
      feedback
      translations {
        id
        language
        title
        summary
        body
      }
    }
  }
`;

const APPROVE_MEDICAL_CONTENT_MUTATION = gql`
  mutation ApproveMedicalContent($id: ID!, $feedback: String) {
    approveMedicalContent(id: $id, feedback: $feedback) {
      id
      status
      medicalReviewed
      reviewedBy
      feedback
    }
  }
`;

const FLAG_MEDICAL_CONTENT_MUTATION = gql`
  mutation FlagMedicalContent($id: ID!, $feedback: String) {
    flagMedicalContent(id: $id, feedback: $feedback) {
      id
      status
      medicalReviewed
      reviewedBy
      feedback
    }
  }
`;

export default function StaffContentWorkspace({ user, lang }) {
  const isHi = lang === 'hi';
  const [search, setSearch] = useState('');
  const [selectedContent, setSelectedContent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Feedback note states
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteMode, setNoteMode] = useState('approve'); // 'approve' or 'flag'

  // 1. Fetch content items
  const { data, loading, error, refetch } = useQuery(MANAGE_CONTENT_QUERY, {
    fetchPolicy: 'network-only'
  });

  // 2. Mutations
  const [approveContent, { loading: approving }] = useMutation(APPROVE_MEDICAL_CONTENT_MUTATION, {
    onCompleted: () => {
      refetch();
      setIsNoteModalOpen(false);
      setFeedbackNote('');
      handleCloseDrawer();
      toast.success('Clinical content approved successfully.');
    },
    onError: (err) => toast.error(err.message)
  });

  const [flagContent, { loading: flagging }] = useMutation(FLAG_MEDICAL_CONTENT_MUTATION, {
    onCompleted: () => {
      refetch();
      setIsNoteModalOpen(false);
      setFeedbackNote('');
      handleCloseDrawer();
      toast.success('Revision requests logged and content flagged.');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleOpenDrawer = (record) => {
    setSelectedContent(record);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedContent(null);
  };

  const openNoteModal = (mode) => {
    setNoteMode(mode);
    setIsNoteModalOpen(true);
  };

  const handleActionSubmit = async () => {
    if (!selectedContent) return;
    if (noteMode === 'approve') {
      await approveContent({
        variables: { id: selectedContent.id, feedback: feedbackNote.trim() || null }
      });
    } else {
      if (!feedbackNote.trim()) {
        toast.error('Feedback reason is required when flagging content.');
        return;
      }
      await flagContent({
        variables: { id: selectedContent.id, feedback: feedbackNote.trim() }
      });
    }
  };

  const contentItems = data?.manageContent || [];
  
  // Only clinical staff, restrict view to review items
  const filteredContent = contentItems.filter(c => {
    const defaultTrans = c.translations?.find(t => t.language === 'en') || c.translations?.[0];
    const title = defaultTrans?.title || c.slug || '';
    const matchesSearch = !search.trim() || title.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const columns = [
    {
      title: 'Title / Slug',
      key: 'title',
      render: (_, record) => {
        const trans = record.translations?.find(t => t.language === 'en') || record.translations?.[0];
        return (
          <div>
            <span style={{ fontWeight: 500 }}>{trans?.title || record.slug}</span>
            <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Slug: {record.slug}</span>
          </div>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'contentType',
      key: 'contentType',
      render: (type) => <Tag color="blue">{type ? type.toUpperCase() : 'ARTICLE'}</Tag>
    },
    {
      title: 'Workflow Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = {
          DRAFT: 'orange',
          IN_REVIEW: 'purple',
          APPROVED: 'green',
          PUBLISHED: 'success',
          ARCHIVED: 'default'
        }[status] || 'orange';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Medical Review',
      dataIndex: 'medicalReviewed',
      key: 'medicalReviewed',
      render: (reviewed) => (
        <Tag color={reviewed ? 'success' : 'warning'}>
          {reviewed ? 'VERIFIED' : 'PENDING REVIEW'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          onClick={() => handleOpenDrawer(record)}
        >
          Verify Draft
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Clinical Content Verification"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Reload Drafts</Button>
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

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <Input
            placeholder="Search drafts by title/slug..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredContent}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Content Verification Drawer */}
      <Drawer
        title="Draft Content Details"
        width={650}
        onClose={handleCloseDrawer}
        open={drawerOpen}
        destroyOnClose
      >
        {selectedContent && (
          <div>
            <Descriptions title="Metadata" bordered column={1} size="small">
              <Descriptions.Item label="Slug">{selectedContent.slug}</Descriptions.Item>
              <Descriptions.Item label="Content Type">{selectedContent.contentType}</Descriptions.Item>
              <Descriptions.Item label="Status">{selectedContent.status}</Descriptions.Item>
              <Descriptions.Item label="Medical Verification State">
                {selectedContent.medicalReviewed ? 'Verified Clinical Standard' : 'Awaiting Clinician Verification'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Draft Translations & Content</Title>
            {selectedContent.translations?.map((t) => (
              <Card 
                key={t.language} 
                title={`Language: ${t.language.toUpperCase()}`}
                size="small"
                style={{ marginBottom: 16, backgroundColor: '#f9fafb' }}
              >
                <Paragraph><strong>Title:</strong> {t.title}</Paragraph>
                <Paragraph><strong>Summary:</strong> {t.summary}</Paragraph>
                <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 8, marginTop: 8 }}>
                  <Text strong>Body Text Preview:</Text>
                  <Paragraph style={{ whiteSpace: 'pre-line', fontSize: 13, marginTop: 4 }}>{t.body}</Paragraph>
                </div>
              </Card>
            ))}

            <Divider />

            {!selectedContent.medicalReviewed && (
              <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  danger 
                  icon={<AlertOutlined />} 
                  onClick={() => openNoteModal('flag')}
                >
                  Flag Revision Needs
                </Button>
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />} 
                  onClick={() => openNoteModal('approve')}
                >
                  Approve Clinical Standard
                </Button>
              </Space>
            )}
          </div>
        )}
      </Drawer>

      {/* Verification Feedback Modal */}
      <Modal
        title={noteMode === 'approve' ? 'Approve Clinical Standard' : 'Flag Revision Needs'}
        open={isNoteModalOpen}
        onCancel={() => setIsNoteModalOpen(false)}
        onOk={handleActionSubmit}
        confirmLoading={approving || flagging}
        okText={noteMode === 'approve' ? 'Approve Draft' : 'Flag Draft'}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item 
            label="Clinician Notes / Feedback" 
            required={noteMode === 'flag'}
            extra={noteMode === 'flag' ? 'Specify changes or adjustments required for this draft.' : 'Optional approval comments.'}
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter feedback details..."
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

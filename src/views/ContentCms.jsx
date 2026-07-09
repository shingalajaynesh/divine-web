import React, { useState } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { Button, Card, Col, Form, Input, Row, Select, Space, Table, Tag, Typography, Modal, Tabs, Switch, Divider, Badge } from 'antd';
import { CheckCircleOutlined, PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, FileAddOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  CREATE_CONTENT_ITEM_MUTATION, 
  MANAGE_CONTENT_QUERY, 
  PUBLISH_CONTENT_ITEM_MUTATION,
  UPDATE_CONTENT_ITEM_MUTATION,
  DELETE_CONTENT_ITEM_MUTATION,
  REGISTER_MEDIA_ASSET_MUTATION,
  GET_CLOUDINARY_SIGNATURE_QUERY,
  SUBMIT_FOR_REVIEW_MUTATION,
  APPROVE_MEDICAL_CONTENT_MUTATION
} from '../graphql/operations';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function ContentCms({ user }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [mediaForm] = Form.useForm();
  
  const { data, loading, refetch } = useQuery(MANAGE_CONTENT_QUERY, { 
    variables: { status, search: search || null }, 
    fetchPolicy: 'network-only' 
  });
  
  const [createItem, { loading: creating }] = useMutation(CREATE_CONTENT_ITEM_MUTATION);
  const [publishItem, { loading: publishing }] = useMutation(PUBLISH_CONTENT_ITEM_MUTATION);
  const [updateItem, { loading: updating }] = useMutation(UPDATE_CONTENT_ITEM_MUTATION);
  const [deleteItem, { loading: deleting }] = useMutation(DELETE_CONTENT_ITEM_MUTATION);
  const [registerMedia, { loading: registeringMedia }] = useMutation(REGISTER_MEDIA_ASSET_MUTATION);
  const [submitForReview, { loading: submittingForReview }] = useMutation(SUBMIT_FOR_REVIEW_MUTATION);
  const [approveMedicalContent, { loading: approving }] = useMutation(APPROVE_MEDICAL_CONTENT_MUTATION);
  const client = useApolloClient();
  const [uploadingFile, setUploadingFile] = useState(false);

  const isAdmin = user?.role?.roleType === 'ADMIN';

  // Modal editing states
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditLang, setCurrentEditLang] = useState('en');

  // Translation values cache for the item currently being edited
  const [transCache, setTransCache] = useState({
    en: { title: '', summary: '', body: '' },
    hi: { title: '', summary: '', body: '' },
    gu: { title: '', summary: '', body: '' }
  });

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    
    // Seed translation cache from existing translation array
    const cache = {
      en: { title: '', summary: '', body: '' },
      hi: { title: '', summary: '', body: '' },
      gu: { title: '', summary: '', body: '' }
    };
    
    if (item.translations) {
      item.translations.forEach(t => {
        if (cache[t.language]) {
          cache[t.language] = {
            title: t.title || '',
            summary: t.summary || '',
            body: t.body || ''
          };
        }
      });
    }
    setTransCache(cache);
    setCurrentEditLang('en');

    // Seed general fields
    editForm.setFieldsValue({
      slug: item.slug,
      contentType: item.contentType,
      visibility: item.visibility,
      trimester1Safe: item.trimester1Safe ?? true,
      trimester2Safe: item.trimester2Safe ?? true,
      trimester3Safe: item.trimester3Safe ?? true,
      contraindications: item.contraindications || '',
      medicalReviewed: item.medicalReviewed ?? false,
      coverAssetId: item.coverAsset?.id || '',
      title: cache.en.title,
      summary: cache.en.summary,
      body: cache.en.body
    });
    
    setIsEditModalOpen(true);
  };

  const handleEditLangChange = (lang) => {
    // Save currently input values to cache first
    const currentVals = editForm.getFieldsValue(['title', 'summary', 'body']);
    setTransCache(prev => ({
      ...prev,
      [currentEditLang]: {
        title: currentVals.title || '',
        summary: currentVals.summary || '',
        body: currentVals.body || ''
      }
    }));

    // Switch lang and set form values from cache
    setCurrentEditLang(lang);
    editForm.setFieldsValue({
      title: transCache[lang].title,
      summary: transCache[lang].summary,
      body: transCache[lang].body
    });
  };

  const handleSaveEdit = async () => {
    // Gather current values to capture any unsaved tab inputs
    const currentVals = editForm.getFieldsValue();
    const finalCache = {
      ...transCache,
      [currentEditLang]: {
        title: currentVals.title || '',
        summary: currentVals.summary || '',
        body: currentVals.body || ''
      }
    };

    // Format translations payload (filter out empty languages)
    const translationsPayload = Object.entries(finalCache)
      .filter(([_, data]) => data.title.trim() !== '')
      .map(([lang, data]) => ({
        language: lang,
        title: data.title,
        summary: data.summary,
        body: data.body
      }));

    if (translationsPayload.length === 0) {
      toast.error("At least one language title is required.");
      return;
    }

    try {
      await updateItem({
        variables: {
          id: editingItem.id,
          input: {
            slug: currentVals.slug,
            contentType: currentVals.contentType,
            visibility: currentVals.visibility,
            coverAssetId: currentVals.coverAssetId || null,
            trimester1Safe: currentVals.trimester1Safe,
            trimester2Safe: currentVals.trimester2Safe,
            trimester3Safe: currentVals.trimester3Safe,
            contraindications: currentVals.contraindications || null,
            medicalReviewed: currentVals.medicalReviewed,
            translations: translationsPayload
          }
        }
      });
      setIsEditModalOpen(false);
      refetch();
      toast.success("Content item updated successfully.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this content item?',
      content: 'This will archive the item and make it inaccessible.',
      okText: 'Yes, delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteItem({ variables: { id } });
          refetch();
          toast.success("Content item deleted.");
        } catch (err) {
          toast.error(err.message);
        }
      }
    });
  };

  const handleRegisterMedia = async (values) => {
    try {
      const res = await registerMedia({
        variables: {
          input: {
            url: values.url,
            mimeType: values.mimeType,
            kind: values.kind,
            altText: values.altText || null
          }
        }
      });
      const registeredId = res.data.registerMediaAsset.id;
      // Copy to editForm coverAssetId automatically
      editForm.setFieldsValue({ coverAssetId: registeredId });
      mediaForm.resetFields();
      toast.success(`Media registered! ID ${registeredId} copied to Cover Asset.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCloudinaryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const { data: sigData } = await client.query({
        query: GET_CLOUDINARY_SIGNATURE_QUERY,
        variables: { folder: 'cms_content' }
      });
      const { signature, timestamp, apiKey, cloudName } = sigData.getCloudinarySignature;

      let secureUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v123456/${file.name.replace(/\s+/g, '_')}`;

      if (apiKey !== 'mock_key') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);
        formData.append('folder', 'cms_content');

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error?.message || 'Cloudinary upload failed.');
        }

        const uploadResult = await uploadRes.json();
        secureUrl = uploadResult.secure_url;
      } else {
        toast.success("[MOCK MODE] Simulating Cloudinary upload...");
      }

      const res = await registerMedia({
        variables: {
          input: {
            url: secureUrl,
            mimeType: file.type || 'image/jpeg',
            kind: file.type.startsWith('video') ? 'video' : (file.type.startsWith('audio') ? 'audio' : 'image'),
            altText: `Uploaded ${file.name}`
          }
        }
      });

      const registeredId = res.data.registerMediaAsset.id;
      editForm.setFieldsValue({ coverAssetId: registeredId });
      toast.success(`Upload complete! Registered ID: ${registeredId}`);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const submit = async (values) => {
    try {
      await createItem({ 
        variables: { 
          input: { 
            slug: values.slug, 
            contentType: values.contentType, 
            visibility: values.visibility, 
            translations: [{ 
              language: values.language, 
              title: values.title, 
              summary: values.summary || null, 
              body: values.body || null 
            }] 
          } 
        } 
      });
      form.resetFields(['slug', 'title', 'summary', 'body']);
      refetch();
      toast.success('Draft content created.');
    } catch (error) { 
      toast.error(error.message); 
    }
  };

  const publish = async (id) => {
    try { 
      await publishItem({ variables: { id } }); 
      refetch(); 
      toast.success('Content published.'); 
    } catch (error) { 
      toast.error(error.message); 
    }
  };

  const handleSubmitForReview = async (id) => {
    try {
      await submitForReview({ variables: { id } });
      refetch();
      toast.success('Content submitted for review.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const approve = async (id) => {
    try {
      await approveMedicalContent({ variables: { id, feedback: 'Approved by admin' } });
      refetch();
      toast.success('Content approved.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    { 
      title: 'Content', 
      key: 'content', 
      render: (_, item) => (
        <div>
          <Text strong>{item.translations?.[0]?.title || item.slug}</Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
            {item.slug} · <Tag size="small">{item.contentType}</Tag>
          </Text>
        </div>
      ) 
    },
    { 
      title: 'Languages', 
      width: 150, 
      render: (_, item) => (
        <Space size={4}>
          {item.translations?.map((translation) => (
            <Tag color="purple" key={translation.language}>{translation.language.toUpperCase()}</Tag>
          ))}
        </Space>
      )
    },
    { 
      title: 'Access', 
      dataIndex: 'visibility', 
      width: 100, 
      render: (value) => <Tag color={value === 'free' ? 'green' : 'gold'}>{value}</Tag> 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      width: 110, 
      render: (value) => <Tag color={value === 'published' ? 'success' : value === 'approved' ? 'cyan' : value === 'review' ? 'processing' : 'default'}>{value}</Tag> 
    },
    { 
      title: 'Safety', 
      key: 'safety',
      width: 140,
      render: (_, item) => (
        <Space size={2} wrap>
          {item.trimester1Safe && <Tag color="blue">T1</Tag>}
          {item.trimester2Safe && <Tag color="orange">T2</Tag>}
          {item.trimester3Safe && <Tag color="red">T3</Tag>}
        </Space>
      )
    },
    { 
      title: 'Action', 
      width: 180, 
      render: (_, item) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(item)}>Edit</Button>
          {item.status === 'draft' && (
            <Button size="small" type="dashed" loading={submittingForReview} onClick={() => handleSubmitForReview(item.id)}>Submit Review</Button>
          )}
          {isAdmin && item.status === 'review' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={approving} onClick={() => approve(item.id)} style={{ background: '#0f766e', borderColor: '#0f766e' }}>Approve</Button>
          )}
          {isAdmin && item.status === 'approved' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={publishing} onClick={() => publish(item.id)}>Publish</Button>
          )}
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(item.id)} />
        </Space>
      ) 
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Tag color="volcano">CONTENT MANAGEMENT</Tag>
        <Title level={2} style={{ color: 'var(--brand-maroon-dark)', margin: '8px 0 0 0' }}>Divine Content Studio</Title>
        <Paragraph type="secondary">Create localized articles, yoga tutorials, audio relaxation, and pregnancy stories. Manage publication windows and safety tags.</Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={8}>
          <Card title="Create Content Draft" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
            <Form form={form} layout="vertical" onFinish={submit} initialValues={{ contentType: 'article', visibility: 'free', language: 'en' }}>
              <Form.Item name="slug" label="Slug" rules={[{ required: true }, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Use lowercase words and hyphens.' }]}>
                <Input placeholder="gentle-evening-practice" />
              </Form.Item>
              <Row gutter={10}>
                <Col span={12}>
                  <Form.Item name="contentType" label="Type" rules={[{ required: true }]}>
                    <Select options={['article','video','audio','story','prayer','affirmation','recipe','yoga','meditation'].map((value) => ({ value, label: value }))} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="visibility" label="Access">
                    <Select options={['free','enrolled','premium','staff'].map((value) => ({ value, label: value }))} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="language" label="Initial Language">
                <Select options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }, { value: 'gu', label: 'Gujarati' }]} />
              </Form.Item>
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="summary" label="Summary">
                <TextArea rows={2} />
              </Form.Item>
              <Form.Item name="body" label="Body">
                <TextArea rows={4} />
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={creating} style={{ background: '#be123c', borderColor: '#be123c', borderRadius: '8px', height: '40px', fontWeight: 'bold' }} block>
                Create Draft
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Card 
            title="Content Inventory" 
            extra={
              <Space>
                <Input allowClear prefix={<SearchOutlined />} placeholder="Search slug" value={search} onChange={(event) => setSearch(event.target.value)} />
                <Select allowClear placeholder="Status" value={status} onChange={setStatus} options={['draft','review','published','archived'].map((value) => ({ value, label: value }))} />
              </Space>
            }
            style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}
          >
            <Table rowKey="id" loading={loading} dataSource={data?.manageContent || []} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: 700 }} />
          </Card>
        </Col>
      </Row>

      {/* Edit Modal (Features Multilingual Tabs & Media Registration Tools) */}
      <Modal
        title={<><EditOutlined /> Edit Content Details & Translations</>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} loading={updating} onClick={handleSaveEdit} style={{ background: '#be123c', borderColor: '#be123c' }}>
            Save Updates
          </Button>
        ]}
      >
        {editingItem && (
          <Row gutter={24}>
            {/* Left: General metadata fields */}
            <Col xs={24} md={12}>
              <Divider orientation="left">Core Metadata</Divider>
              <Form form={editForm} layout="vertical">
                <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="contentType" label="Content Type" rules={[{ required: true }]}>
                      <Select options={['article','video','audio','story','prayer','affirmation','recipe','yoga','meditation'].map((value) => ({ value, label: value }))} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="visibility" label="Access Visibility">
                      <Select options={['free','enrolled','premium','staff'].map((value) => ({ value, label: value }))} />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="coverAssetId" label="Cover Asset ID">
                      <Input placeholder="Copy ID from media tool" />
                    </Form.Item>
                  </Col>
                  <Col span={12} style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                    <Form.Item name="medicalReviewed" valuePropName="checked" label="Medical Reviewed" style={{ marginBottom: 0 }}>
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">Safety Settings</Divider>
                <Row gutter={12}>
                  <Col span={8}>
                    <Form.Item name="trimester1Safe" valuePropName="checked" label="Trimester 1 Safe">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="trimester2Safe" valuePropName="checked" label="Trimester 2 Safe">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="trimester3Safe" valuePropName="checked" label="Trimester 3 Safe">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="contraindications" label="Contraindications">
                  <TextArea placeholder="Contraindications details if unsafe for certain conditions" rows={2} />
                </Form.Item>
              </Form>
            </Col>

            {/* Right: Language translation + Media registration sub-forms */}
            <Col xs={24} md={12} style={{ borderLeft: '1px solid #f1f5f9' }}>
              <Divider orientation="left">Multilingual Content</Divider>
              <Tabs activeKey={currentEditLang} onChange={handleEditLangChange} type="card" style={{ marginBottom: '16px' }}>
                <Tabs.TabPane tab="English (EN)" key="en" />
                <Tabs.TabPane tab="Hindi (HI)" key="hi" />
                <Tabs.TabPane tab="Gujarati (GU)" key="gu" />
              </Tabs>

              <Form form={editForm} layout="vertical">
                <Form.Item name="title" label={`Title (${currentEditLang.toUpperCase()})`} rules={[{ required: currentEditLang === 'en' }]}>
                  <Input placeholder="Enter translated title" />
                </Form.Item>
                <Form.Item name="summary" label={`Summary (${currentEditLang.toUpperCase()})`}>
                  <TextArea rows={2} placeholder="Enter translated summary" />
                </Form.Item>
                <Form.Item name="body" label={`Body (${currentEditLang.toUpperCase()})`}>
                  <TextArea rows={5} placeholder="Enter markdown body content" />
                </Form.Item>
              </Form>

              <Divider orientation="left"><UploadOutlined /> Direct Cloudinary Upload</Divider>
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                  Securely upload and optimize assets directly to Cloudinary folder hierarchy.
                </Text>
                <input 
                  type="file" 
                  accept="image/*,video/*,audio/*"
                  onChange={handleCloudinaryUpload} 
                  disabled={uploadingFile}
                  style={{ display: 'none' }}
                  id="cloudinary-file-input"
                />
                <Button 
                  type="dashed" 
                  icon={<UploadOutlined />} 
                  loading={uploadingFile}
                  onClick={() => document.getElementById('cloudinary-file-input').click()}
                  block
                >
                  {uploadingFile ? "Uploading to Cloudinary..." : "Choose & Upload File"}
                </Button>
              </div>

              <Divider orientation="left"><FileAddOutlined /> Register Media Tool</Divider>
              <Form form={mediaForm} layout="vertical" onFinish={handleRegisterMedia}>
                <Form.Item name="url" label="HTTPS Media URL" rules={[{ required: true }, { type: 'url', message: 'Enter a valid HTTPS link.' }]}>
                  <Input placeholder="https://mycdn.com/cover.jpg" />
                </Form.Item>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="kind" label="Kind" rules={[{ required: true }]}>
                      <Select options={['image', 'audio', 'video', 'document'].map(v => ({ value: v, label: v.toUpperCase() }))} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="mimeType" label="MIME Type" rules={[{ required: true }]}>
                      <Input placeholder="image/jpeg, audio/mp3" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="altText" label="Alt Text/Caption">
                  <Input placeholder="Relaxing sunset image" />
                </Form.Item>
                <Button type="dashed" htmlType="submit" icon={<PlusOutlined />} loading={registeringMedia} block>
                  Register & Copy ID
                </Button>
              </Form>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
}

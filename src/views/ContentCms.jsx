import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Card, Col, Form, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { CREATE_CONTENT_ITEM_MUTATION, MANAGE_CONTENT_QUERY, PUBLISH_CONTENT_ITEM_MUTATION } from '../graphql/operations';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function ContentCms({ user }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const [form] = Form.useForm();
  const { data, loading, refetch } = useQuery(MANAGE_CONTENT_QUERY, { variables: { status, search: search || null }, fetchPolicy: 'network-only' });
  const [createItem, { loading: creating }] = useMutation(CREATE_CONTENT_ITEM_MUTATION);
  const [publishItem, { loading: publishing }] = useMutation(PUBLISH_CONTENT_ITEM_MUTATION);
  const isAdmin = user?.role?.roleType === 'ADMIN';

  const submit = async (values) => {
    try {
      await createItem({ variables: { input: { slug: values.slug, contentType: values.contentType, visibility: values.visibility, translations: [{ language: values.language, title: values.title, summary: values.summary || null, body: values.body || null }] } } });
      form.resetFields(['slug', 'title', 'summary', 'body']);
      await refetch();
      toast.success('Draft content created.');
    } catch (error) { toast.error(error.message); }
  };

  const publish = async (id) => {
    try { await publishItem({ variables: { id } }); await refetch(); toast.success('Content published.'); } catch (error) { toast.error(error.message); }
  };

  const columns = [
    { title: 'Content', key: 'content', render: (_, item) => <div><Text strong>{item.translations?.[0]?.title || item.slug}</Text><Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{item.slug} · {item.contentType}</Text></div> },
    { title: 'Language', width: 100, render: (_, item) => item.translations?.map((translation) => <Tag key={translation.language}>{translation.language}</Tag>) },
    { title: 'Access', dataIndex: 'visibility', width: 110, render: (value) => <Tag color={value === 'free' ? 'green' : 'gold'}>{value}</Tag> },
    { title: 'Status', dataIndex: 'status', width: 110, render: (value) => <Tag color={value === 'published' ? 'success' : value === 'review' ? 'processing' : 'default'}>{value}</Tag> },
    { title: 'Action', width: 130, render: (_, item) => isAdmin && item.status !== 'published' ? <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={publishing} onClick={() => publish(item.id)}>Publish</Button> : null },
  ];

  return <div className="cms-workspace">
    <div><Tag>CONTENT OPERATIONS</Tag><Title level={2}>Divine content studio</Title><Paragraph>Create localized drafts and manage the publication workflow. Media upload will be connected in a later storage chunk.</Paragraph></div>
    <Row gutter={[20, 20]}>
      <Col xs={24} xl={9}><Card title="Create content draft"><Form form={form} layout="vertical" onFinish={submit} initialValues={{ contentType: 'article', visibility: 'free', language: 'en' }}>
        <Form.Item name="slug" label="Slug" rules={[{ required: true }, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Use lowercase words and hyphens.' }]}><Input placeholder="gentle-evening-practice" /></Form.Item>
        <Row gutter={10}><Col span={12}><Form.Item name="contentType" label="Type" rules={[{ required: true }]}><Select options={['article','video','audio','story','prayer','affirmation','recipe','yoga','meditation'].map((value) => ({ value, label: value }))} /></Form.Item></Col><Col span={12}><Form.Item name="visibility" label="Access"><Select options={['free','enrolled','premium','staff'].map((value) => ({ value, label: value }))} /></Form.Item></Col></Row>
        <Form.Item name="language" label="Language"><Select options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }, { value: 'gu', label: 'Gujarati' }]} /></Form.Item>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="summary" label="Summary"><TextArea rows={2} /></Form.Item><Form.Item name="body" label="Body"><TextArea rows={5} /></Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={creating} block>Create draft</Button>
      </Form></Card></Col>
      <Col xs={24} xl={15}><Card title="Content inventory" extra={<Space><Input allowClear prefix={<SearchOutlined />} placeholder="Search slug" value={search} onChange={(event) => setSearch(event.target.value)} /><Select allowClear placeholder="Status" value={status} onChange={setStatus} options={['draft','review','published','archived'].map((value) => ({ value, label: value }))} /></Space>}><Table rowKey="id" loading={loading} dataSource={data?.manageContent || []} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: 700 }} /></Card></Col>
    </Row>
  </div>;
}

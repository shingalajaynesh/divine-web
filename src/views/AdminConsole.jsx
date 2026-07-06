import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADMIN_ADD_CONTENT_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';
import { Card, Form, Input, InputNumber, Select, Button, Typography, Row, Col } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function AdminConsole() {
  const [adminAddContent, { loading: submitting }] = useMutation(ADMIN_ADD_CONTENT_MUTATION);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    const { dayNumber, category, titleEn, titleHi, bodyEn, bodyHi, mediaUrl } = values;
    try {
      await adminAddContent({
        variables: {
          dayNumber: parseInt(dayNumber, 10),
          category,
          titleEn,
          titleHi,
          bodyEn,
          bodyHi,
          mediaUrl: mediaUrl || null
        }
      });
      toast.success('Daily Content uploaded successfully!');
      form.resetFields(['titleEn', 'titleHi', 'bodyEn', 'bodyHi', 'mediaUrl']);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>🛠️ Admin Console</Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          Upload 280-day content calendar items directly to the database
        </Paragraph>
      </div>

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleSubmit}
        initialValues={{ dayNumber: 1, category: 'story' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item 
              name="dayNumber" 
              label={<Text strong style={{ fontSize: '12px' }}>Calendar Day (1-280)</Text>}
              rules={[{ required: true, message: 'Please enter day number' }]}
            >
              <InputNumber min={1} max={280} style={{ width: '100%' }} size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item 
              name="category" 
              label={<Text strong style={{ fontSize: '12px' }}>Category</Text>}
              rules={[{ required: true }]}
            >
              <Select size="large">
                <Select.Option value="story">📖 Story</Select.Option>
                <Select.Option value="video">🎥 Video</Select.Option>
                <Select.Option value="music">🎵 Lullaby</Select.Option>
                <Select.Option value="yoga">🧘‍♀️ Yoga</Select.Option>
                <Select.Option value="recipe">🥗 Recipe</Select.Option>
                <Select.Option value="mantra">🕉️ Mantra</Select.Option>
                <Select.Option value="article">📚 Article</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item 
          name="titleEn" 
          label={<Text strong style={{ fontSize: '12px' }}>Title (English)</Text>}
          rules={[{ required: true, message: 'Please enter English title' }]}
        >
          <Input size="large" placeholder="Enter title in English" />
        </Form.Item>

        <Form.Item 
          name="titleHi" 
          label={<Text strong style={{ fontSize: '12px' }}>Title (Hindi)</Text>}
          rules={[{ required: true, message: 'Please enter Hindi title' }]}
        >
          <Input size="large" placeholder="Enter title in Hindi" />
        </Form.Item>

        <Form.Item 
          name="bodyEn" 
          label={<Text strong style={{ fontSize: '12px' }}>Body Text (English)</Text>}
          rules={[{ required: true, message: 'Please enter English body' }]}
        >
          <TextArea rows={3} placeholder="Enter description in English" />
        </Form.Item>

        <Form.Item 
          name="bodyHi" 
          label={<Text strong style={{ fontSize: '12px' }}>Body Text (Hindi)</Text>}
          rules={[{ required: true, message: 'Please enter Hindi body' }]}
        >
          <TextArea rows={3} placeholder="Enter description in Hindi" />
        </Form.Item>

        <Form.Item 
          name="mediaUrl" 
          label={<Text strong style={{ fontSize: '12px' }}>Media URL (e.g. YouTube, MP3 link)</Text>}
        >
          <Input size="large" placeholder="https://..." />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            block 
            loading={submitting}
            icon={<PlusCircleOutlined />}
            style={{ height: '48px', fontWeight: 'bold' }}
          >
            Upload Content Calendar Item
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

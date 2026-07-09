import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Form, Input, Button, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { SUBMIT_INQUIRY } from '../graphql/operations';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function ContactInquiryForm({ user, isHi }) {
  const [form] = Form.useForm();
  const [submitInquiry, { loading: submitting }] = useMutation(SUBMIT_INQUIRY);

  const handleSubmit = async (values) => {
    try {
      await submitInquiry({ variables: { input: {
        name: values.name,
        email: values.email,
        phone: values.phone,
        city: values.city,
        language: isHi ? 'hi' : 'en',
        message: values.message,
        source: 'member_web',
      } } });
      toast.success(isHi ? "पूछताछ दर्ज की गई! हमारे प्रतिनिधि आपसे संपर्क करेंगे।" : "Inquiry submitted! Our support team will contact you shortly.");
      form.setFieldsValue({ message: '' });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}><MailOutlined /> {isHi ? "तत्काल सहायता और पूछताछ" : "Support & Staff Inquiry"}</Title>
        <Paragraph type="secondary" style={{ fontSize: '11px', margin: '2px 0 0 0' }}>
          {isHi ? "हमारे चिकित्सा स्टाफ से त्वरित संपर्क सूत्र" : "Reach out to our experts directly for help"}
        </Paragraph>
      </div>

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleSubmit}
        initialValues={{ name: user?.displayName || '', email: user?.emailAddress || '' }}
      >
        <Form.Item name="name" rules={[{ required: true }]} style={{ marginBottom: '12px' }}>
          <Input placeholder={isHi ? "आपका नाम" : "Your Name"} />
        </Form.Item>

        <Form.Item name="email" rules={[{ required: true, type: 'email' }]} style={{ marginBottom: '12px' }}>
          <Input placeholder={isHi ? "ईमेल पता" : "Email Address"} />
        </Form.Item>

        <Form.Item name="phone" rules={[{ required: true }]} style={{ marginBottom: '12px' }}>
          <Input placeholder={isHi ? "मोबाइल नंबर" : "Phone Number"} />
        </Form.Item>

        <Form.Item name="city" rules={[{ required: true }]} style={{ marginBottom: '12px' }}>
          <Input placeholder={isHi ? "शहर" : "City / Town"} />
        </Form.Item>

        <Form.Item name="message" rules={[{ required: true }]} style={{ marginBottom: '16px' }}>
          <TextArea rows={2} placeholder={isHi ? "अपनी पूछताछ या सवाल लिखें..." : "Describe your medical or program inquiry..."} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={submitting} 
            block
            style={{ fontWeight: 'bold' }}
          >
            {submitting ? (isHi ? "भेजा जा रहा है..." : "Sending...") : (isHi ? "पूछताछ भेजें" : "Submit Ticket")}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Form, Input, Button, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function ContactInquiryForm({ user, isHi }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (values) => {
    const { name, email, phone, message } = values;
    setSubmitting(true);

    setTimeout(() => {
      const newInquiry = {
        id: 'inq_' + Math.random().toString(36).substring(7),
        name,
        email,
        phone,
        message,
        status: 'pending',
        replies: [],
        createdAt: new Date().toISOString()
      };

      const existing = localStorage.getItem('divine_inquiries');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newInquiry);
      localStorage.setItem('divine_inquiries', JSON.stringify(list));

      toast.success(isHi ? "पूछताछ दर्ज की गई! हमारे प्रतिनिधि आपसे संपर्क करेंगे।" : "Inquiry submitted! Our support team will contact you shortly.");
      
      // Simulate real-time staff alert on new ticket
      setTimeout(() => {
        toast(`🔔 Staff Notification: New support inquiry from ${name}`, {
          icon: '✉️',
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px'
          }
        });
      }, 2500);

      form.setFieldsValue({ message: '', phone: '' });
      setSubmitting(false);
    }, 1000);
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

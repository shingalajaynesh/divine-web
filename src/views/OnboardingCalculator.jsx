import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Form, DatePicker, Select, Button, Divider, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

export default function OnboardingCalculator({ saveOnboarding, t }) {
  const [lmpDate, setLmpDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!lmpDate && !dueDate) {
      toast.error("Please select either your LMP date or Estimated Due Date.");
      return;
    }
    setLoading(true);
    try {
      await saveOnboarding({
        variables: {
          lmpDate: lmpDate ? lmpDate.format('YYYY-MM-DD') : null,
          dueDate: dueDate ? dueDate.format('YYYY-MM-DD') : null,
          language: lang
        }
      });
      toast.success("Pregnancy milestones calculated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      style={{ maxWidth: 440, width: '100%', margin: '40px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '16px' }}
      styles={{ body: { padding: '32px' } }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: '0 0 8px 0' }}>🤰 {t.onboarding_title}</Title>
        <Paragraph type="secondary" style={{ fontSize: '13px', margin: 0 }}>
          We will calculate your week and trimester to unlock daily content
        </Paragraph>
      </div>

      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item label={<Text strong>{t.lmp_label}</Text>}>
          <DatePicker 
            style={{ width: '100%' }} 
            size="large"
            placeholder="Select Last Menstrual Period Date"
            value={lmpDate}
            onChange={(val) => {
              setLmpDate(val);
              if (val) setDueDate(null);
            }}
          />
        </Form.Item>

        <Divider plain><Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>or</Text></Divider>

        <Form.Item label={<Text strong>{t.edd_label}</Text>}>
          <DatePicker 
            style={{ width: '100%' }} 
            size="large"
            placeholder="Select Estimated Due Date"
            value={dueDate}
            onChange={(val) => {
              setDueDate(val);
              if (val) setLmpDate(null);
            }}
          />
        </Form.Item>

        <Form.Item label={<Text strong>{t.select_lang}</Text>}>
          <Select 
            size="large" 
            value={lang} 
            onChange={(val) => setLang(val)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिंदी (Hindi)' }
            ]}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            block 
            loading={loading}
            style={{ height: '48px', fontWeight: 'bold' }}
          >
            {t.save_onboarding}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function DailyAffirmation({ t }) {
  return (
    <Card 
      style={{ 
        background: 'linear-gradient(135deg, var(--color-brand-secondary) 0%, var(--color-accent-pink) 100%)', 
        border: 0, 
        borderRadius: 24, 
        textAlign: 'center',
        boxShadow: '0 6px 20px rgba(99, 18, 7, 0.12)'
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
        {t.affirmation_title}
      </Text>
      <Paragraph style={{ color: '#fff', fontSize: '16px', fontStyle: 'italic', fontWeight: 'medium', margin: '12px 0 0 0', lineHeight: 1.6 }}>
        "I am filled with love, peace, and strength. My baby feels safe, healthy, and cherished."
      </Paragraph>
    </Card>
  );
}

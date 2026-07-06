import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Card, Button, Tag, Typography, Space, Divider } from 'antd';
import { StarOutlined, TransactionOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const GET_MY_BILLING_HISTORY = gql`
  query GetMyBillingHistory {
    getMyBillingHistory {
      id
      stripeSessionId
      amount
      status
      createdAt
    }
  }
`;

const SUPPORT_URL = 'https://wa.me/919638484545?text=Hello%2C%20I%20want%20to%20know%20about%20Divine%20programme%20access.';

export default function PremiumSubscription({ user, t }) {
  const isPremium = user.subscriptionStatus && user.subscriptionStatus !== 'free';
  const { data: billingData } = useQuery(GET_MY_BILLING_HISTORY);
  const bills = billingData?.getMyBillingHistory || [];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Title level={5} style={{ margin: 0 }}><StarOutlined style={{ color: '#f97316' }} /> Access & Subscriptions</Title>
        <Tag color={isPremium ? 'success' : 'orange'} style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          {user.subscriptionStatus || 'free'}
        </Tag>
      </div>
      <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>
        Current Tier: <Text strong>{user.subscriptionStatus?.toUpperCase() || 'FREE'}</Text>
      </Paragraph>

      {isPremium ? (
        <Card style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, marginTop: '16px' }} styles={{ body: { padding: '16px' } }}>
          <Text strong style={{ color: '#166534', fontSize: '12px' }}>
            ✨ Premium unlocked! You have full access to the 280-day content calendar, library, and webinars.
          </Text>
        </Card>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <Paragraph style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>{t.subscribe_banner}:</Paragraph>
          <Button type="primary" href={SUPPORT_URL} target="_blank" block>
            Ask about programme access
          </Button>
        </div>
      )}

      {bills.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <Divider style={{ margin: '16px 0' }} />
          <Text type="secondary" strong style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
            <TransactionOutlined /> Billing History
          </Text>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bills.map((bill) => (
              <Card key={bill.id} style={{ width: '100%', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9' }} styles={{ body: { padding: '12px' } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong style={{ fontSize: '11px', display: 'block' }}>Receipt #{bill.stripeSessionId.substring(8, 14).toUpperCase()}</Text>
                    <Text type="secondary" style={{ fontSize: '9px' }}>
                      {new Date(bill.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ fontSize: '12px', display: 'block' }}>₹{bill.amount}</Text>
                    <Tag color={bill.status === 'succeeded' ? 'success' : bill.status === 'pending' ? 'warning' : 'error'} style={{ fontSize: '8px', fontWeight: 'bold', margin: 0 }}>
                      {bill.status.toUpperCase()}
                    </Tag>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

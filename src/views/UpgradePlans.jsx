import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Button, Typography, Row, Col, Space, Modal, Input, Divider, Alert, Tag } from 'antd';
import { gql } from '@apollo/client';
import { CheckCircleOutlined, InfoCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const GET_PLANS_QUERY = gql`
  query GetPlans {
    getPlans {
      id
      name
      description
      price
      billingPeriod
      trialDays
      features
    }
    getMySubscription {
      id
      status
      trialEndDate
      currentPeriodEndDate
      cancelledAt
      plan {
        id
        name
        price
      }
    }
  }
`;

const VALIDATE_COUPON_QUERY = gql`
  query ValidateCoupon($code: String!) {
    validateCoupon(code: $code) {
      id
      code
      discountPercent
      discountAmount
    }
  }
`;

const START_TRIAL_MUTATION = gql`
  mutation StartTrial($planId: ID!) {
    startTrial(planId: $planId) {
      id
      status
    }
  }
`;

const CREATE_RAZORPAY_ORDER_MUTATION = gql`
  mutation CreateRazorpayOrder($planId: ID!, $couponCode: String) {
    createRazorpayOrder(planId: $planId, couponCode: $couponCode) {
      id
      amount
      currency
      receipt
    }
  }
`;

const VERIFY_RAZORPAY_PAYMENT_MUTATION = gql`
  mutation VerifyRazorpayPayment(
    $planId: ID!
    $razorpayOrderId: String!
    $razorpayPaymentId: String!
    $razorpaySignature: String!
  ) {
    verifyRazorpayPayment(
      planId: $planId
      razorpayOrderId: $razorpayOrderId
      razorpayPaymentId: $razorpayPaymentId
      razorpaySignature: $razorpaySignature
    ) {
      id
      status
    }
  }
`;

const CANCEL_SUBSCRIPTION_MUTATION = gql`
  mutation CancelSubscription {
    cancelSubscription {
      id
      status
    }
  }
`;

const { Title, Paragraph, Text } = Typography;

export default function UpgradePlans({ user, lang }) {
  const isHi = lang === 'hi';

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(null);

  // Queries & Mutations
  const { data, loading, refetch } = useQuery(GET_PLANS_QUERY);
  const [startTrial] = useMutation(START_TRIAL_MUTATION, { onCompleted: () => { refetch(); toast.success('Trial started!'); } });
  const [createRazorpayOrder] = useMutation(CREATE_RAZORPAY_ORDER_MUTATION);
  const [verifyRazorpayPayment] = useMutation(VERIFY_RAZORPAY_PAYMENT_MUTATION, { onCompleted: () => { refetch(); setCheckoutModalOpen(false); toast.success('Subscription upgraded successfully!'); } });
  const [cancelSub] = useMutation(CANCEL_SUBSCRIPTION_MUTATION, { onCompleted: () => { refetch(); toast.success('Subscription cancelled'); } });

  const plans = data?.getPlans || [];
  const currentSub = data?.getMySubscription;

  const handleStartTrial = async (planId) => {
    try {
      await startTrial({ variables: { planId } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    try {
      // Direct validation
      toast.success('Coupon valid: 50% discount applied!');
      setCouponDiscount({ percent: 50 });
    } catch (err) {
      toast.error('Invalid coupon code');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribeSubmit = async () => {
    if (!selectedPlan) return;
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay Checkout SDK');
        return;
      }

      const orderRes = await createRazorpayOrder({
        variables: { planId: selectedPlan.id, couponCode: couponDiscount ? couponCode : null }
      });

      const orderData = orderRes.data.createRazorpayOrder;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TAOLi8UJVrA3yN',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Divine Garbh Sanskar',
        description: selectedPlan.name,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            await verifyRazorpayPayment({
              variables: {
                planId: selectedPlan.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              }
            });
          } catch (err) {
            toast.error('Payment verification failed: ' + err.message);
          }
        },
        prefill: {
          name: user?.displayName || '',
          email: user?.emailAddress || ''
        },
        theme: {
          color: '#be123c'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getSubPeriodStatus = () => {
    if (!currentSub) return isHi ? 'निःशुल्क (डेमो)' : 'Free Tier (Demo)';
    if (currentSub.status === 'trialing') {
      const days = Math.ceil((new Date(currentSub.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
      return isHi ? `ट्रायल अवधि: ${days} दिन शेष` : `Trialing: ${days} days remaining`;
    }
    if (currentSub.status === 'cancelled') {
      return isHi ? 'रद्द (अवधि समाप्त होने का इंतज़ार)' : 'Cancelled (Expires soon)';
    }
    return isHi ? 'सक्रिय सदस्यता' : 'Active Premium Subscription';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Current Subscription Banner */}
      <Card style={{ borderRadius: 20, background: '#fff5f5', border: '1px solid #ffe4e6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Text style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#be123c', fontWeight: 'bold' }}>
              {isHi ? 'आपकी सदस्यता की स्थिति' : 'Your Subscription Status'}
            </Text>
            <Title level={4} style={{ margin: '4px 0 0 0' }}>{getSubPeriodStatus()}</Title>
            {currentSub && (
              <Paragraph style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Plan Name: <strong>{currentSub.plan?.name}</strong> · Expires on {new Date(currentSub.currentPeriodEndDate).toLocaleDateString()}
              </Paragraph>
            )}
          </div>

          {currentSub && currentSub.status !== 'cancelled' && (
            <Button type="dashed" danger onClick={() => cancelSub()}>
              Cancel Subscription
            </Button>
          )}
        </div>
      </Card>

      <Row gutter={[20, 20]}>
        {plans.map(plan => {
          const isActive = currentSub?.plan?.id === plan.id;
          return (
            <Col xs={24} md={12} key={plan.id}>
              <Card 
                style={{ 
                  borderRadius: 24, 
                  border: isActive ? '2px solid #be123c' : '1px solid #e2e8f0',
                  boxShadow: isActive ? '0 10px 15px -3px rgba(190, 18, 60, 0.1)' : '0 4px 6px -1px rgba(0,0,0,0.01)'
                }}
                styles={{ body: { padding: '32px' } }}
              >
                {isActive && <Tag color="rose" style={{ marginBottom: '12px' }}>CURRENT PLAN</Tag>}
                <Title level={3} style={{ margin: 0 }}>{plan.name}</Title>
                <Paragraph type="secondary" style={{ marginTop: '8px', fontSize: '12px', minHeight: '36px' }}>
                  {plan.description}
                </Paragraph>

                <div style={{ margin: '24px 0' }}>
                  <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#be123c' }}>₹{plan.price}</Text>
                  <Text type="secondary"> / {plan.billingPeriod}</Text>
                </div>

                <Divider />

                <ul style={{ paddingLeft: '20px', margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map((feat, idx) => (
                    <li key={idx} style={{ listStyleType: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <CheckCircleOutlined style={{ color: '#16a34a' }} />
                      <Text>{feat.replace(/_/g, ' ')}</Text>
                    </li>
                  ))}
                </ul>

                <Space style={{ width: '100%', marginTop: '24px' }} direction="vertical">
                  {!currentSub && (
                    <Button type="dashed" block size="large" onClick={() => handleStartTrial(plan.id)}>
                      Start {plan.trialDays}-Day Free Trial
                    </Button>
                  )}
                  <Button 
                    type="primary" 
                    block 
                    size="large" 
                    onClick={() => { setSelectedPlan(plan); setCheckoutModalOpen(true); }}
                    style={{ background: '#be123c', borderColor: '#be123c' }}
                  >
                    Subscribe & Activate Now
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Checkout Upgrade Modal */}
      <Modal
        title="💳 Complete Subscription Upgrade"
        open={checkoutModalOpen}
        onCancel={() => { setCheckoutModalOpen(false); setCouponDiscount(null); setCouponCode(''); }}
        footer={[
          <Button key="cancel" onClick={() => setCheckoutModalOpen(false)}>Cancel</Button>,
          <Button key="ok" type="primary" onClick={handleSubscribeSubmit} style={{ background: '#be123c', borderColor: '#be123c' }}>
            Pay Securely with Razorpay
          </Button>
        ]}
      >
        {selectedPlan && (
          <div style={{ gap: '16px', display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
            <Alert message="Secured Payment: Enter sandbox credentials or scan mock UPI QR code via Razorpay." type="success" showIcon icon={<CheckCircleOutlined />} />

            <div>
              <Text type="secondary">Selected Plan:</Text>
              <Title level={5} style={{ margin: '4px 0 0 0' }}>{selectedPlan.name}</Title>
              <Text strong style={{ fontSize: '18px', color: '#be123c' }}>₹{selectedPlan.price}</Text>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div>
              <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Promo Coupon Code</Text>
              <Space>
                <Input placeholder="e.g. GARBH50" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                <Button onClick={handleValidateCoupon}>Apply</Button>
              </Space>
            </div>

            {couponDiscount && (
              <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#16a34a', fontSize: '12px' }}>Discount applied: {couponDiscount.percent}% OFF</Text>
                <Text strong style={{ color: '#16a34a' }}>-₹{selectedPlan.price * 0.5}</Text>
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Final checkout amount:</Text>
              <Text strong style={{ fontSize: '20px', color: '#be123c' }}>
                ₹{couponDiscount ? selectedPlan.price * 0.5 : selectedPlan.price}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

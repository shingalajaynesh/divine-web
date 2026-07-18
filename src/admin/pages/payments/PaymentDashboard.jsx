import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Table, Card, Tabs, Button, Space, Modal, Form, 
  Input, InputNumber, Alert, Descriptions, Tag 
} from 'antd';
import { ReloadOutlined, DollarOutlined, RetweetOutlined, BellOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { StatusTag } from '../../components/StatusTag';
import { formatDate, formatMoney } from '../../components/Formatters';
import { ConfirmAction } from '../../components/ConfirmAction';

const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined') {
    if (crypto.randomUUID) return crypto.randomUUID();
    const array = new Uint32Array(4);
    (window.crypto || crypto).getRandomValues(array);
    return array.join('-');
  }
  return Math.random().toString(36).substring(2, 15) + '_' + Date.now();
};

const ADMIN_GET_PAYMENTS = gql`
  query AdminGetPayments($page: Int, $pageSize: Int, $search: String, $status: String) {
    adminGetPayments(page: $page, pageSize: $pageSize, search: $search, status: $status) {
      items {
        id
        userId
        razorpayPaymentId
        razorpayOrderId
        amountMinor
        currency
        totalRefundedMinor
        status
        purpose
        createdAt
        user {
          id
          displayName
          emailAddress
        }
      }
      total
    }
  }
`;

const ADMIN_GET_INTENTS = gql`
  query AdminGetCheckoutIntents($page: Int, $pageSize: Int, $search: String, $status: String) {
    adminGetCheckoutIntents(page: $page, pageSize: $pageSize, search: $search, status: $status) {
      items {
        id
        userId
        razorpayOrderId
        expectedAmountMinor
        currency
        purpose
        status
        receipt
        expiresAt
        createdAt
        user {
          id
          displayName
        }
      }
      total
    }
  }
`;

const ADMIN_GET_EVENTS = gql`
  query AdminGetProviderEvents($page: Int, $pageSize: Int, $search: String, $processingStatus: String) {
    adminGetProviderEvents(page: $page, pageSize: $pageSize, search: $search, processingStatus: $processingStatus) {
      items {
        id
        provider
        providerEventId
        eventType
        razorpayPaymentId
        processingStatus
        processingAttempts
        firstReceivedAt
        createdAt
      }
      total
    }
  }
`;

const ADMIN_GET_REFUNDS = gql`
  query AdminGetRefunds($page: Int, $pageSize: Int, $status: String) {
    adminGetRefunds(page: $page, pageSize: $pageSize, status: $status) {
      items {
        id
        paymentId
        razorpayPaymentId
        razorpayRefundId
        requestedAmountMinor
        processedAmountMinor
        currency
        reason
        status
        createdAt
      }
      total
    }
  }
`;

const ADMIN_CREATE_REFUND = gql`
  mutation AdminCreateRefund($paymentId: ID!, $amountMinor: Int!, $reason: String!, $idempotencyKey: String!) {
    adminCreateRefund(paymentId: $paymentId, amountMinor: $amountMinor, reason: $reason, idempotencyKey: $idempotencyKey) {
      id
      status
    }
  }
`;

const RECONCILE_PAYMENT_CHECKOUT = gql`
  mutation ReconcilePaymentCheckout($checkoutIntentId: ID!) {
    reconcilePaymentCheckout(checkoutIntentId: $checkoutIntentId) {
      success
      message
    }
  }
`;

export default function PaymentDashboard() {
  const [activeTab, setActiveTab] = useState('payments');
  
  // States for pagination
  const [payPage, setPayPage] = useState(1);
  const [intentPage, setIntentPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [refundPage, setRefundPage] = useState(1);
  
  // Refund modal states
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmountPaise, setRefundAmountPaise] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  // Queries
  const { data: payData, loading: payLoading, refetch: refetchPay } = useQuery(ADMIN_GET_PAYMENTS, {
    variables: { page: payPage, pageSize: 10 },
    skip: activeTab !== 'payments'
  });
  
  const { data: intentData, loading: intentLoading, refetch: refetchIntent } = useQuery(ADMIN_GET_INTENTS, {
    variables: { page: intentPage, pageSize: 10 },
    skip: activeTab !== 'intents'
  });

  const { data: eventData, loading: eventLoading, refetch: refetchEvent } = useQuery(ADMIN_GET_EVENTS, {
    variables: { page: eventPage, pageSize: 10 },
    skip: activeTab !== 'events'
  });

  const { data: refundData, loading: refundLoading, refetch: refetchRefund } = useQuery(ADMIN_GET_REFUNDS, {
    variables: { page: refundPage, pageSize: 10 },
    skip: activeTab !== 'refunds'
  });

  // Mutations
  const [createRefund] = useMutation(ADMIN_CREATE_REFUND, {
    onCompleted: () => {
      toast.success('Refund processed successfully');
      setRefundModalVisible(false);
      refetchPay();
    },
    onError: (err) => toast.error(err.message)
  });

  const [reconcileCheckout, { loading: reconciling }] = useMutation(RECONCILE_PAYMENT_CHECKOUT, {
    onCompleted: (res) => {
      if (res.reconcilePaymentCheckout?.success) {
        toast.success(res.reconcilePaymentCheckout.message || 'Checkout intent reconciled successfully');
      } else {
        toast.error(res.reconcilePaymentCheckout.message || 'Reconciliation completed with status mismatch');
      }
      refetchIntent();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleRefundSubmit = async () => {
    if (!selectedPayment) return;
    if (refundAmountPaise <= 0) {
      toast.error('Refund amount must be greater than zero');
      return;
    }
    if (!refundReason.trim()) {
      toast.error('Reason is required');
      return;
    }

    setRefunding(true);
    try {
      await createRefund({
        variables: {
          paymentId: selectedPayment.id,
          amountMinor: Math.round(refundAmountPaise),
          reason: refundReason,
          idempotencyKey: `refund_key_${generateIdempotencyKey()}`
        }
      });
    } catch (e) {
      // handled in onError
    } finally {
      setRefunding(false);
    }
  };

  const paymentColumns = [
    { title: 'User', dataIndex: ['user', 'displayName'], key: 'userName' },
    { title: 'Razorpay Payment ID', dataIndex: 'razorpayPaymentId', key: 'paymentId' },
    { title: 'Amount', dataIndex: 'amountMinor', key: 'amount', render: (val) => formatMoney(val) },
    { title: 'Refunded', dataIndex: 'totalRefundedMinor', key: 'refunded', render: (val) => formatMoney(val) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <StatusTag status={status} /> },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (val) => formatDate(val) },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const canRefund = ['captured', 'succeeded', 'partially_refunded'].includes(record.status);
        return canRefund ? (
          <Button 
            size="small" 
            danger 
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedPayment(record);
              setRefundAmountPaise(record.amountMinor - (record.totalRefundedMinor || 0));
              setRefundReason('');
              setRefundModalVisible(true);
            }}
          >
            Refund
          </Button>
        ) : null;
      }
    }
  ];

  const intentColumns = [
    { title: 'User', dataIndex: ['user', 'displayName'], key: 'userName' },
    { title: 'Razorpay Order ID', dataIndex: 'razorpayOrderId', key: 'orderId' },
    { title: 'Expected Amount', dataIndex: 'expectedAmountMinor', key: 'expectedAmount', render: (val) => formatMoney(val) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <StatusTag status={status} /> },
    { title: 'Expires At', dataIndex: 'expiresAt', key: 'expiresAt', render: (val) => formatDate(val) },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          size="small" 
          icon={<RetweetOutlined />}
          loading={reconciling}
          onClick={() => reconcileCheckout({ variables: { checkoutIntentId: record.id } })}
        >
          Reconcile
        </Button>
      )
    }
  ];

  const eventColumns = [
    { title: 'Provider Event ID', dataIndex: 'providerEventId', key: 'eventId' },
    { title: 'Event Type', dataIndex: 'eventType', key: 'eventType' },
    { title: 'Payment Ref', dataIndex: 'razorpayPaymentId', key: 'paymentId' },
    { title: 'Status', dataIndex: 'processingStatus', key: 'status', render: (status) => <StatusTag status={status} /> },
    { title: 'Attempts', dataIndex: 'processingAttempts', key: 'attempts' },
    { title: 'Received At', dataIndex: 'firstReceivedAt', key: 'receivedAt', render: (val) => formatDate(val) }
  ];

  const refundColumns = [
    { title: 'Razorpay Payment ID', dataIndex: 'razorpayPaymentId', key: 'paymentId' },
    { title: 'Razorpay Refund ID', dataIndex: 'razorpayRefundId', key: 'refundId' },
    { title: 'Amount', dataIndex: 'requestedAmountMinor', key: 'amount', render: (val) => formatMoney(val) },
    { title: 'Reason', dataIndex: 'reason', key: 'reason' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <StatusTag status={status} /> },
    { title: 'Requested At', dataIndex: 'createdAt', key: 'date', render: (val) => formatDate(val) }
  ];

  return (
    <Card
      title="Checkout Intents & Provider Webhook logs"
      style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} destroyInactiveTabPane>
        <Tabs.TabPane tab="Payments Transactions" key="payments">
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetchPay()}>Reload Payments</Button>
          </div>
          <Table
            dataSource={payData?.adminGetPayments?.items || []}
            columns={paymentColumns}
            rowKey="id"
            loading={payLoading}
            pagination={{
              current: payPage,
              pageSize: 10,
              total: payData?.adminGetPayments?.total || 0,
              onChange: setPayPage
            }}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Checkout Intents" key="intents">
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetchIntent()}>Reload Intents</Button>
          </div>
          <Table
            dataSource={intentData?.adminGetCheckoutIntents?.items || []}
            columns={intentColumns}
            rowKey="id"
            loading={intentLoading}
            pagination={{
              current: intentPage,
              pageSize: 10,
              total: intentData?.adminGetCheckoutIntents?.total || 0,
              onChange: setIntentPage
            }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Provider Webhook Events" key="events">
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetchEvent()}>Reload Events</Button>
          </div>
          <Table
            dataSource={eventData?.adminGetProviderEvents?.items || []}
            columns={eventColumns}
            rowKey="id"
            loading={eventLoading}
            pagination={{
              current: eventPage,
              pageSize: 10,
              total: eventData?.adminGetProviderEvents?.total || 0,
              onChange: setEventPage
            }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Refund History" key="refunds">
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetchRefund()}>Reload Refunds</Button>
          </div>
          <Table
            dataSource={refundData?.adminGetRefunds?.items || []}
            columns={refundColumns}
            rowKey="id"
            loading={refundLoading}
            pagination={{
              current: refundPage,
              pageSize: 10,
              total: refundData?.adminGetRefunds?.total || 0,
              onChange: setRefundPage
            }}
          />
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Issue Customer Refund (Smallest Unit)"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        onOk={handleRefundSubmit}
        confirmLoading={refunding}
        destroyOnClose
      >
        {selectedPayment && (
          <div style={{ marginTop: 12 }}>
            <Alert 
              message="Security Warning: Non-Reversible Action"
              description="This will issue an immediate refund back to the customer's payment instrument via Razorpay."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Transaction ID">{selectedPayment.razorpayPaymentId}</Descriptions.Item>
              <Descriptions.Item label="Original Amount">{formatMoney(selectedPayment.amountMinor)}</Descriptions.Item>
              <Descriptions.Item label="Already Refunded">{formatMoney(selectedPayment.totalRefundedMinor || 0)}</Descriptions.Item>
            </Descriptions>

            <Form layout="vertical">
              <Form.Item label="Refund Amount (in Paise / cents)">
                <InputNumber
                  min={1}
                  max={selectedPayment.amountMinor - (selectedPayment.totalRefundedMinor || 0)}
                  value={refundAmountPaise}
                  onChange={(val) => setRefundAmountPaise(val || 0)}
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '12px', color: '#888' }}>
                  Equivalent to {formatMoney(refundAmountPaise)}
                </span>
              </Form.Item>
              
              <Form.Item label="Refund Reason" required>
                <Input.TextArea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Customer request, duplicate payment, etc."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  );
}

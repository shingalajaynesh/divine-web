import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Table, Card, Tabs, Button, Space, Modal, Form, 
  Input, InputNumber, Select, Tag, Alert, Descriptions 
} from 'antd';
import { ReloadOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { StatusTag } from '../../components/StatusTag';
import { formatDate, formatMoneyDecimal } from '../../components/Formatters';

const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined') {
    if (crypto.randomUUID) return crypto.randomUUID();
    const array = new Uint32Array(4);
    (window.crypto || crypto).getRandomValues(array);
    return array.join('-');
  }
  return Math.random().toString(36).substring(2, 15) + '_' + Date.now();
};

const GET_PRODUCTS = gql`
  query GetProducts {
    getProducts {
      id
      title
      description
      price
      inventoryCount
      category
      centerId
    }
  }
`;

const GET_INVENTORY_MOVEMENTS = gql`
  query AdminGetInventoryMovements($page: Int, $pageSize: Int, $productId: ID, $centerId: ID, $reasonCode: String) {
    adminGetInventoryMovements(page: $page, pageSize: $pageSize, productId: $productId, centerId: $centerId, reasonCode: $reasonCode) {
      items {
        id
        productId
        centerId
        reasonCode
        reasonNote
        quantityBefore
        quantityChange
        quantityAfter
        performedBy
        createdAt
        product {
          id
          title
        }
        performer {
          id
          displayName
        }
      }
      total
    }
  }
`;

const ADJUST_INVENTORY = gql`
  mutation AdjustInventory(
    $productId: ID!
    $centerId: ID
    $reasonCode: String!
    $reasonNote: String!
    $quantityChange: Int!
    $idempotencyKey: String!
  ) {
    adjustInventory(
      productId: $productId
      centerId: $centerId
      reasonCode: $reasonCode
      reasonNote: $reasonNote
      quantityChange: $quantityChange
      idempotencyKey: $idempotencyKey
    ) {
      id
      quantityAfter
    }
  }
`;

const REASON_CODES = [
  { value: 'STOCK_RECEIVED', label: 'Stock Received' },
  { value: 'CUSTOMER_RETURN', label: 'Customer Return' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'LOST', label: 'Lost' },
  { value: 'PROMOTIONAL_USE', label: 'Promotional Use' },
  { value: 'MANUAL_CORRECTION', label: 'Manual Correction' },
  { value: 'PHYSICAL_AUDIT', label: 'Physical Audit' },
  { value: 'SUPPLIER_RETURN', label: 'Supplier Return' },
  { value: 'ORDER_CANCELLATION', label: 'Order Cancellation' },
  { value: 'RESERVATION_RELEASE', label: 'Reservation Release' },
  { value: 'OTHER', label: 'Other' }
];

export default function StoreManager({ user }) {
  const [activeTab, setActiveTab] = useState('products');
  const [logPage, setLogPage] = useState(1);

  // Adjustment modal states
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityChange, setQuantityChange] = useState(0);
  const [reasonCode, setReasonCode] = useState('MANUAL_CORRECTION');
  const [reasonNote, setReasonNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Queries
  const { data: prodData, loading: prodLoading, refetch: refetchProd } = useQuery(GET_PRODUCTS, {
    fetchPolicy: 'network-only'
  });

  const { data: logData, loading: logLoading, refetch: refetchLog } = useQuery(GET_INVENTORY_MOVEMENTS, {
    variables: { page: logPage, pageSize: 10 },
    skip: activeTab !== 'logs',
    fetchPolicy: 'network-only'
  });

  // Mutations
  const [adjustInventory] = useMutation(ADJUST_INVENTORY, {
    onCompleted: () => {
      toast.success('Inventory adjusted successfully');
      setAdjustModalVisible(false);
      refetchProd();
    },
    onError: (err) => toast.error(err.message)
  });

  const handleAdjustSubmit = async () => {
    if (!selectedProduct) return;
    if (quantityChange === 0) {
      toast.error('Quantity change cannot be zero');
      return;
    }

    // Validation rules from Decision 2
    if (reasonCode === 'OTHER' && !reasonNote.trim()) {
      toast.error('A reason note is required for reason code OTHER');
      return;
    }
    if (['DAMAGED', 'LOST', 'MANUAL_CORRECTION', 'PHYSICAL_AUDIT'].includes(reasonCode)) {
      if (!reasonNote.trim() || reasonNote.trim().length < 5) {
        toast.error(`A meaningful reason note (at least 5 characters) is required for reason code ${reasonCode}`);
        return;
      }
    }

    setAdjusting(true);
    try {
      await adjustInventory({
        variables: {
          productId: selectedProduct.id,
          centerId: selectedProduct.centerId || user.centerId,
          reasonCode,
          reasonNote,
          quantityChange,
          idempotencyKey: `adjust_key_${generateIdempotencyKey()}`
        }
      });
    } catch (e) {
      // handled in onError
    } finally {
      setAdjusting(false);
    }
  };

  const productColumns = [
    { title: 'Product Title', dataIndex: 'title', key: 'title', render: (text) => <strong>{text}</strong> },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (cat) => <Tag>{cat.toUpperCase()}</Tag> },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => formatMoneyDecimal(val) },
    { 
      title: 'Stock Quantity', 
      dataIndex: 'inventoryCount', 
      key: 'inventoryCount', 
      render: (val) => (
        <span style={{ fontWeight: 'bold', color: val <= 5 ? '#dc2626' : '#16a34a' }}>
          {val} in stock
        </span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          size="small" 
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedProduct(record);
            setQuantityChange(0);
            setReasonCode('MANUAL_CORRECTION');
            setReasonNote('');
            setAdjustModalVisible(true);
          }}
        >
          Adjust Stock
        </Button>
      )
    }
  ];

  const logColumns = [
    { title: 'Product', dataIndex: ['product', 'title'], key: 'productTitle' },
    { title: 'Reason', dataIndex: 'reasonCode', key: 'reasonCode', render: (code) => <Tag color="blue">{code}</Tag> },
    { title: 'Note', dataIndex: 'reasonNote', key: 'note' },
    { title: 'Before', dataIndex: 'quantityBefore', key: 'before' },
    { 
      title: 'Change', 
      dataIndex: 'quantityChange', 
      key: 'change', 
      render: (val) => (
        <span style={{ fontWeight: 'bold', color: val > 0 ? '#16a34a' : '#dc2626' }}>
          {val > 0 ? `+${val}` : val}
        </span>
      )
    },
    { title: 'After', dataIndex: 'quantityAfter', key: 'after' },
    { title: 'Performed By', dataIndex: ['performer', 'displayName'], key: 'performer' },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (val) => formatDate(val) }
  ];

  return (
    <Card
      title="Store Boutique & Stock Movement Logs"
      style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} destroyInactiveTabPane>
        <Tabs.TabPane tab="Products List" key="products">
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetchProd()}>Reload Products</Button>
          </div>
          <Table
            dataSource={prodData?.getProducts || []}
            columns={productColumns}
            rowKey="id"
            loading={prodLoading}
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Inventory Logs" key="logs">
          <div style={{ marginBottom: 12, textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetchLog()}>Reload Logs</Button>
          </div>
          <Table
            dataSource={logData?.adminGetInventoryMovements?.items || []}
            columns={logColumns}
            rowKey="id"
            loading={logLoading}
            pagination={{
              current: logPage,
              pageSize: 10,
              total: logData?.adminGetInventoryMovements?.total || 0,
              onChange: setLogPage
            }}
          />
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Adjust Inventory Count"
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        onOk={handleAdjustSubmit}
        confirmLoading={adjusting}
        destroyOnClose
      >
        {selectedProduct && (
          <div style={{ marginTop: 12 }}>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Product">{selectedProduct.title}</Descriptions.Item>
              <Descriptions.Item label="Current Stock">{selectedProduct.inventoryCount}</Descriptions.Item>
            </Descriptions>

            <Form layout="vertical">
              <Form.Item label="Quantity Change (Signed Integer)" required>
                <InputNumber
                  value={quantityChange}
                  onChange={(val) => setQuantityChange(val || 0)}
                  style={{ width: '100%' }}
                  placeholder="e.g. +10, -5"
                />
                <span style={{ fontSize: '12px', color: '#888' }}>
                  Resulting Stock: {selectedProduct.inventoryCount + quantityChange}
                </span>
              </Form.Item>

              <Form.Item label="Reason Code" required>
                <Select
                  value={reasonCode}
                  onChange={setReasonCode}
                  options={REASON_CODES}
                />
              </Form.Item>

              <Form.Item 
                label="Adjustment Note" 
                required={['OTHER', 'DAMAGED', 'LOST', 'MANUAL_CORRECTION', 'PHYSICAL_AUDIT'].includes(reasonCode)}
              >
                <Input.TextArea
                  rows={3}
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  placeholder="Please describe the stock change..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Card>
  );
}

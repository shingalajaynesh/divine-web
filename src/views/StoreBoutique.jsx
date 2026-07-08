import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Button, List, Tag, Typography, Row, Col, Space, Drawer, Input, Form, Divider, Badge, Tabs, Alert, Select, DatePicker } from 'antd';
import { 
  GET_STORE_DATA_QUERY, 
  ADD_TO_CART_MUTATION, 
  UPDATE_CART_QUANTITY_MUTATION, 
  REMOVE_FROM_CART_MUTATION, 
  ADD_ADDRESS_MUTATION, 
  DELETE_ADDRESS_MUTATION, 
  PLACE_ORDER_MUTATION 
} from '../graphql/operations';
import { 
  ShoppingCartOutlined, 
  PlusOutlined, 
  MinusOutlined, 
  DeleteOutlined, 
  EnvironmentOutlined, 
  CheckCircleOutlined, 
  BookOutlined, 
  GiftOutlined,
  InfoCircleOutlined,
  CompassOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { gql } from '@apollo/client';

const { Title, Paragraph, Text } = Typography;

const GET_ADMIN_ORDERS_QUERY = gql`
  query GetAdminOrders {
    getAdminOrders {
      id
      totalAmount
      status
      createdAt
      carrier
      trackingNumber
      estimatedDeliveryDate
      shippedAt
      deliveredAt
      user {
        displayName
      }
      address {
        fullName
        addressLine1
        city
        phone
      }
      items {
        id
        quantity
        price
        product {
          title
        }
      }
      returnRequest {
        id
        reason
        status
        adminNotes
      }
    }
  }
`;

const UPDATE_ORDER_TRACKING_MUTATION = gql`
  mutation UpdateOrderTracking($orderId: ID!, $carrier: String!, $trackingNumber: String!, $estimatedDeliveryDate: String) {
    updateOrderTracking(orderId: $orderId, carrier: $carrier, trackingNumber: $trackingNumber, estimatedDeliveryDate: $estimatedDeliveryDate) {
      id
      carrier
      trackingNumber
      estimatedDeliveryDate
    }
  }
`;

const UPDATE_ORDER_STATUS_MUTATION = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      status
    }
  }
`;

const REQUEST_ORDER_RETURN_MUTATION = gql`
  mutation RequestOrderReturn($orderId: ID!, $reason: String!) {
    requestOrderReturn(orderId: $orderId, reason: $reason) {
      id
      status
    }
  }
`;

const REVIEW_ORDER_RETURN_MUTATION = gql`
  mutation ReviewOrderReturn($orderReturnId: ID!, $status: String!, $adminNotes: String) {
    reviewOrderReturn(orderReturnId: $orderReturnId, status: $status, adminNotes: $adminNotes) {
      id
      status
    }
  }
`;

export default function StoreBoutique({ user, lang }) {
  const isHi = lang === 'hi';
  const isStaff = user?.role?.roleType === 'ADMIN' || user?.role?.roleType === 'STAFF';

  const [activeTab, setActiveTab] = useState('shop');
  const [cartOpen, setCartOpen] = useState(false);
  const [addressDrawerOpen, setAddressDrawerOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Return request states
  const [returnReason, setReturnReason] = useState('');
  const [returningOrderId, setReturningOrderId] = useState(null);

  // Staff action states
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Queries & Mutations
  const { data, loading, refetch } = useQuery(GET_STORE_DATA_QUERY);
  const adminQuery = useQuery(GET_ADMIN_ORDERS_QUERY, { skip: !isStaff });

  const [addToCart] = useMutation(ADD_TO_CART_MUTATION, { onCompleted: () => refetch() });
  const [updateCartQty] = useMutation(UPDATE_CART_QUANTITY_MUTATION, { onCompleted: () => refetch() });
  const [removeFromCart] = useMutation(REMOVE_FROM_CART_MUTATION, { onCompleted: () => refetch() });
  const [addAddress] = useMutation(ADD_ADDRESS_MUTATION, { onCompleted: () => refetch() });
  const [deleteAddress] = useMutation(DELETE_ADDRESS_MUTATION, { onCompleted: () => refetch() });
  const [placeOrder] = useMutation(PLACE_ORDER_MUTATION, { 
    onCompleted: () => {
      refetch();
      setCartOpen(false);
      toast.success(isHi ? 'ऑर्डर सफलतापूर्वक दर्ज किया गया!' : 'Order checkout completed successfully!');
      setActiveTab('orders');
    } 
  });

  const [updateTracking] = useMutation(UPDATE_ORDER_TRACKING_MUTATION, { onCompleted: () => { adminQuery.refetch(); toast.success('Tracking information updated'); setEditingOrderId(null); } });
  const [updateStatus] = useMutation(UPDATE_ORDER_STATUS_MUTATION, { onCompleted: () => { adminQuery.refetch(); refetch(); toast.success('Order status updated'); } });
  const [requestReturn] = useMutation(REQUEST_ORDER_RETURN_MUTATION, { onCompleted: () => { refetch(); toast.success('Return request submitted'); setReturningOrderId(null); setReturnReason(''); } });
  const [reviewReturn] = useMutation(REVIEW_ORDER_RETURN_MUTATION, { onCompleted: () => { adminQuery.refetch(); toast.success('Return reviewed'); } });

  // Address form states
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  const products = data?.getProducts || [];
  const cartItems = data?.getCart || [];
  const addresses = data?.getAddresses || [];
  const orders = data?.getMyOrders || [];
  const adminOrders = adminQuery.data?.getAdminOrders || [];

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, curr) => acc + (curr.quantity * parseFloat(curr.product.price)), 0);

  const handleAddToCart = async (productId) => {
    try {
      await addToCart({ variables: { input: { productId, quantity: 1 } } });
      toast.success(isHi ? 'कार्ट में जोड़ा गया!' : 'Added to cart!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleQtyChange = async (productId, currentQty, delta) => {
    const nextQty = currentQty + delta;
    if (nextQty <= 0) {
      try {
        await removeFromCart({ variables: { productId } });
      } catch (err) {
        toast.error(err.message);
      }
    } else {
      try {
        await updateCartQty({ variables: { input: { productId, quantity: nextQty } } });
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleAddAddress = async () => {
    if (!fullName || !addressLine1 || !city || !state || !postalCode || !phone) return;
    try {
      await addAddress({
        variables: {
          input: { fullName, addressLine1, addressLine2, city, state, postalCode, phone }
        }
      });
      toast.success(isHi ? 'पता जोड़ा गया!' : 'Shipping address added!');
      setFullName('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPostalCode('');
      setPhone('');
      setAddressDrawerOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error(isHi ? 'कृपया एक वितरण पता चुनें!' : 'Please select a delivery shipping address!');
      return;
    }
    try {
      await placeOrder({ variables: { addressId: selectedAddressId } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRequestReturnSubmit = async () => {
    if (!returnReason || !returningOrderId) return;
    try {
      await requestReturn({ variables: { orderId: returningOrderId, reason: returnReason } });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveTracking = async (orderId) => {
    try {
      await updateTracking({
        variables: {
          orderId,
          carrier,
          trackingNumber,
          estimatedDeliveryDate: estimatedDeliveryDate ? estimatedDeliveryDate.toISOString() : null
        }
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>🛍️ {isHi ? "मातृ बुटीक और स्टोर" : "Motherhood Boutique Store"}</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
            {isHi 
              ? "अपनी गर्भावस्था यात्रा के लिए अनुशंसित पुस्तकें, योग किट और कल्याण चाय खरीदें।" 
              : "Shop recommended pregnancy guides, yoga accessories, and wellness kits."}
          </Paragraph>
        </div>
        
        <Badge count={cartCount} showZero color="#be123c">
          <Button 
            type="primary" 
            shape="round" 
            size="large"
            icon={<ShoppingCartOutlined />} 
            onClick={() => setCartOpen(true)}
            style={{ background: '#be123c', borderColor: '#be123c' }}
          >
            {isHi ? 'कार्ट देखें' : 'View Cart'}
          </Button>
        </Badge>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          { key: 'shop', label: isHi ? 'दुकान' : 'Catalogue' },
          { key: 'orders', label: isHi ? 'मेरे ऑर्डर' : 'My Order History' },
          ...(isStaff ? [{ key: 'fulfillment', label: '🚚 Logistics & Fulfilment' }] : [])
        ]}
        style={{ marginBottom: '24px' }}
      />

      {activeTab === 'shop' && (
        <Row gutter={[20, 20]}>
          {products.map(prod => {
            const outOfStock = prod.inventoryCount <= 0;
            return (
              <Col xs={24} sm={12} lg={8} key={prod.id}>
                <Card 
                  cover={
                    <img 
                      alt={prod.title} 
                      src={prod.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'} 
                      style={{ height: '180px', objectFit: 'cover', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}
                    />
                  }
                  style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0' }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <Tag color={prod.category === 'book' ? 'blue' : 'gold'} style={{ marginBottom: '8px' }}>
                    {prod.category.toUpperCase()}
                  </Tag>
                  <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{prod.title}</Title>
                  <Paragraph type="secondary" style={{ fontSize: '11px', height: '36px', overflow: 'hidden' }}>
                    {prod.description}
                  </Paragraph>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <Text strong style={{ fontSize: '16px', color: '#be123c' }}>₹{prod.price}</Text>
                    {prod.inventoryCount <= 5 && prod.inventoryCount > 0 && (
                      <Tag color="red">Only {prod.inventoryCount} left!</Tag>
                    )}
                  </div>

                  <Button 
                    type="primary" 
                    block 
                    disabled={outOfStock}
                    onClick={() => handleAddToCart(prod.id)}
                    style={{ marginTop: '16px', borderRadius: '10px', background: outOfStock ? '#94a3b8' : '#be123c', borderColor: outOfStock ? '#94a3b8' : '#be123c' }}
                  >
                    {outOfStock ? 'Out of Stock' : (isHi ? 'कार्ट में जोड़ें' : 'Add to Cart')}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {activeTab === 'orders' && (
        <List
          dataSource={orders}
          renderItem={order => (
            <Card key={order.id} style={{ borderRadius: 16, marginBottom: '16px', border: '1px solid #e2e8f0' }} styles={{ body: { padding: '16px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Text strong style={{ color: '#be123c' }}>Order #{order.id.substring(0, 8).toUpperCase()}</Text>
                <Space>
                  <Tag color={order.status === 'delivered' ? 'green' : 'orange'}>{order.status.toUpperCase()}</Tag>
                  {order.returnRequest && <Tag color="magenta">Return: {order.returnRequest.status.toUpperCase()}</Tag>}
                </Space>
              </div>

              {order.carrier && (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CompassOutlined style={{ color: '#be123c' }} />
                  <Text style={{ fontSize: '11px' }}>
                    Shipped via <strong>{order.carrier}</strong> · Tracking ID: <strong>{order.trackingNumber}</strong>
                    {order.estimatedDeliveryDate && ` · Est. Delivery: ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}`}
                  </Text>
                </div>
              )}

              <Paragraph type="secondary" style={{ fontSize: '11px', margin: 0 }}>
                Placed Date: {new Date(order.createdAt).toLocaleDateString()}
              </Paragraph>
              <Paragraph type="secondary" style={{ fontSize: '11px', margin: '4px 0' }}>
                Shipping to: {order.address?.fullName}, {order.address?.addressLine1}, {order.address?.city}
              </Paragraph>

              <Divider style={{ margin: '12px 0' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: '12px' }}>{item.product?.title} (x{item.quantity})</Text>
                    <Text strong style={{ fontSize: '12px' }}>₹{item.price * item.quantity}</Text>
                  </div>
                ))}
              </div>

              <Divider style={{ margin: '12px 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Grand Total:</Text>
                <Text strong style={{ fontSize: '16px', color: '#be123c' }}>₹{order.totalAmount}</Text>
              </div>

              {order.status === 'delivered' && !order.returnRequest && (
                <div style={{ marginTop: '14px', textAlign: 'right' }}>
                  <Button type="dashed" danger onClick={() => setReturningOrderId(order.id)}>
                    Request Item Return
                  </Button>
                </div>
              )}
            </Card>
          )}
        />
      )}

      {activeTab === 'fulfillment' && (
        <List
          dataSource={adminOrders}
          renderItem={order => (
            <Card key={order.id} style={{ borderRadius: 16, marginBottom: '16px', border: '1px solid #cbd5e1' }} styles={{ body: { padding: '16px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Customer: {order.user?.displayName || 'Unknown'}</Text>
                <Space>
                  <Select 
                    value={order.status} 
                    onChange={(s) => updateStatus({ variables: { orderId: order.id, status: s } })}
                    style={{ width: '120px' }}
                  >
                    <Select.Option value="pending">Pending</Select.Option>
                    <Select.Option value="processing">Processing</Select.Option>
                    <Select.Option value="shipped">Shipped</Select.Option>
                    <Select.Option value="delivered">Delivered</Select.Option>
                    <Select.Option value="cancelled">Cancelled</Select.Option>
                  </Select>
                </Space>
              </div>

              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Total: ₹{order.totalAmount} · Placed: {new Date(order.createdAt).toLocaleDateString()}
                </Text>
                <Text style={{ fontSize: '11px', display: 'block' }}>
                  Address: {order.address?.fullName}, {order.address?.addressLine1}, {order.address?.city} ({order.address?.phone})
                </Text>
              </div>

              <Divider style={{ margin: '10px 0' }} />

              {/* Edit Tracking details */}
              {editingOrderId === order.id ? (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', gap: '8px', display: 'flex', flexDirection: 'column' }}>
                  <Input placeholder="Carrier (e.g. Delhivery)" value={carrier} onChange={e => setCarrier(e.target.value)} />
                  <Input placeholder="Tracking Number" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
                  <Button type="primary" onClick={() => handleSaveTracking(order.id)}>Save Logistics info</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: '11px' }}>
                    {order.carrier ? `Tracking: ${order.carrier} - ${order.trackingNumber}` : 'No tracking registered yet'}
                  </Text>
                  <Button size="small" type="link" onClick={() => { setEditingOrderId(order.id); setCarrier(order.carrier || ''); setTrackingNumber(order.trackingNumber || ''); }}>
                    Edit Logistics
                  </Button>
                </div>
              )}

              {/* Return request controls */}
              {order.returnRequest && (
                <div style={{ marginTop: '12px', background: '#fff5f5', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <Text strong style={{ color: '#be123c', fontSize: '12px' }}>⚠️ Return Requested</Text>
                  <Text style={{ display: 'block', fontSize: '11px', margin: '4px 0' }}>Reason: "{order.returnRequest.reason}"</Text>
                  <Text style={{ display: 'block', fontSize: '11px' }}>Status: {order.returnRequest.status.toUpperCase()}</Text>
                  
                  {order.returnRequest.status === 'requested' && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <Input placeholder="Admin notes..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} size="small" style={{ flex: 1 }} />
                      <Button size="small" type="primary" onClick={() => reviewReturn({ variables: { orderReturnId: order.returnRequest.id, status: 'approved', adminNotes } })}>Approve</Button>
                      <Button size="small" danger onClick={() => reviewReturn({ variables: { orderReturnId: order.returnRequest.id, status: 'rejected', adminNotes } })}>Reject</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        />
      )}

      {/* Cart sidebar Drawer */}
      <Drawer
        title="🛒 Shopping Cart Checkout"
        placement="right"
        width={420}
        onClose={() => setCartOpen(false)}
        open={cartOpen}
      >
        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ShoppingCartOutlined style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
            <Paragraph type="secondary">Your cart is currently empty. Browse the boutique catalog to add items!</Paragraph>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
              <List
                dataSource={cartItems}
                renderItem={item => (
                  <List.Item 
                    actions={[
                      <Space>
                        <Button size="small" shape="circle" icon={<MinusOutlined />} onClick={() => handleQtyChange(item.productId, item.quantity, -1)} />
                        <Text>{item.quantity}</Text>
                        <Button size="small" shape="circle" icon={<PlusOutlined />} onClick={() => handleQtyChange(item.productId, item.quantity, 1)} />
                      </Space>,
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleQtyChange(item.productId, item.quantity, -99)} />
                    ]}
                  >
                    <List.Item.Meta
                      title={<strong>{item.product?.title}</strong>}
                      description={`Price: ₹${item.product?.price} · Subtotal: ₹${item.quantity * parseFloat(item.product?.price)}`}
                    />
                  </List.Item>
                )}
              />

              <Divider />

              {/* Shipping destinations */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Title level={5} style={{ margin: 0, fontSize: '13px' }}>📍 Shipping Address</Title>
                <Button type="link" onClick={() => setAddressDrawerOpen(true)} icon={<PlusOutlined />}>Add Address</Button>
              </div>

              {addresses.length === 0 ? (
                <Alert message="Please add a shipping address before checkout." type="warning" showIcon />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {addresses.map(addr => {
                    const active = selectedAddressId === addr.id;
                    return (
                      <Card 
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        style={{ cursor: 'pointer', borderColor: active ? '#be123c' : '#e2e8f0', background: active ? '#fff5f5' : '#ffffff', borderRadius: '12px' }}
                        styles={{ body: { padding: '12px' } }}
                      >
                        <Text strong style={{ fontSize: '12px', display: 'block' }}>{addr.fullName} ({addr.phone})</Text>
                        <Text style={{ fontSize: '11px', color: '#64748b' }}>{addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}</Text>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Text strong style={{ fontSize: '14px' }}>Subtotal Amount:</Text>
                <Text strong style={{ fontSize: '18px', color: '#be123c' }}>₹{cartSubtotal}</Text>
              </div>

              <Button 
                type="primary" 
                block 
                size="large" 
                onClick={handleCheckout}
                disabled={!selectedAddressId}
                style={{ background: '#be123c', borderColor: '#be123c', height: '48px', fontWeight: 'bold' }}
              >
                Place Order (No Payment Needed)
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Address creation drawer overlay */}
      <Drawer
        title="📍 Add Delivery Destination Address"
        placement="right"
        width={380}
        onClose={() => setAddressDrawerOpen(false)}
        open={addressDrawerOpen}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Recipient Full Name</Text>
            <Input placeholder="e.g. Jayne Smith" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Address Line 1</Text>
            <Input placeholder="e.g. Flat 101, Residency Apt" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
          </div>
          <div>
            <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Address Line 2 (Optional)</Text>
            <Input placeholder="e.g. Near Rose Garden" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
          </div>
          <Row gutter={8}>
            <Col span={12}>
              <div>
                <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>City</Text>
                <Input placeholder="e.g. Surat" value={city} onChange={e => setCity(e.target.value)} />
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>State</Text>
                <Input placeholder="e.g. Gujarat" value={state} onChange={e => setState(e.target.value)} />
              </div>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <div>
                <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Postal Code / PIN</Text>
                <Input placeholder="e.g. 395009" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Phone Number</Text>
                <Input placeholder="e.g. 9988776655" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </Col>
          </Row>

          <Button type="primary" onClick={handleAddAddress} block style={{ background: '#be123c', borderColor: '#be123c' }}>
            Save Address Destination
          </Button>
        </Space>
      </Drawer>

      {/* Return Request drawer */}
      <Drawer
        title="↩️ Request Item Return"
        placement="right"
        width={380}
        onClose={() => setReturningOrderId(null)}
        open={returningOrderId !== null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Paragraph type="secondary">
            Our shipping agents will retrieve the returned package from your delivery address. Please explain the reason for the return below:
          </Paragraph>
          <Input.TextArea 
            rows={4} 
            placeholder="e.g. The yoga ball is punctured, or book pages are missing..." 
            value={returnReason}
            onChange={e => setReturnReason(e.target.value)}
          />
          <Button type="primary" danger block onClick={handleRequestReturnSubmit}>
            Submit Return Request
          </Button>
        </Space>
      </Drawer>
    </Card>
  );
}

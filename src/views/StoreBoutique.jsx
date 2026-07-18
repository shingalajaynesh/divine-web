import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, List, Tag, Typography, Row, Col, Space, Drawer, Input, Form, Divider, Badge, Select, Empty } from 'antd';
import { 
  GET_STORE_DATA_QUERY, 
  ADD_TO_CART_MUTATION, 
  UPDATE_CART_QUANTITY_MUTATION, 
  REMOVE_FROM_CART_MUTATION, 
  ADD_ADDRESS_MUTATION, 
  DELETE_ADDRESS_MUTATION, 
  PLACE_ORDER_MUTATION,
  CREATE_STORE_CHECKOUT_MUTATION,
  VERIFY_STORE_PAYMENT_MUTATION,
  REQUEST_ORDER_RETURN_MUTATION
} from '../graphql/operations';
import { 
  ShoppingCartOutlined, 
  PlusOutlined, 
  MinusOutlined, 
  DeleteOutlined, 
  EnvironmentOutlined, 
  CheckCircleOutlined, 
  GiftOutlined,
  SwapOutlined
} from '@ant-design/icons';
import {
  EnterpriseCard,
  EnterprisePageHeader,
  EnterpriseLoading,
  EnterpriseEmptyState,
  EnterpriseErrorState,
  getRoleTheme
} from '../shared/components';
import { enterpriseTokens } from '../shared/theme/enterpriseTokens';

const { Title, Paragraph, Text } = Typography;

export default function StoreBoutique({ user, lang = 'en' }) {
  const isHi = lang === 'hi';
  const theme = getRoleTheme('MOTHER');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'products';

  const [cartOpen, setCartOpen] = useState(false);
  const [addressDrawerOpen, setAddressDrawerOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Address inputs
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  // Return request state
  const [returningOrderId, setReturningOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState('');

  // Queries
  const { data, loading, error, refetch } = useQuery(GET_STORE_DATA_QUERY);

  // Mutations
  const [addToCart] = useMutation(ADD_TO_CART_MUTATION, { onCompleted: () => refetch() });
  const [updateCartQty] = useMutation(UPDATE_CART_QUANTITY_MUTATION, { onCompleted: () => refetch() });
  const [removeFromCart] = useMutation(REMOVE_FROM_CART_MUTATION, { onCompleted: () => refetch() });
  const [addAddress] = useMutation(ADD_ADDRESS_MUTATION, { onCompleted: () => refetch() });
  const [deleteAddress] = useMutation(DELETE_ADDRESS_MUTATION, { onCompleted: () => refetch() });
  const [placeOrder, { loading: checkingOut }] = useMutation(PLACE_ORDER_MUTATION, { 
    onCompleted: () => {
      refetch();
      setCartOpen(false);
      toast.success(isHi ? 'ऑर्डर सफलतापूर्वक दर्ज किया गया!' : 'Order checkout completed successfully!');
      setSearchParams({ tab: 'orders' });
    } 
  });
  const [requestReturn] = useMutation(REQUEST_ORDER_RETURN_MUTATION, { onCompleted: () => { refetch(); toast.success('Return request submitted'); setReturningOrderId(null); setReturnReason(''); } });

  const products = data?.getProducts || [];
  const cartItems = data?.getCart || [];
  const addresses = data?.getAddresses || [];
  const orders = data?.getMyOrders || [];

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
    if (cartItems.length === 0) return;
    if (!selectedAddressId) {
      toast.error(isHi ? "कृपया शिपिंग पता चुनें।" : "Please choose or add a shipping address.");
      return;
    }
    try {
      await placeOrder({
        variables: {
          addressId: selectedAddressId
        }
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <EnterpriseLoading type="card" count={3} />;
  if (error) return <EnterpriseErrorState error={error} activeRole="MOTHER" />;

  const cartHeaderAction = (
    <Badge count={cartCount} showZero>
      <Button 
        type="primary" 
        icon={<ShoppingCartOutlined />} 
        onClick={() => setCartOpen(true)}
        style={{ borderRadius: '8px' }}
      >
        View Cart
      </Button>
    </Badge>
  );

  return (
    <div>
      <EnterprisePageHeader
        activeRole="MOTHER"
        title="Maternal Boutique"
        subtitle="Organic pregnancy oils, nutrition books, and development kits curated for mothers."
        actions={cartHeaderAction}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'products', label: isHi ? 'उत्पाद खरीदें' : 'Shop Products' },
          { key: 'orders', label: isHi ? 'मेरे ऑर्डर' : 'My Orders' }
        ].map((t) => (
          <Button
            key={t.key}
            type={activeTab === t.key ? 'primary' : 'default'}
            onClick={() => setSearchParams({ tab: t.key })}
            style={{ borderRadius: '8px', fontWeight: 'bold' }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {activeTab === 'products' ? (
        products.length > 0 ? (
          <Row gutter={[16, 16]}>
            {products.map(prod => (
              <Col xs={24} sm={12} md={8} key={prod.id}>
                <EnterpriseCard activeRole="MOTHER">
                  {prod.imageUrl && (
                    <div style={{ height: '140px', background: '#fafafa', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <img src={prod.imageUrl} alt={prod.title} style={{ maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <Title level={5} style={{ margin: '0 0 4px 0', color: theme.textPrimary }}>{prod.title}</Title>
                  <Tag color="rose" style={{ marginBottom: '8px' }}>{prod.category}</Tag>
                  <Paragraph type="secondary" style={{ fontSize: '11px', height: '36px', overflow: 'hidden' }}>{prod.description}</Paragraph>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <Text strong style={{ fontSize: '16px', color: theme.primaryColor }}>₹{prod.price}</Text>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={() => handleAddToCart(prod.id)}
                      style={{ borderRadius: '6px' }}
                    >
                      Add
                    </Button>
                  </div>
                </EnterpriseCard>
              </Col>
            ))}
          </Row>
        ) : (
          <EnterpriseEmptyState title="No Products Available" description="Our catalog is currently being updated. Check back soon!" />
        )
      ) : (
        orders.length > 0 ? (
          <List
            dataSource={orders}
            renderItem={order => (
              <EnterpriseCard activeRole="MOTHER" style={{ marginBottom: '12px' }} hoverable={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <Text strong style={{ display: 'block' }}>Order ID: {order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Placed: {new Date(order.createdAt).toLocaleDateString()}</Text>
                  </div>
                  <Tag color="green">{order.status}</Tag>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <List
                  size="small"
                  dataSource={order.items}
                  renderItem={item => (
                    <List.Item style={{ padding: '4px 0', border: 0 }}>
                      <Text style={{ fontSize: '12px' }}>{item.product?.title} x {item.quantity} (₹{item.price})</Text>
                    </List.Item>
                  )}
                />
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Total: ₹{order.totalAmount}</Text>
                  {order.status === 'delivered' && !order.returnRequest && (
                    <Button 
                      size="small" 
                      icon={<SwapOutlined />}
                      onClick={() => setReturningOrderId(order.id)}
                    >
                      Request Return
                    </Button>
                  )}
                </div>

                {returningOrderId === order.id && (
                  <div style={{ marginTop: '12px', background: '#fafafa', padding: '12px', borderRadius: '8px' }}>
                    <Input 
                      placeholder="Reason for return" 
                      value={returnReason} 
                      onChange={(e) => setReturnReason(e.target.value)} 
                      style={{ marginBottom: '8px' }}
                    />
                    <Space>
                      <Button 
                        size="small" 
                        type="primary" 
                        onClick={() => requestReturn({ variables: { orderId: order.id, reason: returnReason } })}
                      >
                        Submit
                      </Button>
                      <Button size="small" onClick={() => setReturningOrderId(null)}>Cancel</Button>
                    </Space>
                  </div>
                )}
              </EnterpriseCard>
            )}
          />
        ) : (
          <EnterpriseEmptyState title="No orders placed yet" description="Your purchase history logs will appear here." />
        )
      )}

      {/* Cart Drawer */}
      <Drawer
        title="My Shopping Cart"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        width={400}
      >
        {cartItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <List
                dataSource={cartItems}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Space>
                        <Button size="small" icon={<MinusOutlined />} onClick={() => handleQtyChange(item.product.id, item.quantity, -1)} />
                        <Text>{item.quantity}</Text>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => handleQtyChange(item.product.id, item.quantity, 1)} />
                      </Space>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.product.title}
                      description={`₹${item.product.price} each`}
                    />
                  </List.Item>
                )}
              />
              <Divider />
              <Title level={5}>Select Shipping Address:</Title>
              {addresses.map(addr => (
                <div 
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedAddressId === addr.id ? '#be123c' : '#e2e8f0'}`,
                    background: selectedAddressId === addr.id ? '#fff5f5' : '#fff',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  <Text strong style={{ display: 'block', fontSize: '12px' }}>{addr.fullName} ({addr.phone})</Text>
                  <Text style={{ fontSize: '11px', color: '#64748b' }}>{addr.addressLine1}, {addr.city}</Text>
                </div>
              ))}
              <Button 
                type="dashed" 
                block 
                icon={<EnvironmentOutlined />}
                onClick={() => setAddressDrawerOpen(true)}
                style={{ marginTop: '12px' }}
              >
                Add Shipping Address
              </Button>
            </div>
            
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Text strong>Subtotal:</Text>
                <Text strong style={{ fontSize: '18px', color: theme.primaryColor }}>₹{cartSubtotal}</Text>
              </div>
              <Button 
                type="primary" 
                block 
                size="large"
                loading={checkingOut}
                onClick={handleCheckout}
                style={{ borderRadius: '8px' }}
              >
                Confirm Order & Checkout
              </Button>
            </div>
          </div>
        ) : (
          <Empty description="Your cart is empty." />
        )}
      </Drawer>

      {/* Address Form Drawer */}
      <Drawer
        title="Add Shipping Address"
        open={addressDrawerOpen}
        onClose={() => setAddressDrawerOpen(false)}
        width={360}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ fontSize: '11px' }}>Full Name:</Text>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Text strong style={{ fontSize: '11px' }}>Address Line 1:</Text>
            <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          </div>
          <div>
            <Text strong style={{ fontSize: '11px' }}>Address Line 2 (Optional):</Text>
            <Input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </div>
          <Row gutter={8}>
            <Col span={12}>
              <Text strong style={{ fontSize: '11px' }}>City:</Text>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Col>
            <Col span={12}>
              <Text strong style={{ fontSize: '11px' }}>State:</Text>
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Text strong style={{ fontSize: '11px' }}>Postal Code:</Text>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </Col>
            <Col span={12}>
              <Text strong style={{ fontSize: '11px' }}>Phone Number:</Text>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Col>
          </Row>
          <Button type="primary" block onClick={handleAddAddress}>Save Address</Button>
        </Space>
      </Drawer>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Button, List, Tag, Typography, Row, Col, Space, Drawer, Input, Form, Divider, Badge, Tabs, Alert } from 'antd';
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
  GiftOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function StoreBoutique({ user, lang }) {
  const isHi = lang === 'hi';

  const [activeTab, setActiveTab] = useState('shop');
  const [cartOpen, setCartOpen] = useState(false);
  const [addressDrawerOpen, setAddressDrawerOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Queries & Mutations
  const { data, loading, refetch } = useQuery(GET_STORE_DATA_QUERY);
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
          { key: 'orders', label: isHi ? 'मेरे ऑर्डर' : 'My Order History' }
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
                <Tag color="green">{order.status.toUpperCase()}</Tag>
              </div>
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
    </Card>
  );
}

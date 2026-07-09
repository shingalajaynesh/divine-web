import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Card, Col, Row, Progress, Button, Input, Space, Table, Empty, Tag, Typography, message, Divider } from 'antd';
import PanelLoader from '../components/PanelLoader.jsx';
import { 
  HeartOutlined, 
  SmileOutlined, 
  GiftOutlined, 
  SendOutlined, 
  SafetyCertificateOutlined, 
  EyeInvisibleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { 
  GET_PARTNER_DASHBOARD_QUERY, 
  SEND_ENCOURAGEMENT_MUTATION, 
  ACKNOWLEDGE_PARTNER_ACTIVITY_MUTATION 
} from '../graphql/operations';

const { Title, Paragraph, Text } = Typography;

export default function PartnerDashboard({ user, lang }) {
  const isHi = lang === 'hi';
  const [messageApi, messageContext] = message.useMessage();
  const { data, loading, error, refetch } = useQuery(GET_PARTNER_DASHBOARD_QUERY, {
    fetchPolicy: 'cache-and-network'
  });

  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);

  // Mutations
  const [sendEncourage] = useMutation(SEND_ENCOURAGEMENT_MUTATION);
  // Re-use existing check-off mutation from GQL schemas
  const [acknowledgeTask, { loading: toggling }] = useMutation(ACKNOWLEDGE_PARTNER_ACTIVITY_MUTATION || ACKNOWLEDGE_PARTNER_ACTIVITY_MUTATION_FALLBACK, {
    onCompleted: () => refetch()
  });

  const handleSendMessage = async (msg) => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await sendEncourage({ variables: { message: msg.trim() } });
      messageApi.success(isHi ? 'प्रोत्साहन संदेश सफलतापूर्वक भेजा गया!' : 'Encouragement message sent successfully!');
      setCustomMsg('');
    } catch (err) {
      messageApi.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleToggleTask = async (dayNumber) => {
    try {
      await acknowledgeTask({ variables: { dayNumber } });
      messageApi.success(isHi ? 'गतिविधि स्थिति अपडेट की गई!' : 'Activity status updated!');
    } catch (err) {
      messageApi.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="partner-loading" style={{ padding: '24px' }}>
        <PanelLoader
          title={isHi ? 'पार्टनर डैशबोर्ड लोड हो रहा है' : 'Loading partner dashboard'}
          subtitle={isHi ? 'साझा यात्रा, कार्य और प्रेरणा तैयार की जा रही है...' : 'Preparing shared journey updates, tasks, and encouragements...'}
          cards={3}
        />
      </div>
    );
  }

  if (false && loading) {
    return (
      <div className="partner-loading" style={{ padding: '40px', textAlign: 'center' }}>
        <Progress type="circle" percent={45} status="active" strokeColor="#f27a54" />
        <Paragraph style={{ marginTop: '20px' }}>
          {isHi ? 'आपके साथी का स्थान लोड हो रहा है...' : 'Loading your partner space...'}
        </Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ borderRadius: 24, margin: '24px' }}>
        <Empty description={isHi ? 'पार्टनर डैशबोर्ड लोड करने में विफल।' : 'Failed to load partner dashboard.'} />
      </Card>
    );
  }

  const dbData = data?.getPartnerDashboard;
  const isVitalsShared = data?.me?.partner?.shareVitalsWithPartner ?? true;
  const isReportsShared = data?.me?.partner?.shareReportsWithPartner ?? true;
  const vitalsLogs = data?.getMyVitals || [];

  const lmpText = isHi ? 'अंतिम मासिक धर्म तिथि (LMP)' : 'Last Menstrual Period (LMP)';
  const gestationalAge = isHi ? `सप्ताह ${dbData?.currentWeek || 1}` : `Week ${dbData?.currentWeek || 1}`;

  // Quick message templates
  const messages = isHi ? [
    'आप बहुत अच्छा कर रही हैं! ❤️',
    'थोड़ा आराम करें 🧘‍♀️',
    'मैं हमेशा आपके साथ हूँ! 🌟',
    'पानी पीना न भूलें 💧'
  ] : [
    'You are doing amazing! ❤️',
    'Take a little rest 🧘‍♀️',
    'I am always here for you! 🌟',
    'Do not forget to stay hydrated 💧'
  ];

  // Trimester Story mapping
  const getTrimesterStory = (trimester) => {
    switch (trimester) {
      case 1:
        return {
          title: isHi ? 'प्राण संचार (पहली तिमाही)' : 'Prana Sanchar (Trimester 1)',
          desc: isHi ? 'जीवन शक्ति का प्रवाह' : 'Inflow of Life Force',
          color: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)'
        };
      case 2:
        return {
          title: isHi ? 'इन्द्रिय संचार (दूसरी तिमाही)' : 'Indriya Sanchar (Trimester 2)',
          desc: isHi ? 'इंद्रियों का विकास' : 'Development of Senses',
          color: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)'
        };
      default:
        return {
          title: isHi ? 'चेतना संचार (तीसरी तिमाही)' : 'Chetana Sanchar (Trimester 3)',
          desc: isHi ? 'चेतना का जागरण' : 'Awakening of Consciousness',
          color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
        };
    }
  };

  const story = getTrimesterStory(dbData?.currentTrimester || 1);

  return (
    <div className="partner-dashboard" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {messageContext}
      
      {/* Header Greeting */}
      <section className="partner-greeting" style={{ marginBottom: '30px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Text className="home-kicker" style={{ color: '#f27a54', fontWeight: 600, letterSpacing: 1.2 }}>
              {isHi ? 'नमस्ते, साथी' : 'NAMASTE, PARTNER'}
            </Text>
            <Title level={1} style={{ margin: '4px 0 0 0', color: '#1a1a1a' }}>
              {isHi ? `${dbData?.motherName} की यात्रा` : `${dbData?.motherName}'s Journey`}
            </Title>
            <Paragraph style={{ color: '#666', marginTop: 4 }}>
              {isHi ? 'यहाँ आपके साथी और बच्चे की दैनिक स्थिति है।' : "Here is how your partner and baby are doing today."}
            </Paragraph>
          </Col>
        </Row>
      </section>

      {/* Main Grid */}
      <Row gutter={[24, 24]}>
        
        {/* Left Side: Journey Card & Daily Task */}
        <Col xs={24} lg={16}>
          <Space orientation="vertical" size={24} style={{ width: '100%' }}>
            
            {/* Journey Status Card */}
            <Card 
              style={{ 
                borderRadius: 24, 
                background: story.color, 
                border: 'none',
                overflow: 'hidden',
                position: 'relative'
              }}
              bodyStyle={{ padding: '30px' }}
            >
              <Row gutter={[20, 20]} align="middle">
                <Col xs={24} md={16}>
                  <Tag style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', fontWeight: 600 }}>
                    {story.title}
                  </Tag>
                  <Title level={2} style={{ color: '#fff', marginTop: 12, marginBottom: 4 }}>
                    {gestationalAge}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, display: 'block', marginBottom: 12 }}>
                    {story.desc}
                  </Text>
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'inline-block', marginRight: 24 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'block' }}>
                        {isHi ? 'गर्भावस्था दिन' : 'Pregnancy Day'}
                      </Text>
                      <strong style={{ color: '#fff', fontSize: 20 }}>
                        {dbData?.pregnancyDay} / 280
                      </strong>
                    </div>
                    {dbData?.babySize && (
                      <div style={{ display: 'inline-block' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'block' }}>
                          {isHi ? 'शिशु का आकार' : "Baby's Size"}
                        </Text>
                        <strong style={{ color: '#fff', fontSize: 20 }}>
                          {dbData?.babySize}
                        </strong>
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                  <Progress 
                    type="circle" 
                    percent={dbData?.progressPercent || 0} 
                    strokeWidth={10} 
                    strokeColor="#fff" 
                    trailColor="rgba(255,255,255,0.2)"
                    width={110}
                    format={(percent) => <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{percent}%</span>}
                  />
                  <Text style={{ color: '#fff', display: 'block', marginTop: 10, fontSize: 13, fontWeight: 500 }}>
                    {isHi ? 'माँ की दैनिक पूर्णता' : "Mother's Daily Completion"}
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* Daily Partner Task Card */}
            <Card 
              style={{ borderRadius: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 24, marginRight: 12 }}>🤝</span>
                <div>
                  <Text style={{ color: '#666', fontSize: 12, display: 'block', fontWeight: 600 }}>
                    {isHi ? 'आज का साथी संबंध कार्य' : "TODAY'S PARTNER CONNECTION TASK"}
                  </Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {dbData?.partnerActivityTitle || (isHi ? 'संबंध गतिविधि' : 'Connection Activity')}
                  </Title>
                </div>
              </div>
              <Paragraph style={{ color: '#555', fontSize: 15, lineHeight: '1.6' }}>
                {dbData?.partnerActivityDescription || (isHi ? 'आज अपने साथी के साथ कुछ शांत क्षण बिताएं और चर्चा करें।' : 'Spend some quiet moments today connecting with your partner and talking about your plans.')}
              </Paragraph>
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color={dbData?.partnerActivityCompleted ? 'success' : 'default'} style={{ borderRadius: 12, padding: '4px 12px' }}>
                  {dbData?.partnerActivityCompleted 
                    ? (isHi ? 'पूरा किया गया' : 'Completed') 
                    : (isHi ? 'लंबित' : 'Pending')}
                </Tag>
                <Button 
                  type={dbData?.partnerActivityCompleted ? 'default' : 'primary'}
                  loading={toggling}
                  onClick={() => handleToggleTask(dbData?.pregnancyDay)}
                  style={{ borderRadius: 12 }}
                  icon={dbData?.partnerActivityCompleted ? <CheckCircleOutlined /> : null}
                >
                  {dbData?.partnerActivityCompleted 
                    ? (isHi ? 'पूर्ण के रूप में चिह्नित' : 'Completed') 
                    : (isHi ? 'पूर्ण चिह्नित करें' : 'Mark Completed')}
                </Button>
              </div>
            </Card>

            {/* Vitals History (Conditional on Consent) */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>📈 {isHi ? 'स्वास्थ्य महत्वपूर्ण (Vitals)' : "Mother's Health Vitals"}</span>
                  {!isVitalsShared && <Tag icon={<EyeInvisibleOutlined />} color="warning">{isHi ? 'निजी' : 'Private'}</Tag>}
                </div>
              }
              style={{ borderRadius: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}
            >
              {isVitalsShared ? (
                vitalsLogs.length > 0 ? (
                  <Table 
                    dataSource={vitalsLogs} 
                    rowKey="id" 
                    pagination={{ pageSize: 4 }}
                    size="small"
                    columns={[
                      { 
                        title: isHi ? 'दिनांक' : 'Date', 
                        dataIndex: 'loggedAt', 
                        render: (val) => new Date(parseInt(val) || val).toLocaleDateString() 
                      },
                      { 
                        title: isHi ? 'वजन' : 'Weight', 
                        dataIndex: 'weight', 
                        render: (val) => val ? `${val} kg` : '-' 
                      },
                      { 
                        title: isHi ? 'रक्तचाप' : 'BP', 
                        render: (_, record) => record.systolicBp && record.diastolicBp ? `${record.systolicBp}/${record.diastolicBp}` : '-' 
                      },
                      { 
                        title: isHi ? 'किक काउंट' : 'Kicks', 
                        dataIndex: 'kickCount', 
                        render: (val) => val || '-' 
                      },
                      { 
                        title: isHi ? 'लक्षण' : 'Symptoms', 
                        dataIndex: 'symptoms', 
                        render: (arr) => arr?.length ? arr.map(s => <Tag key={s} color="blue">{s}</Tag>) : '-' 
                      }
                    ]}
                  />
                ) : (
                  <Empty description={isHi ? 'कोई विटल्स लॉग नहीं मिला।' : 'No vitals logged yet.'} />
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <EyeInvisibleOutlined style={{ fontSize: 32, color: '#999', marginBottom: 12 }} />
                  <Paragraph style={{ color: '#666' }}>
                    {isHi 
                      ? 'स्वास्थ्य महत्वपूर्ण विवरण देखने की सहमति आपके साथी द्वारा सक्षम नहीं की गई है।' 
                      : "Vitals sharing is currently paused by the mother. Respecting her privacy first."}
                  </Paragraph>
                </div>
              )}
            </Card>
          </Space>
        </Col>

        {/* Right Side: Encouragement & Storytelling */}
        <Col xs={24} lg={8}>
          <Space orientation="vertical" size={24} style={{ width: '100%' }}>
            
            {/* Encouragement Console */}
            <Card 
              title={<span>✨ {isHi ? 'प्रोत्साहन भेजें' : 'Send Encouragement'}</span>}
              style={{ borderRadius: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}
            >
              <Paragraph style={{ color: '#666', fontSize: 13 }}>
                {isHi ? 'अपनी पत्नी को खुश करने या याद दिलाने के लिए एक त्वरित संदेश भेजें।' : 'Send a micro-encouragement card to show your support.'}
              </Paragraph>
              
              {/* Ready Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 20 }}>
                {messages.map((msg) => (
                  <Button 
                    key={msg} 
                    size="small" 
                    onClick={() => handleSendMessage(msg)}
                    style={{ borderRadius: 12, background: '#fff5f2', border: '1px solid #ffe3db', color: '#f27a54' }}
                  >
                    {msg}
                  </Button>
                ))}
              </div>

              {/* Custom Message Input */}
              <Input.TextArea 
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder={isHi ? 'अपना खुद का संदेश लिखें...' : 'Type a custom message...'}
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ borderRadius: 12, marginBottom: 12 }}
              />
              <Button 
                type="primary" 
                block 
                loading={sending} 
                onClick={() => handleSendMessage(customMsg)}
                style={{ borderRadius: 12 }}
                icon={<SendOutlined />}
                disabled={!customMsg.trim()}
              >
                {isHi ? 'भेजें' : 'Send Message'}
              </Button>
            </Card>

            {/* Milestone Sharing */}
            <Card 
              title={<span>👶 {isHi ? 'शिशु का साप्ताहिक मील का पत्थर' : 'Baby Milestone'}</span>}
              style={{ borderRadius: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}
            >
              {dbData?.babyMilestone ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 24, marginRight: 8 }}>🥑</span>
                    <Text strong style={{ fontSize: 16 }}>{dbData?.babySize}</Text>
                  </div>
                  <Paragraph style={{ color: '#555', fontSize: 14, lineHeight: '1.5' }}>
                    {dbData?.babyMilestone}
                  </Paragraph>
                </div>
              ) : (
                <Empty description={isHi ? 'कोई मील का पत्थर उपलब्ध नहीं है।' : 'No milestone details available.'} />
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
}

// Fallback constant check in case the mutation name differs slightly in project exports
const ACKNOWLEDGE_PARTNER_ACTIVITY_MUTATION_FALLBACK = gql`
  mutation AcknowledgePartnerActivity($dayNumber: Int!) {
    acknowledgePartnerActivity(dayNumber: $dayNumber) {
      id
      partnerAcknowledged
    }
  }
`;

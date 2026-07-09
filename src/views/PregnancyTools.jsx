import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { 
  Card, 
  Tabs, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Space, 
  Table, 
  Tag, 
  Input, 
  DatePicker, 
  List, 
  Checkbox, 
  Progress, 
  Statistic, 
  Alert,
  Empty,
  Radio,
  Divider
} from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  SyncOutlined, 
  CalendarOutlined, 
  CarryOutOutlined, 
  WarningOutlined, 
  PhoneOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  FieldTimeOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  GET_WELLNESS_DATA_QUERY, 
  LOG_VITALS_MUTATION, 
  ADD_BAG_ITEM_MUTATION, 
  TOGGLE_BAG_ITEM_MUTATION, 
  CLEAR_BAG_ITEMS_MUTATION 
} from '../graphql/operations';

const { Title, Text, Paragraph } = Typography;

export default function PregnancyTools({ user, lang }) {
  const isHi = lang === 'hi';
  
  // Tabs State
  const [activeTab, setActiveTab] = useState('kicks');

  // Query and Mutation for Hospital Bag Items
  const { data: wellnessData, refetch: refetchWellness } = useQuery(GET_WELLNESS_DATA_QUERY);
  const [addBagItem, { loading: addingBag }] = useMutation(ADD_BAG_ITEM_MUTATION, {
    onCompleted: () => {
      refetchWellness();
      toast.success(isHi ? "सामग्री जोड़ी गई!" : "Item added!");
    },
    onError: (err) => toast.error(err.message)
  });
  const [toggleBagItem] = useMutation(TOGGLE_BAG_ITEM_MUTATION, {
    onCompleted: () => refetchWellness(),
    onError: (err) => toast.error(err.message)
  });
  const [clearBagItems] = useMutation(CLEAR_BAG_ITEMS_MUTATION, {
    onCompleted: () => {
      refetchWellness();
      toast.success(isHi ? "पैक की गई सामग्रियां हटा दी गईं!" : "Cleared packed items!");
    },
    onError: (err) => toast.error(err.message)
  });

  const [logVitals] = useMutation(LOG_VITALS_MUTATION, {
    onCompleted: () => toast.success(isHi ? "किक काउंट वाइटल्स में सहेजा गया!" : "Kick count saved to Vitals!"),
    onError: (err) => toast.error(err.message)
  });

  // --- KICK COUNTER STATE ---
  const [kickSessionActive, setKickSessionActive] = useState(false);
  const [kickCount, setKickCount] = useState(0);
  const [kickTimeElapsed, setKickTimeElapsed] = useState(0); // in seconds
  const [kickTimestamps, setKickTimestamps] = useState([]);
  const [savedKickSessions, setSavedKickSessions] = useState(() => {
    const saved = localStorage.getItem('pregnancy_kick_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const kickTimerRef = useRef(null);

  useEffect(() => {
    if (kickSessionActive) {
      kickTimerRef.current = setInterval(() => {
        setKickTimeElapsed(prev => {
          if (prev >= 3600) { // Limit to 1 hour
            clearInterval(kickTimerRef.current);
            setKickSessionActive(false);
            toast.info(isHi ? "1 घंटा सत्र पूर्ण हुआ।" : "1-hour session completed.");
            return 3600;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (kickTimerRef.current) clearInterval(kickTimerRef.current);
    }
    return () => {
      if (kickTimerRef.current) clearInterval(kickTimerRef.current);
    };
  }, [kickSessionActive, isHi]);

  const handleRecordKick = () => {
    if (!kickSessionActive) {
      setKickSessionActive(true);
    }
    setKickCount(prev => prev + 1);
    setKickTimestamps(prev => [...prev, new Date().toISOString()]);
  };

  const handleSaveKickSession = () => {
    const newSession = {
      date: new Date().toISOString(),
      kicks: kickCount,
      durationSecs: kickTimeElapsed
    };
    const updated = [newSession, ...savedKickSessions];
    setSavedKickSessions(updated);
    localStorage.setItem('pregnancy_kick_sessions', JSON.stringify(updated));

    // Also log to the central vitals logs
    logVitals({
      variables: {
        input: {
          kickCount: kickCount,
          symptoms: []
        }
      }
    });

    // Reset
    setKickCount(0);
    setKickTimeElapsed(0);
    setKickTimestamps([]);
    setKickSessionActive(false);
  };

  // --- CONTRACTION TIMER STATE ---
  const [contractionActive, setContractionActive] = useState(false);
  const [contractionStartTime, setContractionStartTime] = useState(null);
  const [contractionHistory, setContractionHistory] = useState(() => {
    const saved = localStorage.getItem('pregnancy_contractions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentContractionDuration, setCurrentContractionDuration] = useState(0);
  const contractionTimerRef = useRef(null);

  useEffect(() => {
    if (contractionActive) {
      contractionTimerRef.current = setInterval(() => {
        setCurrentContractionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (contractionTimerRef.current) clearInterval(contractionTimerRef.current);
      setCurrentContractionDuration(0);
    }
    return () => {
      if (contractionTimerRef.current) clearInterval(contractionTimerRef.current);
    };
  }, [contractionActive]);

  const handleToggleContraction = () => {
    if (!contractionActive) {
      // Start Contraction
      setContractionStartTime(new Date());
      setContractionActive(true);
    } else {
      // Stop Contraction
      const stopTime = new Date();
      const durationSecs = Math.round((stopTime - contractionStartTime) / 1000);
      
      // Calculate frequency (time from start of previous contraction to start of this one)
      let frequencySecs = null;
      if (contractionHistory.length > 0) {
        const lastStartTime = new Date(contractionHistory[0].startTime);
        frequencySecs = Math.round((contractionStartTime - lastStartTime) / 1000);
      }

      const newContraction = {
        id: Date.now().toString(),
        startTime: contractionStartTime.toISOString(),
        endTime: stopTime.toISOString(),
        durationSecs,
        frequencySecs
      };

      const updated = [newContraction, ...contractionHistory];
      setContractionHistory(updated);
      localStorage.setItem('pregnancy_contractions', JSON.stringify(updated));
      setContractionActive(false);
    }
  };

  // Check labor warning: contractions 1 minute long, every 5 minutes, for 1 hour
  const getLaborStatus = () => {
    if (contractionHistory.length < 3) return null;
    const lastHourContractions = contractionHistory.filter(c => {
      const diffMs = Date.now() - new Date(c.startTime).getTime();
      return diffMs <= 60 * 60 * 1000;
    });

    if (lastHourContractions.length >= 3) {
      const avgDuration = lastHourContractions.reduce((sum, c) => sum + c.durationSecs, 0) / lastHourContractions.length;
      const avgFreq = lastHourContractions.filter(c => c.frequencySecs !== null)
                          .reduce((sum, c) => sum + c.frequencySecs, 0) / (lastHourContractions.length - 1 || 1);

      if (avgDuration >= 45 && avgFreq <= 300) {
        return 'ACTIVE_LABOR_WARNING';
      }
    }
    return 'NORMAL';
  };

  // --- EDD CALCULATOR STATE ---
  const [calculationMode, setCalculationMode] = useState('LMP'); // 'LMP' or 'CONCEPTION'
  const [lmpDateInput, setLmpDateInput] = useState(dayjs().subtract(100, 'days'));
  const [cycleLength, setCycleLength] = useState(28);
  const [calculatedEDD, setCalculatedEDD] = useState(null);
  const [pregnancyStats, setPregnancyStats] = useState(null);

  const calculateEDD = () => {
    let edd;
    if (calculationMode === 'LMP') {
      // EDD is LMP + 280 days + (cycleLength - 28)
      edd = dayjs(lmpDateInput).add(280, 'days').add(cycleLength - 28, 'days');
    } else {
      // EDD is Conception Date + 266 days
      edd = dayjs(lmpDateInput).add(266, 'days');
    }
    setCalculatedEDD(edd);

    const today = dayjs();
    const lmpDate = calculationMode === 'LMP' ? dayjs(lmpDateInput) : dayjs(lmpDateInput).subtract(14, 'days');
    const totalDays = 280;
    const currentDays = today.diff(lmpDate, 'days');
    const remainingDays = Math.max(0, 280 - currentDays);
    const percent = Math.min(100, Math.round((currentDays / totalDays) * 100));

    setPregnancyStats({
      currentDays,
      remainingDays,
      percent,
      week: Math.floor(currentDays / 7) + 1,
      day: (currentDays % 7) + 1
    });
  };

  useEffect(() => {
    calculateEDD();
  }, [lmpDateInput, cycleLength, calculationMode]);

  // --- HOSPITAL BAG STATE ---
  const [newBagItemName, setNewBagItemName] = useState('');
  const [bagCategory, setBagCategory] = useState('MOM');
  const bagItems = wellnessData?.getHospitalBagItems || [];

  const handleAddBagItem = () => {
    if (!newBagItemName.trim()) return;
    addBagItem({
      variables: {
        input: {
          itemName: newBagItemName.trim(),
          category: bagCategory
        }
      }
    });
    setNewBagItemName('');
  };

  // --- EMERGENCY CONTACTS ---
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    const saved = localStorage.getItem('pregnancy_emergency_contacts');
    return saved ? JSON.parse(saved) : {
      doctorName: '',
      doctorPhone: '',
      pediatrician: '',
      pediatricianPhone: '',
      hospitalName: '',
      hospitalPhone: '',
      ambulancePhone: '102'
    };
  });

  const handleSaveContact = (key, val) => {
    const updated = { ...emergencyContacts, [key]: val };
    setEmergencyContacts(updated);
    localStorage.setItem('pregnancy_emergency_contacts', JSON.stringify(updated));
  };

  return (
    <div style={{ padding: '8px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: 'var(--brand-maroon-dark)', fontWeight: 'bold', margin: 0 }}>
          🛠️ {isHi ? "गर्भावस्था सहायक उपकरण" : "Pregnancy Tools Suite"}
        </Title>
        <Text type="secondary">
          {isHi ? "दैनिक किक काउंटर, संकुचन टाइमर, प्रसव तिथि गणक और आपातकालीन निर्देश" : "Record fetal kicks, track active labor contractions, calculate EDDs, and manage your hospital bag checklist"}
        </Text>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        style={{ marginBottom: '24px' }}
      >
        {/* TAB 1: KICK COUNTER */}
        <Tabs.TabPane tab={isHi ? "👣 किक काउंटर" : "👣 Kick Counter"} key="kicks">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card 
                title={isHi ? "सक्रिय किक ट्रैकिंग सत्र" : "Active Kick Counter Session"}
                style={{ borderRadius: '24px', border: '1px solid #f1f5f9', minHeight: '380px' }}
              >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Statistic 
                    title={isHi ? "वर्तमान किक संख्या" : "Current Kicks Recorded"} 
                    value={kickCount} 
                    valueStyle={{ fontSize: '48px', color: '#be123c', fontWeight: 'bold' }} 
                  />
                  <div style={{ margin: '16px 0', fontSize: '16px', color: '#64748b' }}>
                    ⏱️ {isHi ? "सत्र का समय: " : "Session Time: "}
                    <Text strong>
                      {Math.floor(kickTimeElapsed / 60)}m {kickTimeElapsed % 60}s
                    </Text>
                  </div>

                  <Space size="large" style={{ marginTop: '16px' }}>
                    <Button 
                      type="primary" 
                      shape="round" 
                      size="large"
                      onClick={handleRecordKick}
                      style={{ 
                        background: '#be123c', 
                        borderColor: '#be123c', 
                        height: '70px', 
                        width: '160px', 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(190, 18, 60, 0.2)' 
                      }}
                    >
                      👣 {isHi ? "किक दर्ज करें" : "Record Kick"}
                    </Button>

                    <Button 
                      icon={kickSessionActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                      shape="round" 
                      size="large"
                      onClick={() => setKickSessionActive(!kickSessionActive)}
                    >
                      {kickSessionActive ? (isHi ? "रोकें" : "Pause") : (isHi ? "सत्र शुरू" : "Start Session")}
                    </Button>
                  </Space>

                  {kickCount > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <Button 
                        type="dashed" 
                        danger 
                        shape="round"
                        onClick={handleSaveKickSession}
                      >
                        💾 {isHi ? "सत्र पूर्ण और वाइटल्स में सहेजें" : "Save & Sync to Vitals"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card 
                title={isHi ? "सत्र इतिहास" : "Kick Session History"}
                style={{ borderRadius: '24px', border: '1px solid #f1f5f9', minHeight: '380px' }}
              >
                {savedKickSessions.length === 0 ? (
                  <Empty description={isHi ? "कोई सहेजे गए सत्र नहीं" : "No saved sessions yet."} />
                ) : (
                  <List
                    dataSource={savedKickSessions}
                    renderItem={item => (
                      <List.Item>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <div>
                            <Text strong style={{ display: 'block' }}>
                              📅 {dayjs(item.date).format('DD MMM YYYY, hh:mm A')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              ⏱️ {isHi ? "समय अवधि" : "Duration"}: {Math.floor(item.durationSecs / 60)}m {item.durationSecs % 60}s
                            </Text>
                          </div>
                          <Tag color="magenta" style={{ fontSize: '14px', fontWeight: 'bold', padding: '4px 12px', height: 'fit-content' }}>
                            {item.kicks} {isHi ? "किक्स" : "Kicks"}
                          </Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        {/* TAB 2: CONTRACTION TIMER */}
        <Tabs.TabPane tab={isHi ? "⏱️ संकुचन टाइमर" : "⏱️ Contraction Timer"} key="contractions">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card 
                title={isHi ? "संकुचन विश्लेषक" : "Labor Contraction Timer"}
                style={{ borderRadius: '24px', border: '1px solid #f1f5f9', minHeight: '400px' }}
              >
                {getLaborStatus() === 'ACTIVE_LABOR_WARNING' && (
                  <Alert
                    message={isHi ? "⚠️ सक्रिय प्रसव चेतावनी" : "🚨 Active Labor Warning"}
                    description={isHi 
                      ? "आपके संकुचन लगातार 1 मिनट लंबे और हर 5 मिनट या उससे कम अंतराल पर हो रहे हैं। कृपया तुरंत अपने डॉक्टर या अस्पताल से संपर्क करें!" 
                      : "Your contractions are lasting around 1 minute, occurring every 5 minutes or less. This indicates active labor. Please proceed to the hospital immediately!"}
                    type="error"
                    showIcon
                    style={{ marginBottom: '20px', borderRadius: '12px' }}
                  />
                )}

                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: contractionActive ? '#fef3c7' : '#f1f5f9',
                    border: `4px solid ${contractionActive ? '#f59e0b' : '#cbd5e1'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px auto',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    boxShadow: contractionActive ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'
                  }}
                  onClick={handleToggleContraction}
                  >
                    <FieldTimeOutlined style={{ fontSize: '36px', color: contractionActive ? '#d97706' : '#64748b' }} />
                    <Text strong style={{ fontSize: '18px', display: 'block', marginTop: '8px' }}>
                      {contractionActive ? (isHi ? "संकुचन रोकें" : "Stop Timer") : (isHi ? "संकुचन शुरू" : "Start Timer")}
                    </Text>
                    {contractionActive && (
                      <Text style={{ fontSize: '20px', color: '#d97706', fontWeight: 'bold', marginTop: '4px' }}>
                        {currentContractionDuration}s
                      </Text>
                    )}
                  </div>

                  <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                    {isHi 
                      ? "जैसे ही दर्द शुरू हो, बटन दबाएं और संकुचन खत्म होने पर दोबारा दबाएं।" 
                      : "Tap when a contraction starts, and tap again when it ends. The timer will calculate duration and frequency."}
                  </Paragraph>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⏱️ {isHi ? "संकुचन इतिहास" : "Contraction Logs"}</span>
                    {contractionHistory.length > 0 && (
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => {
                          setContractionHistory([]);
                          localStorage.removeItem('pregnancy_contractions');
                          toast.success('Logs cleared');
                        }}
                      >
                        {isHi ? "साफ़ करें" : "Clear All"}
                      </Button>
                    )}
                  </div>
                }
                style={{ borderRadius: '24px', border: '1px solid #f1f5f9', minHeight: '400px' }}
              >
                {contractionHistory.length === 0 ? (
                  <Empty description={isHi ? "कोई दर्ज संकुचन नहीं" : "No contraction history recorded."} />
                ) : (
                  <Table
                    dataSource={contractionHistory}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                    columns={[
                      {
                        title: isHi ? 'समय' : 'Start Time',
                        dataIndex: 'startTime',
                        key: 'startTime',
                        render: (t) => dayjs(t).format('hh:mm:ss A')
                      },
                      {
                        title: isHi ? 'अवधि' : 'Duration',
                        dataIndex: 'durationSecs',
                        key: 'durationSecs',
                        render: (s) => <Tag color="amber">{s}s</Tag>
                      },
                      {
                        title: isHi ? 'अंतराल' : 'Frequency',
                        dataIndex: 'frequencySecs',
                        key: 'frequencySecs',
                        render: (s) => s ? <Tag color="blue">{Math.round(s/60)}m {s%60}s</Tag> : <Text type="secondary">-</Text>
                      }
                    ]}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        {/* TAB 3: EDD CALCULATOR */}
        <Tabs.TabPane tab={isHi ? "📅 EDD कैलकुलेटर" : "📅 EDD Calculator"} key="edd">
          <Card style={{ borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={10}>
                <Title level={5}>{isHi ? "प्रसव तिथि की गणना करें" : "Calculate Due Date"}</Title>
                <div style={{ marginBottom: '16px' }}>
                  <Text style={{ display: 'block', marginBottom: '8px' }}>{isHi ? "गणना का तरीका:" : "Calculation Mode:"}</Text>
                  <Radio.Group 
                    value={calculationMode} 
                    onChange={e => setCalculationMode(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="LMP">{isHi ? "अंतिम मासिक धर्म (LMP)" : "LMP Date"}</Radio.Button>
                    <Radio.Button value="CONCEPTION">{isHi ? "गर्भाधान तिथि" : "Conception Date"}</Radio.Button>
                  </Radio.Group>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Text style={{ display: 'block', marginBottom: '8px' }}>
                    {calculationMode === 'LMP' ? (isHi ? "LMP का पहला दिन:" : "First Day of LMP:") : (isHi ? "गर्भाधान की तारीख:" : "Conception Date:")}
                  </Text>
                  <DatePicker
                    value={lmpDateInput}
                    onChange={(val) => setLmpDateInput(val)}
                    style={{ width: '100%' }}
                    allowClear={false}
                  />
                </div>

                {calculationMode === 'LMP' && (
                  <div style={{ marginBottom: '24px' }}>
                    <Text style={{ display: 'block', marginBottom: '8px' }}>{isHi ? "मासिक धर्म चक्र की अवधि (दिन):" : "Cycle Length (Days):"}</Text>
                    <Input 
                      type="number" 
                      value={cycleLength} 
                      onChange={e => setCycleLength(parseInt(e.target.value, 10) || 28)}
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                )}
              </Col>

              <Col xs={24} md={14} style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '24px' }}>
                {calculatedEDD && pregnancyStats && (
                  <div>
                    <Statistic 
                      title={isHi ? "अनुमानित प्रसव तिथि (EDD)" : "Estimated Date of Delivery (EDD)"} 
                      value={calculatedEDD.format('DD MMMM YYYY')} 
                      valueStyle={{ color: '#be123c', fontWeight: 'bold' }}
                    />
                    
                    <Divider style={{ margin: '16px 0' }} />

                    <Title level={5}>{isHi ? "आपकी वर्तमान स्थिति:" : "Current Progress:"}</Title>
                    <Progress 
                      percent={pregnancyStats.percent} 
                      status="active" 
                      strokeColor="#be123c"
                      style={{ marginBottom: '16px' }}
                    />
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic 
                          title={isHi ? "गर्भावस्था सप्ताह" : "Pregnancy Stage"} 
                          value={`${pregnancyStats.week} Weeks, ${pregnancyStats.day} Days`} 
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title={isHi ? "शेष दिन" : "Days Remaining"} 
                          value={pregnancyStats.remainingDays} 
                          suffix="/ 280"
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Tabs.TabPane>

        {/* TAB 4: HOSPITAL BAG CHECKLIST */}
        <Tabs.TabPane tab={isHi ? "🎒 अस्पताल बैग" : "🎒 Hospital Bag"} key="bag">
          <Card style={{ borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>🎒 {isHi ? "अस्पताल बैग चेकलिस्ट" : "Hospital Bag Checklist"}</Title>
                <Text type="secondary">
                  {isHi ? "प्रसव और अस्पताल में रहने के लिए जरूरी सामानों की सूची" : "Track items needed for the mother, baby, and partner before heading to the clinic."}
                </Text>
              </div>

              {bagItems.some(item => item.packed) && (
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => clearBagItems()}
                >
                  {isHi ? "पैक सामग्री हटाएं" : "Clear Packed Items"}
                </Button>
              )}
            </div>

            {/* Add Custom Item */}
            <Row gutter={12} style={{ marginBottom: '20px' }}>
              <Col xs={16} md={18}>
                <Input 
                  placeholder={isHi ? "नया सामान जोड़ें..." : "Add custom item (e.g. Warm socks)..."}
                  value={newBagItemName}
                  onChange={e => setNewBagItemName(e.target.value)}
                  style={{ borderRadius: '8px', height: '40px' }}
                />
              </Col>
              <Col xs={8} md={6}>
                <Button 
                  type="primary" 
                  block
                  icon={<PlusOutlined />} 
                  loading={addingBag}
                  onClick={handleAddBagItem}
                  style={{ background: '#be123c', borderColor: '#be123c', borderRadius: '8px', height: '40px', fontWeight: 'bold' }}
                >
                  {isHi ? "जोड़ें" : "Add Item"}
                </Button>
              </Col>
            </Row>

            <Tabs defaultActiveKey="MOM" size="small" type="card">
              {['MOM', 'BABY', 'PARTNER', 'DOCUMENTS'].map((cat) => {
                const catItems = bagItems.filter(item => item.category === cat);
                return (
                  <Tabs.TabPane tab={cat === 'MOM' ? (isHi ? "माँ के लिए" : "For Mother") : cat === 'BABY' ? (isHi ? "शिशु के लिए" : "For Baby") : cat === 'PARTNER' ? (isHi ? "साथी के लिए" : "For Partner") : (isHi ? "दस्तावेज" : "Documents")} key={cat}>
                    {catItems.length === 0 ? (
                      <Empty description={isHi ? "इस श्रेणी में कोई सामान नहीं है" : "No items added to this category yet."} />
                    ) : (
                      <List
                        bordered
                        dataSource={catItems}
                        style={{ borderRadius: '12px' }}
                        renderItem={item => (
                          <List.Item>
                            <Checkbox
                              checked={item.packed}
                              onChange={(e) => toggleBagItem({ variables: { id: item.id, packed: e.target.checked } })}
                            >
                              <span style={{ textDecoration: item.packed ? 'line-through' : 'none', color: item.packed ? '#cbd5e1' : 'inherit' }}>
                                {item.itemName}
                              </span>
                            </Checkbox>
                          </List.Item>
                        )}
                      />
                    )}
                  </Tabs.TabPane>
                );
              })}
            </Tabs>
          </Card>
        </Tabs.TabPane>

        {/* TAB 5: EMERGENCY DIRECTORY */}
        <Tabs.TabPane tab={isHi ? "🚨 आपातकालीन निर्देश" : "🚨 Emergency Support"} key="emergency">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card 
                title={<span><WarningOutlined style={{ color: '#ef4444', marginRight: 8 }} />{isHi ? "आपातकालीन चेतावनी संकेत" : "Clinical Red Flags"}</span>}
                style={{ borderRadius: '24px', border: '1px solid #f1f5f9' }}
              >
                <Paragraph type="secondary">
                  {isHi 
                    ? "यदि आप निम्नलिखित लक्षणों में से किसी भी लक्षण का अनुभव करती हैं, तो बिना किसी देरी के तुरंत अपने डॉक्टर या नजदीकी अस्पताल से संपर्क करें:"
                    : "Please seek medical attention immediately if you experience any of these symptoms:"}
                </Paragraph>
                <List
                  dataSource={[
                    isHi ? "🔴 योनि से रक्तस्राव या तरल पदार्थ का रिसाव (Bleeding/Fluid leakage)" : "🔴 Vaginal bleeding or continuous fluid leakage",
                    isHi ? "🔴 अचानक हाथों, चेहरे या टखनों में गंभीर सूजन (Severe Swelling)" : "🔴 Sudden, severe swelling in hands, face, or ankles",
                    isHi ? "🔴 पेट के निचले हिस्से में तीव्र या असहनीय दर्द (Severe abdominal pain)" : "🔴 Sharp, unyielding abdominal pain",
                    isHi ? "🔴 धुंधला दिखाई देना या लगातार गंभीर सिरदर्द (Blurred vision)" : "🔴 Persistent visual disturbances or severe headache",
                    isHi ? "🔴 शिशु के हिलने-डुलने (किक्स) में अचानक कमी या बंद होना (Reduced movements)" : "🔴 Sudden decrease or absence of baby movements",
                    isHi ? "🔴 तीव्र बुखार या कंपकंपी महसूस होना (High fever)" : "🔴 High temperature (fever) or chills"
                  ]}
                  renderItem={item => <List.Item style={{ color: '#b91c1c', fontWeight: 'bold' }}>{item}</List.Item>}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card 
                title={<span><PhoneOutlined style={{ color: '#16a34a', marginRight: 8 }} />{isHi ? "आपातकालीन संपर्क निर्देशिका" : "Emergency Contact Directory"}</span>}
                style={{ borderRadius: '24px', border: '1px solid #f1f5f9' }}
              >
                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                      {isHi ? "प्रसूति रोग विशेषज्ञ (Doctor Name)" : "OBSTETRICIAN / GYNECOLOGIST"}
                    </Text>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Input 
                          placeholder="Dr. Sharma"
                          value={emergencyContacts.doctorName}
                          onChange={e => handleSaveContact('doctorName', e.target.value)}
                        />
                      </Col>
                      <Col span={12}>
                        <Input 
                          placeholder="Phone number"
                          value={emergencyContacts.doctorPhone}
                          onChange={e => handleSaveContact('doctorPhone', e.target.value)}
                        />
                      </Col>
                    </Row>
                  </div>

                  <div>
                    <Text strong style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                      {isHi ? "अस्पताल का नाम" : "CLINIC / HOSPITAL RECEPTION"}
                    </Text>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Input 
                          placeholder="Apollo Hospital"
                          value={emergencyContacts.hospitalName}
                          onChange={e => handleSaveContact('hospitalName', e.target.value)}
                        />
                      </Col>
                      <Col span={12}>
                        <Input 
                          placeholder="Phone number"
                          value={emergencyContacts.hospitalPhone}
                          onChange={e => handleSaveContact('hospitalPhone', e.target.value)}
                        />
                      </Col>
                    </Row>
                  </div>

                  <div>
                    <Text strong style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                      {isHi ? "एंबुलेंस फोन नंबर" : "AMBULANCE SERVICE"}
                    </Text>
                    <Input 
                      placeholder="102"
                      value={emergencyContacts.ambulancePhone}
                      onChange={e => handleSaveContact('ambulancePhone', e.target.value)}
                    />
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

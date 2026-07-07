import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Form, InputNumber, Button, Table, Tag, Typography, Row, Col, Space, Input, DatePicker, Select, Checkbox, Progress, List, Tabs, Divider } from 'antd';
import { 
  GET_WELLNESS_DATA_QUERY, 
  LOG_VITALS_MUTATION, 
  ADD_APPOINTMENT_MUTATION, 
  DELETE_APPOINTMENT_MUTATION, 
  ADD_MEDICINE_MUTATION, 
  TOGGLE_MEDICINE_MUTATION, 
  DELETE_MEDICINE_MUTATION, 
  ADD_BAG_ITEM_MUTATION, 
  TOGGLE_BAG_ITEM_MUTATION, 
  CLEAR_BAG_ITEMS_MUTATION 
} from '../graphql/operations';
import { 
  HeartOutlined, 
  CalendarOutlined, 
  MedicineBoxOutlined, 
  CarryOutOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  CheckOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const SYMPTOM_OPTIONS = [
  'Nausea', 'Fatigue', 'Backache', 'Swelling', 'Headache', 'Heartburn', 'Mood Swings', 'Insomnia'
];

export default function VitalsTracker({ user, lang }) {
  const isHi = lang === 'hi';
  
  // Queries & Mutations
  const { data, loading, refetch } = useQuery(GET_WELLNESS_DATA_QUERY);
  const [logVitals] = useMutation(LOG_VITALS_MUTATION, { onCompleted: () => refetch() });
  const [addAppointment] = useMutation(ADD_APPOINTMENT_MUTATION, { onCompleted: () => refetch() });
  const [deleteAppointment] = useMutation(DELETE_APPOINTMENT_MUTATION, { onCompleted: () => refetch() });
  const [addMedicine] = useMutation(ADD_MEDICINE_MUTATION, { onCompleted: () => refetch() });
  const [toggleMedicine] = useMutation(TOGGLE_MEDICINE_MUTATION, { onCompleted: () => refetch() });
  const [deleteMedicine] = useMutation(DELETE_MEDICINE_MUTATION, { onCompleted: () => refetch() });
  const [addBagItem] = useMutation(ADD_BAG_ITEM_MUTATION, { onCompleted: () => refetch() });
  const [toggleBagItem] = useMutation(TOGGLE_BAG_ITEM_MUTATION, { onCompleted: () => refetch() });
  const [clearPackedBagItems] = useMutation(CLEAR_BAG_ITEMS_MUTATION, { onCompleted: () => refetch() });

  const [vitalsForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('vitals');

  // Input states
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [newBagItemName, setNewBagItemName] = useState('');
  const [newBagCategory, setNewBagCategory] = useState('mother');

  const [mood, setMood] = useState(null);
  const [sleepHours, setSleepHours] = useState(8);
  const [hydrationWater, setHydrationWater] = useState(2.0);
  const [nutritionCalories, setNutritionCalories] = useState(2000);
  const [nutritionMealNotes, setNutritionMealNotes] = useState('');

  // Appointments Form state
  const [appTitle, setAppTitle] = useState('');
  const [appDoctor, setAppDoctor] = useState('');
  const [appDate, setAppDate] = useState(null);
  const [appNotes, setAppNotes] = useState('');

  // Extract Lists
  const logs = data?.getMyVitals || [];
  const appointments = data?.getAppointments || [];
  const medicines = data?.getMedicineReminders || [];
  const bagItems = data?.getHospitalBagItems || [];

  const latestLog = logs[0] || null;

  // Packed percentage
  const packedCount = bagItems.filter(i => i.packed).length;
  const totalBagItems = bagItems.length;
  const packedPercentage = totalBagItems > 0 ? Math.round((packedCount / totalBagItems) * 100) : 0;

  const trendFeedback = useMemo(() => {
    if (logs.length === 0) return null;
    const recentLogs = logs.slice(0, 7);
    const sleepLogs = recentLogs.filter(l => l.sleepHours !== null && l.sleepHours !== undefined);
    const waterLogs = recentLogs.filter(l => l.hydrationWater !== null && l.hydrationWater !== undefined);
    
    const avgSleep = sleepLogs.length > 0 ? (sleepLogs.reduce((sum, l) => sum + l.sleepHours, 0) / sleepLogs.length) : 8;
    const totalWater = waterLogs.length > 0 ? (waterLogs.reduce((sum, l) => sum + l.hydrationWater, 0) / waterLogs.length) : 2.0;

    let advice = [];
    if (avgSleep < 7) {
      advice.push(isHi ? "💤 आपकी औसत नींद 7 घंटे से कम है। प्रसव पूर्व विकास और ऊर्जा के लिए अधिक विश्राम अत्यंत महत्वपूर्ण है।" : "💤 Your average sleep is under 7 hours. Prioritize rest for prenatal development and maternal energy.");
    } else {
      advice.push(isHi ? "🌸 आपकी नींद का चक्र बहुत बढ़िया है। आराम बनाए रखें!" : "🌸 Your average sleep duration looks healthy. Maintain good rest!");
    }

    if (totalWater < 2.5) {
      advice.push(isHi ? "💧 हाइड्रेशन बढ़ायें! एमनियोटिक द्रव स्तर को स्थिर रखने के लिए प्रतिदिन कम से कम 2.5 - 3.0 लीटर पानी पियें।" : "💧 Step up your water intake! Aiming for 2.5L - 3.0L daily helps maintain amniotic fluid levels.");
    } else {
      advice.push(isHi ? "🥤 अद्भुत! आप पानी पीने का लक्ष्य नियमित रूप से पूरा कर रहे हैं।" : "🥤 Great job staying hydrated! Keep drinking ample water.");
    }

    return {
      avgSleep: avgSleep.toFixed(1),
      avgWater: totalWater.toFixed(1),
      advice
    };
  }, [logs, isHi]);

  const handleVitalsSubmit = async (values) => {
    const { weight, systolic, diastolic, kicks, sugar } = values;
    if (!weight && !systolic && !diastolic && !kicks && !sugar && selectedSymptoms.length === 0 && !mood && !sleepHours && !hydrationWater && !nutritionCalories && !nutritionMealNotes) {
      toast.error(isHi ? 'कृपया कम से कम एक मेट्रिक दर्ज करें!' : 'Please enter at least one metric or symptom to log!');
      return;
    }

    try {
      await logVitals({
        variables: {
          input: {
            weight: weight ? parseFloat(weight) : null,
            systolicBp: systolic ? parseInt(systolic, 10) : null,
            diastolicBp: diastolic ? parseInt(diastolic, 10) : null,
            kickCount: kicks ? parseInt(kicks, 10) : null,
            bloodSugar: sugar ? parseFloat(sugar) : null,
            symptoms: selectedSymptoms,
            mood,
            sleepHours: sleepHours ? parseFloat(sleepHours) : null,
            hydrationWater: hydrationWater ? parseFloat(hydrationWater) : null,
            nutritionCalories: nutritionCalories ? parseFloat(nutritionCalories) : null,
            nutritionMealNotes: nutritionMealNotes || null
          }
        }
      });
      toast.success(isHi ? 'स्वास्थ्य वाइटल्स दर्ज किए गए!' : 'Pregnancy wellness metrics logged!');
      vitalsForm.resetFields();
      setSelectedSymptoms([]);
      setMood(null);
      setSleepHours(8);
      setHydrationWater(2.0);
      setNutritionCalories(2000);
      setNutritionMealNotes('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddAppointment = async () => {
    if (!appTitle || !appDate) return;
    try {
      await addAppointment({
        variables: {
          input: {
            title: appTitle,
            doctorName: appDoctor,
            appointmentDate: appDate.toISOString(),
            notes: appNotes
          }
        }
      });
      toast.success(isHi ? 'अपॉइंटमेंट बुक किया गया' : 'Doctor visit scheduled successfully');
      setAppTitle('');
      setAppDoctor('');
      setAppDate(null);
      setAppNotes('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedName || !newMedDosage) return;
    try {
      await addMedicine({
        variables: {
          input: {
            name: newMedName,
            dosage: newMedDosage,
            timeOfDay: newMedTime
          }
        }
      });
      toast.success(isHi ? 'दवा अनुस्मारक जोड़ा गया' : 'Medicine reminder added successfully');
      setNewMedName('');
      setNewMedDosage('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddBagItem = async () => {
    if (!newBagItemName) return;
    try {
      await addBagItem({
        variables: {
          input: {
            itemName: newBagItemName,
            category: newBagCategory
          }
        }
      });
      toast.success(isHi ? 'चेकलिस्ट आइटम जोड़ा गया' : 'Bag item added successfully');
      setNewBagItemName('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      title: isHi ? 'तारीख' : 'Date',
      dataIndex: 'loggedAt',
      key: 'loggedAt',
      render: (text) => <Text strong>{new Date(text).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
    },
    {
      title: isHi ? 'वजन' : 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      render: (val) => val ? `${val} kg` : '-'
    },
    {
      title: isHi ? 'रक्तचाप' : 'Blood Pressure',
      key: 'bp',
      render: (_, record) => record.systolicBp && record.diastolicBp ? `${record.systolicBp}/${record.diastolicBp} mmHg` : '-'
    },
    {
      title: isHi ? 'किक्स' : 'Kicks (2h)',
      dataIndex: 'kickCount',
      key: 'kickCount',
      render: (val) => val !== null && val !== undefined ? `${val} counts` : '-'
    },
    {
      title: isHi ? 'लक्षण' : 'Symptoms Logged',
      dataIndex: 'symptoms',
      key: 'symptoms',
      render: (text) => {
        let list = [];
        try {
          list = JSON.parse(text || '[]');
        } catch (e) {
          list = [];
        }
        return list.length > 0 ? list.map(s => <Tag color="blue" key={s}>{s}</Tag>) : '-';
      }
    },
    {
      title: isHi ? 'मनोदशा' : 'Mood',
      dataIndex: 'mood',
      key: 'mood',
      render: (val) => {
        if (!val) return '-';
        const moods = {
          HAPPY: '😊 Happy',
          CALM: '😌 Calm',
          ANXIOUS: '😰 Anxious',
          TIRED: '😴 Tired',
          SAD: '😢 Sad'
        };
        return moods[val] || val;
      }
    },
    {
      title: isHi ? 'नींद' : 'Sleep',
      dataIndex: 'sleepHours',
      key: 'sleepHours',
      render: (val) => val ? `${val} hrs` : '-'
    },
    {
      title: isHi ? 'जल सेवन' : 'Water',
      dataIndex: 'hydrationWater',
      key: 'hydrationWater',
      render: (val) => val ? `${val} L` : '-'
    },
    {
      title: isHi ? 'पोषण' : 'Nutrition',
      key: 'nutrition',
      render: (_, record) => (
        record.nutritionCalories || record.nutritionMealNotes ? (
          <div>
            {record.nutritionCalories && <Tag color="green">{record.nutritionCalories} kcal</Tag>}
            {record.nutritionMealNotes && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{record.nutritionMealNotes}</div>}
          </div>
        ) : '-'
      )
    }
  ];

  const tabs = [
    {
      key: 'vitals',
      label: (
        <span>
          <HeartOutlined /> {isHi ? 'दैनिक स्वास्थ्य लॉग' : 'Daily Vitals & Symptoms'}
        </span>
      )
    },
    {
      key: 'medicines',
      label: (
        <span>
          <MedicineBoxOutlined /> {isHi ? 'दवाइयाँ' : 'Daily Pill Reminders'}
        </span>
      )
    },
    {
      key: 'appointments',
      label: (
        <span>
          <CalendarOutlined /> {isHi ? 'डॉक्टर अपॉइंटमेंट्स' : 'Doctor Appointments'}
        </span>
      )
    },
    {
      key: 'hospitalBag',
      label: (
        <span>
          <CarryOutOutlined /> {isHi ? 'अस्पताल बैग सूची' : 'Hospital Bag Checklist'}
        </span>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>👩‍⚕️ {isHi ? "मातृत्व कल्याण किट" : "Pregnancy Wellness Tracking Kit"}</Title>
        <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
          {isHi 
            ? "अपनी गर्भावस्था के वाइटल्स, दवाओं, आगामी अपॉइंटमेंट्स और प्रसव बैग पैकिंग पर नज़र रखें।" 
            : "Monitor your health vitals, daily medicine schedule, checkup appointments, and labor packing list."}
        </Paragraph>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} style={{ marginBottom: '24px' }} />

      {activeTab === 'vitals' && (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 20, background: '#fffbeb', border: '1px solid #fef3c7' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>⚖️ Weight</Text>
                <Title level={3} style={{ margin: '8px 0 0 0' }}>{latestLog?.weight ? `${latestLog.weight} kg` : 'N/A'}</Title>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 20, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>🩸 Blood Pressure</Text>
                <Title level={3} style={{ margin: '8px 0 0 0' }}>
                  {latestLog?.systolicBp && latestLog?.diastolicBp ? `${latestLog.systolicBp}/${latestLog.diastolicBp}` : 'N/A'}
                </Title>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 20, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>👣 Baby Kicks</Text>
                <Title level={3} style={{ margin: '8px 0 0 0' }}>
                  {latestLog && latestLog.kickCount !== null && latestLog.kickCount !== undefined ? `${latestLog.kickCount}` : 'N/A'}
                </Title>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 20, background: '#fef2f2', border: '1px solid #fecaca' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>🍭 Blood Sugar</Text>
                <Title level={3} style={{ margin: '8px 0 0 0' }}>{latestLog?.bloodSugar ? `${latestLog.bloodSugar} mg/dL` : 'N/A'}</Title>
              </Card>
            </Col>
          </Row>

          {trendFeedback && (
            <Card 
              style={{ 
                borderRadius: 20, 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                marginBottom: '8px' 
              }}
            >
              <Text strong style={{ fontSize: '11px', color: 'var(--brand-maroon-dark)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                💡 {isHi ? "स्वास्थ्य रुझान और प्रतिक्रिया" : "Wellness Trends & Feedback"}
              </Text>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {isHi ? "औसत नींद (अंतिम 7 प्रविष्टियाँ):" : "Average Sleep (Last 7 logs):"}{' '}
                      <Text strong>{trendFeedback.avgSleep} hrs</Text>
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {isHi ? "औसत जल सेवन:" : "Average Hydration:"}{' '}
                      <Text strong>{trendFeedback.avgWater} L</Text>
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} sm={16}>
                  {trendFeedback.advice.map((adv, idx) => (
                    <Paragraph key={idx} style={{ margin: '2px 0', fontSize: '12px', color: '#475569' }}>
                      • {adv}
                    </Paragraph>
                  ))}
                </Col>
              </Row>
            </Card>
          )}

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0' }} styles={{ body: { padding: '20px' } }}>
                <Title level={5} style={{ margin: '0 0 16px 0' }}>📝 Log Wellness Entry</Title>
                <Form form={vitalsForm} layout="vertical" onFinish={handleVitalsSubmit}>
                  <Form.Item name="weight" label={<Text strong style={{ fontSize: '11px' }}>Weight (kg)</Text>}>
                    <InputNumber style={{ width: '100%' }} placeholder="e.g. 64.5" />
                  </Form.Item>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item name="systolic" label={<Text strong style={{ fontSize: '11px' }}>Systolic BP</Text>}>
                        <InputNumber style={{ width: '100%' }} placeholder="Systolic" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="diastolic" label={<Text strong style={{ fontSize: '11px' }}>Diastolic BP</Text>}>
                        <InputNumber style={{ width: '100%' }} placeholder="Diastolic" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="kicks" label={<Text strong style={{ fontSize: '11px' }}>Kick Count (2 hours)</Text>}>
                    <InputNumber style={{ width: '100%' }} placeholder="e.g. 10" />
                  </Form.Item>
                  <Form.Item name="sugar" label={<Text strong style={{ fontSize: '11px' }}>Blood Sugar (mg/dL)</Text>}>
                    <InputNumber style={{ width: '100%' }} placeholder="e.g. 90.5" />
                  </Form.Item>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Select Symptoms Experiencing</Text>
                    <Space wrap>
                      {SYMPTOM_OPTIONS.map(symptom => {
                        const active = selectedSymptoms.includes(symptom);
                        return (
                          <Tag 
                            key={symptom}
                            color={active ? 'magenta' : 'default'}
                            style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                            onClick={() => {
                              setSelectedSymptoms(
                                active 
                                  ? selectedSymptoms.filter(s => s !== symptom)
                                  : [...selectedSymptoms, symptom]
                              );
                            }}
                          >
                            {symptom}
                          </Tag>
                        );
                      })}
                    </Space>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                      {isHi ? "मनोदशा / भावनात्मक स्थिति" : "Select Mood / Emotional State"}
                    </Text>
                    <Space wrap style={{ gap: '6px' }}>
                      {[
                        { val: 'HAPPY', emoji: '😊', label: isHi ? 'खुश' : 'Happy' },
                        { val: 'CALM', emoji: '😌', label: isHi ? 'शांत' : 'Calm' },
                        { val: 'ANXIOUS', emoji: '😰', label: isHi ? 'चिंतित' : 'Anxious' },
                        { val: 'TIRED', emoji: '😴', label: isHi ? 'थका' : 'Tired' },
                        { val: 'SAD', emoji: '😢', label: isHi ? 'उदास' : 'Sad' }
                      ].map(item => (
                        <Button
                          key={item.val}
                          type={mood === item.val ? 'primary' : 'default'}
                          onClick={() => setMood(item.val)}
                          style={{ 
                            height: 'auto', 
                            padding: '4px 8px', 
                            borderRadius: '8px', 
                            fontSize: '13px',
                            background: mood === item.val ? 'var(--brand-maroon-dark)' : undefined,
                            borderColor: mood === item.val ? 'var(--brand-maroon-dark)' : undefined
                          }}
                        >
                          {item.emoji} <span style={{ fontSize: '11px', marginLeft: '2px' }}>{item.label}</span>
                        </Button>
                      ))}
                    </Space>
                  </div>

                  <Form.Item label={<Text strong style={{ fontSize: '11px' }}>{isHi ? "नींद की अवधि (घंटे)" : "Restful Sleep (Hours)"}</Text>}>
                    <InputNumber 
                      min={0} 
                      max={24} 
                      step={0.5} 
                      value={sleepHours} 
                      onChange={val => setSleepHours(val)} 
                      style={{ width: '100%' }} 
                    />
                  </Form.Item>

                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                      {isHi ? "पानी का सेवन (लीटर)" : "Daily Water Intake (Liters)"}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <InputNumber 
                        min={0} 
                        max={10} 
                        step={0.25} 
                        value={hydrationWater} 
                        onChange={val => setHydrationWater(val)} 
                        style={{ flex: 1 }} 
                      />
                      <Button 
                        onClick={() => setHydrationWater(prev => parseFloat((prev + 0.25).toFixed(2)))}
                        style={{ borderRadius: '8px' }}
                      >
                        🥛 +250ml
                      </Button>
                    </div>
                  </div>

                  <Row gutter={8} style={{ marginBottom: '16px' }}>
                    <Col span={12}>
                      <Form.Item label={<Text strong style={{ fontSize: '11px' }}>{isHi ? "कैलोरी (kcal)" : "Calories (kcal)"}</Text>}>
                        <InputNumber 
                          min={0} 
                          step={50} 
                          value={nutritionCalories} 
                          onChange={val => setNutritionCalories(val)} 
                          style={{ width: '100%' }} 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={<Text strong style={{ fontSize: '11px' }}>{isHi ? "भोजन नोट्स" : "Meal Notes"}</Text>}>
                        <Input.TextArea 
                          rows={1}
                          placeholder={isHi ? "नाश्ता, दोपहर का भोजन..." : "What did you eat?"} 
                          value={nutritionMealNotes} 
                          onChange={e => setNutritionMealNotes(e.target.value)} 
                          style={{ borderRadius: '8px' }} 
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" block style={{ background: '#be123c', borderColor: '#be123c', fontWeight: 'bold' }}>
                    Save Daily Entry
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}>
                <Title level={5} style={{ margin: '0 0 16px 0', fontSize: '14px' }}>📈 Vitals & Symptoms History</Title>
                <Table dataSource={logs} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} />
              </Card>
            </Col>
          </Row>
        </Space>
      )}

      {activeTab === 'medicines' && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Title level={5} style={{ margin: '0 0 16px 0' }}>💊 Add Medicine Schedule</Title>
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Medicine Name</Text>
                  <Input placeholder="e.g. Iron Supplement, Folic Acid" value={newMedName} onChange={e => setNewMedName(e.target.value)} />
                </div>
                <div>
                  <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Dosage Description</Text>
                  <Input placeholder="e.g. 1 Tablet, 5ml liquid" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} />
                </div>
                <div>
                  <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Daily Remind Time</Text>
                  <Select value={newMedTime} onChange={setNewMedTime} style={{ width: '100%' }}>
                    {['06:00', '08:00', '13:00', '18:00', '21:00', '22:00'].map(t => (
                      <Select.Option key={t} value={t}>{t}</Select.Option>
                    ))}
                  </Select>
                </div>
                <Button type="primary" onClick={handleAddMedicine} icon={<PlusOutlined />} block style={{ background: '#be123c', borderColor: '#be123c' }}>
                  Add Pill Schedule
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={14}>
            <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Title level={5} style={{ margin: '0 0 16px 0' }}>🗓️ Active Medicine Reminders</Title>
              {medicines.length === 0 ? (
                <Paragraph type="secondary" style={{ fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                  No medicine reminders configured. Add one on the left panel!
                </Paragraph>
              ) : (
                <List
                  dataSource={medicines}
                  renderItem={med => (
                    <List.Item 
                      actions={[
                        <Checkbox 
                          checked={med.active} 
                          onChange={e => toggleMedicine({ variables: { id: med.id, active: e.target.checked } })}
                        >
                          Active
                        </Checkbox>,
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteMedicine({ variables: { id: med.id } })} />
                      ]}
                    >
                      <List.Item.Meta
                        title={<Text strong style={{ color: med.active ? '#1e293b' : '#94a3b8' }}>{med.name}</Text>}
                        description={`Dosage: ${med.dosage} • Daily Time: ${med.timeOfDay}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'appointments' && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Title level={5} style={{ margin: '0 0 16px 0' }}>🏥 Log Doctor Visit</Title>
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Appointment Purpose</Text>
                  <Input placeholder="e.g. Trimester 1 Ultrasound Scan" value={appTitle} onChange={e => setAppTitle(e.target.value)} />
                </div>
                <div>
                  <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Doctor/Clinic Name</Text>
                  <Input placeholder="e.g. Dr. Pooja Sharma" value={appDoctor} onChange={e => setAppDoctor(e.target.value)} />
                </div>
                <div>
                  <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Checkup Date & Time</Text>
                  <DatePicker showTime style={{ width: '100%' }} onChange={val => setAppDate(val)} value={appDate} />
                </div>
                <div>
                  <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>Special Doctor Notes</Text>
                  <Input.TextArea placeholder="Fast 8 hours, bring reports..." rows={2} value={appNotes} onChange={e => setAppNotes(e.target.value)} />
                </div>
                <Button type="primary" onClick={handleAddAppointment} icon={<PlusOutlined />} block style={{ background: '#be123c', borderColor: '#be123c' }}>
                  Schedule Appointment
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={14}>
            <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Title level={5} style={{ margin: '0 0 16px 0' }}>📅 Upcoming Doctor Checkups</Title>
              {appointments.length === 0 ? (
                <Paragraph type="secondary" style={{ fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                  No upcoming clinic visits logged.
                </Paragraph>
              ) : (
                <List
                  dataSource={appointments}
                  renderItem={app => (
                    <List.Item 
                      actions={[
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteAppointment({ variables: { id: app.id } })} />
                      ]}
                    >
                      <List.Item.Meta
                        title={<Text strong>{app.title}</Text>}
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                              🩺 {app.doctorName || 'General Care'} • 📅 {new Date(app.appointmentDate).toLocaleString()}
                            </Text>
                            {app.notes && <Paragraph style={{ margin: '4px 0 0 0', fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>"{app.notes}"</Paragraph>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'hospitalBag' && (
        <Card style={{ borderRadius: 20, border: '1px solid #e2e8f0' }}>
          <Title level={5} style={{ margin: 0 }}>🎒 Hospital Bag Checklist</Title>
          <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
            Pack early! Make sure you and baby have everything ready for labor delivery.
          </Paragraph>

          <div style={{ margin: '20px 0', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
            <Row align="center" gutter={16}>
              <Col xs={24} sm={18}>
                <Progress percent={packedPercentage} strokeColor="#be123c" status="active" />
              </Col>
              <Col xs={24} sm={6}>
                <Button type="text" danger onClick={() => clearPackedBagItems()} block style={{ fontWeight: 'bold' }}>
                  Clear Packed Items
                </Button>
              </Col>
            </Row>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card style={{ borderRadius: 16, background: '#fcfcfc' }}>
                <Title level={5} style={{ fontSize: '13px', margin: '0 0 12px 0' }}>➕ Add Packing Item</Title>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <Input placeholder="e.g. Diapers, Swaddle Cloth" value={newBagItemName} onChange={e => setNewBagItemName(e.target.value)} />
                  <Select value={newBagCategory} onChange={setNewBagCategory} style={{ width: '100%' }}>
                    <Select.Option value="mother">🤰 For Mother</Select.Option>
                    <Select.Option value="baby">👶 For Baby</Select.Option>
                    <Select.Option value="partner">👨 For Partner / Documents</Select.Option>
                  </Select>
                  <Button type="primary" onClick={handleAddBagItem} icon={<PlusOutlined />} block style={{ background: '#be123c', borderColor: '#be123c' }}>
                    Add Checklist Item
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={16}>
              <Row gutter={[16, 16]}>
                {['mother', 'baby', 'partner'].map(cat => {
                  const items = bagItems.filter(i => i.category === cat);
                  const catLabel = cat === 'mother' ? '🤰 For Mother' : cat === 'baby' ? '👶 For Baby' : '👨 For Partner / Documents';
                  
                  return (
                    <Col xs={24} sm={12} key={cat}>
                      <Card title={<span style={{ fontSize: '12px', fontWeight: 'bold' }}>{catLabel}</span>} style={{ borderRadius: 16 }}>
                        {items.length === 0 ? (
                          <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '11px' }}>Empty category</Text>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {items.map(item => (
                              <Checkbox 
                                key={item.id}
                                checked={item.packed}
                                onChange={e => toggleBagItem({ variables: { id: item.id, packed: e.target.checked } })}
                              >
                                <span style={{ textDecoration: item.packed ? 'line-through' : 'none', color: item.packed ? '#94a3b8' : '#1e293b', fontSize: '12px' }}>
                                  {item.itemName}
                                </span>
                              </Checkbox>
                            ))}
                          </div>
                        )}
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Col>
          </Row>
        </Card>
      )}
    </Card>
  );
}

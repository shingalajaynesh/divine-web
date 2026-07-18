import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Form, InputNumber, Button, Table, Tag, Typography, Row, Col, Space, Input, DatePicker, Select, Checkbox, Progress, List, Tabs, Divider, Alert, Slider } from 'antd';
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
  CheckOutlined,
  WifiOutlined
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

const SYMPTOM_OPTIONS = [
  'Nausea', 'Fatigue', 'Backache', 'Swelling', 'Headache', 'Heartburn', 'Mood Swings', 'Insomnia'
];

export default function VitalsTracker({ user, lang }) {
  const isHi = lang === 'hi';
  const theme = getRoleTheme('MOTHER');

  // Online status detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queries & Mutations
  const { data, loading, error, refetch } = useQuery(GET_WELLNESS_DATA_QUERY, {
    skip: !isOnline
  });
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
      advice.push(isHi ? "💧 हाइड्रेशन ध्यान: दैनिक पानी का सेवन कम से कम 2.5 लीटर बढ़ाएं। यह एम्नियोटिक द्रव स्तर के लिए अनुकूल है।" : "💧 Hydration check: Increase daily water intake to at least 2.5L. This is supportive for amniotic fluid levels.");
    }

    return advice;
  }, [logs, isHi]);

  const handleLogVitals = async (values) => {
    if (!isOnline) {
      toast.error(isHi ? "वाइटल्स लॉगिंग केवल ऑनलाइन ही उपलब्ध है।" : "Vitals logging is online-only. Connect to the internet to submit.");
      return;
    }
    const symptomsString = selectedSymptoms.join(', ');
    try {
      await logVitals({
        variables: {
          input: {
            mood,
            sleepHours,
            hydrationWater,
            nutritionCalories,
            nutritionMealNotes,
            systolicBp: values.systolicBp ? parseInt(values.systolicBp, 10) : null,
            diastolicBp: values.diastolicBp ? parseInt(values.diastolicBp, 10) : null,
            bloodGlucose: values.bloodGlucose ? parseFloat(values.bloodGlucose) : null,
            weightKg: values.weightKg ? parseFloat(values.weightKg) : null,
            symptoms: symptomsString || null
          }
        }
      });
      vitalsForm.resetFields();
      setSelectedSymptoms([]);
      setMood(null);
      toast.success(isHi ? "वाइटल्स सफलतापूर्वक लॉग किए गए!" : "Medical vitals logged successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddAppointment = async () => {
    if (!isOnline) {
      toast.error("Appointments logging is online-only.");
      return;
    }
    if (!appTitle || !appDoctor || !appDate) {
      toast.error(isHi ? "कृपया आवश्यक फ़ील्ड भरें।" : "Please fill in the required fields.");
      return;
    }
    try {
      await addAppointment({
        variables: {
          title: appTitle,
          doctorName: appDoctor,
          appointmentDate: appDate.toISOString(),
          notes: appNotes || null
        }
      });
      setAppTitle('');
      setAppDoctor('');
      setAppDate(null);
      setAppNotes('');
      toast.success(isHi ? "नियुक्ति जोड़ी गई!" : "Appointment scheduled successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddMedicine = async () => {
    if (!isOnline) {
      toast.error("Medicine logs are online-only.");
      return;
    }
    if (!newMedName || !newMedDosage) {
      toast.error(isHi ? "दवा का नाम और खुराक दर्ज करें।" : "Enter medicine name and dosage details.");
      return;
    }
    try {
      await addMedicine({
        variables: {
          name: newMedName,
          dosage: newMedDosage,
          reminderTime: newMedTime
        }
      });
      setNewMedName('');
      setNewMedDosage('');
      toast.success(isHi ? "दवा अनुस्मारक जोड़ा गया!" : "Medicine reminder added successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddBagItem = async () => {
    if (!newBagItemName) return;
    try {
      await addBagItem({
        variables: {
          itemName: newBagItemName,
          category: newBagCategory
        }
      });
      setNewBagItemName('');
      toast.success(isHi ? "बैग आइटम जोड़ा गया!" : "Hospital bag item added!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!isOnline) {
    return (
      <div>
        <EnterprisePageHeader
          activeRole="MOTHER"
          kicker="Health & Wellness"
          title="Daily Tasks & Vitals Tracker"
          subtitle="Treat vital medical details with security. These are online-only by default."
        />
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <WifiOutlined style={{ fontSize: '48px', color: theme.primaryColor, marginBottom: '16px' }} />
          <Title level={4}>Vitals tracker is offline</Title>
          <Paragraph type="secondary">
            Daily logs, medical measurements (blood pressure, glucose), appointments, and prescription lists are securely stored online. Please connect to the internet to record or review this information.
          </Paragraph>
        </div>
      </div>
    );
  }

  return (
    <div>
      <EnterprisePageHeader
        activeRole="MOTHER"
        kicker="Health & Wellness"
        title="Daily Tasks & Vitals Tracker"
        subtitle="Log and monitor your daily wellness parameters, symptoms, appointments, and medicine checklists."
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* Vitals Tab */}
        <Tabs.TabPane tab={isHi ? "वाइटल्स लॉग करें" : "Daily Logs & Vitals"} key="vitals">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <EnterpriseCard activeRole="MOTHER" title={isHi ? "आज के वाइटल्स दर्ज करें" : "Log Today's Vitals"} hoverable={false}>
                <Form form={vitalsForm} layout="vertical" onFinish={handleLogVitals}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="systolicBp" label="Systolic BP (mmHg)">
                        <InputNumber min={60} max={200} style={{ width: '100%' }} placeholder="e.g. 120" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="diastolicBp" label="Diastolic BP (mmHg)">
                        <InputNumber min={40} max={120} style={{ width: '100%' }} placeholder="e.g. 80" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="bloodGlucose" label="Glucose (mg/dL)">
                        <InputNumber min={40} max={300} style={{ width: '100%' }} placeholder="e.g. 95" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="weightKg" label="Weight (Kg)">
                        <InputNumber min={30} max={180} step={0.1} style={{ width: '100%' }} placeholder="e.g. 68.5" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Symptoms Felt Today:">
                    <Checkbox.Group 
                      options={SYMPTOM_OPTIONS} 
                      value={selectedSymptoms} 
                      onChange={setSelectedSymptoms} 
                    />
                  </Form.Item>

                  <Divider style={{ margin: '12px 0' }} />

                  {/* Sleep and Hydration */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Sleep Hours: {sleepHours} hrs</Text>
                      <Slider min={4} max={12} step={0.5} value={sleepHours} onChange={setSleepHours} />
                    </Col>
                    <Col span={12}>
                      <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Water Intake: {hydrationWater} L</Text>
                      <Slider min={1.0} max={5.0} step={0.25} value={hydrationWater} onChange={setHydrationWater} />
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" block style={{ marginTop: '16px', fontWeight: 'bold' }}>
                    {isHi ? "वाइटल्स सहेजें" : "Save Logs"}
                  </Button>
                </Form>
              </EnterpriseCard>
            </Col>

            <Col xs={24} lg={12}>
              {trendFeedback && trendFeedback.length > 0 && (
                <Alert 
                  message={isHi ? "दैनिक स्वास्थ्य विश्लेषण" : "Daily Health Insights"}
                  description={
                    <List 
                      size="small" 
                      dataSource={trendFeedback} 
                      renderItem={item => <List.Item style={{ border: 0, padding: '4px 0' }}>{item}</List.Item>} 
                    />
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: '24px', borderRadius: '16px' }}
                />
              )}

              <EnterpriseCard activeRole="MOTHER" title={isHi ? "नवीनतम लॉग इतिहास" : "Recent Vitals History"} hoverable={false}>
                {logs.length > 0 ? (
                  <Table 
                    dataSource={logs.slice(0, 5)} 
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: 'Date',
                        dataIndex: 'logDate',
                        render: (text) => new Date(text).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      },
                      {
                        title: 'BP',
                        render: (_, record) => record.systolicBp ? `${record.systolicBp}/${record.diastolicBp}` : '-'
                      },
                      {
                        title: 'Weight',
                        dataIndex: 'weightKg',
                        render: (val) => val ? `${val}kg` : '-'
                      },
                      {
                        title: 'Glucose',
                        dataIndex: 'bloodGlucose',
                        render: (val) => val ? `${val}mg/dL` : '-'
                      }
                    ]}
                  />
                ) : (
                  <EnterpriseEmptyState title="No logs recorded" description="Vitals logs history will appear here." />
                )}
              </EnterpriseCard>
            </Col>
          </Row>
        </Tabs.TabPane>

        {/* Appointments Tab */}
        <Tabs.TabPane tab={isHi ? "चिकित्सक नियुक्तियां" : "Appointments"} key="appointments">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <EnterpriseCard activeRole="MOTHER" title="Schedule Appointment" hoverable={false}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong style={{ fontSize: '11px' }}>Title / Purpose:</Text>
                    <Input value={appTitle} onChange={(e) => setAppTitle(e.target.value)} placeholder="e.g. Regular Ultrasound checkup" />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '11px' }}>Doctor Name:</Text>
                    <Input value={appDoctor} onChange={(e) => setAppDoctor(e.target.value)} placeholder="e.g. Dr. Shruti Shah" />
                  </div>
                  <div>
                    <Text strong style={{ display: 'block', fontSize: '11px', marginBottom: '8px' }}>Date & Time:</Text>
                    <DatePicker 
                      showTime
                      style={{ width: '100%' }} 
                      value={appDate} 
                      onChange={setAppDate} 
                    />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '11px' }}>Notes:</Text>
                    <Input.TextArea value={appNotes} onChange={(e) => setAppNotes(e.target.value)} placeholder="Consultation room number, special advice etc." />
                  </div>
                  <Button type="primary" onClick={handleAddAppointment} block>Add Appointment</Button>
                </Space>
              </EnterpriseCard>
            </Col>

            <Col xs={24} lg={14}>
              <EnterpriseCard activeRole="MOTHER" title="Scheduled Appointments List" hoverable={false}>
                <List
                  dataSource={appointments}
                  renderItem={app => (
                    <List.Item
                      actions={[
                        <Button 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={async () => {
                            try {
                              await deleteAppointment({ variables: { id: app.id } });
                              toast.success("Appointment deleted.");
                            } catch (e) {
                              toast.error(e.message);
                            }
                          }}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        title={app.title}
                        description={`Doctor: ${app.doctorName} • Date: ${new Date(app.appointmentDate).toLocaleString()}`}
                      />
                    </List.Item>
                  )}
                />
              </EnterpriseCard>
            </Col>
          </Row>
        </Tabs.TabPane>

        {/* Medicines Tab */}
        <Tabs.TabPane tab={isHi ? "दवा अनुस्मारक" : "Medicines & Reminders"} key="medicine">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <EnterpriseCard activeRole="MOTHER" title="Add Prescription Reminder" hoverable={false}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong style={{ fontSize: '11px' }}>Medicine Name:</Text>
                    <Input value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="e.g. Iron Supplement" />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '11px' }}>Dosage Description:</Text>
                    <Input value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} placeholder="e.g. 1 Tablet daily after lunch" />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '11px' }}>Time Trigger (HH:MM):</Text>
                    <Input value={newMedTime} onChange={(e) => setNewMedTime(e.target.value)} placeholder="e.g. 08:30" />
                  </div>
                  <Button type="primary" onClick={handleAddMedicine} block>Add Reminder</Button>
                </Space>
              </EnterpriseCard>
            </Col>

            <Col xs={24} lg={14}>
              <EnterpriseCard activeRole="MOTHER" title="Prescriptions Reminder List" hoverable={false}>
                <List
                  dataSource={medicines}
                  renderItem={med => (
                    <List.Item
                      actions={[
                        <Checkbox 
                          checked={med.isActive} 
                          onChange={async () => {
                            try {
                              await toggleMedicine({ variables: { id: med.id } });
                              toast.success("Reminder status updated.");
                            } catch (e) {
                              toast.error(e.message);
                            }
                          }}
                        />,
                        <Button 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={async () => {
                            try {
                              await deleteMedicine({ variables: { id: med.id } });
                              toast.success("Reminder removed.");
                            } catch (e) {
                              toast.error(e.message);
                            }
                          }}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        title={med.name}
                        description={`Dosage: ${med.dosage} • Alert Time: ${med.reminderTime}`}
                      />
                    </List.Item>
                  )}
                />
              </EnterpriseCard>
            </Col>
          </Row>
        </Tabs.TabPane>

        {/* Hospital Bag Tab */}
        <Tabs.TabPane tab={isHi ? "हॉस्पिटल बैग चेकलिस्ट" : "Hospital Bag"} key="bag">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <EnterpriseCard activeRole="MOTHER" title="Add Bag Checklist Item" hoverable={false}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong style={{ fontSize: '11px' }}>Item Name:</Text>
                    <Input value={newBagItemName} onChange={(e) => setNewBagItemName(e.target.value)} placeholder="e.g. Baby Swaddle Cloth" />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '11px' }}>Category:</Text>
                    <Select 
                      value={newBagCategory} 
                      onChange={setNewBagCategory} 
                      style={{ width: '100%' }}
                      options={[
                        { value: 'mother', label: 'For Mother' },
                        { value: 'baby', label: 'For Baby' },
                        { value: 'documents', label: 'Documents / Records' }
                      ]}
                    />
                  </div>
                  <Button type="primary" onClick={handleAddBagItem} block>Add to List</Button>
                </Space>
              </EnterpriseCard>
            </Col>

            <Col xs={24} lg={14}>
              <EnterpriseCard activeRole="MOTHER" title="Packed checklist progress" hoverable={false}>
                <Progress percent={packedPercentage} strokeColor={theme.primaryColor} style={{ marginBottom: '20px' }} />
                <List
                  dataSource={bagItems}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Checkbox 
                          checked={item.packed} 
                          onChange={async () => {
                            try {
                              await toggleBagItem({ variables: { id: item.id } });
                              toast.success("Bag item status updated.");
                            } catch (e) {
                              toast.error(e.message);
                            }
                          }}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        title={item.itemName}
                        description={`Category: ${item.category}`}
                      />
                    </List.Item>
                  )}
                />
                {bagItems.length > 0 && (
                  <Button 
                    danger 
                    type="dashed" 
                    onClick={async () => {
                      try {
                        await clearPackedBagItems();
                        toast.success("Packed items checklist cleared.");
                      } catch (e) {
                        toast.error(e.message);
                      }
                    }}
                    style={{ marginTop: '16px' }}
                  >
                    Clear Packed Items List
                  </Button>
                )}
              </EnterpriseCard>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

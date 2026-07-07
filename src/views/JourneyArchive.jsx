import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Card, Typography, Row, Col, Progress, Tag, Tabs, List, Select, Button, Space, Skeleton, Divider, Alert } from 'antd';
import { CalendarOutlined, HeartOutlined, SaveOutlined, TrophyOutlined, SmileOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { GET_JOURNEY_ARCHIVE_QUERY, SAVE_POSTPARTUM_PLAN_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';

const { Title, Paragraph, Text } = Typography;

export default function JourneyArchive({ user, t, lang }) {
  const isHi = lang === 'hi';
  const isGu = lang === 'gu';

  const { data, loading, error, refetch } = useQuery(GET_JOURNEY_ARCHIVE_QUERY);
  const [savePlan, { loading: savingPlan }] = useMutation(SAVE_POSTPARTUM_PLAN_MUTATION);

  // Postpartum planner states
  const [deliveryType, setDeliveryType] = useState('Vaginal');
  const [feedChoice, setFeedChoice] = useState('Breastfeeding');
  const [supportLevel, setSupportLevel] = useState('Family');
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    if (user?.postpartumPlan) {
      try {
        const parsed = JSON.parse(user.postpartumPlan);
        if (parsed.deliveryType) setDeliveryType(parsed.deliveryType);
        if (parsed.feedChoice) setFeedChoice(parsed.feedChoice);
        if (parsed.supportLevel) setSupportLevel(parsed.supportLevel);
        setActivePlan(parsed);
      } catch (e) {
        // Fallback
      }
    }
  }, [user]);

  if (loading) return <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>;
  if (error) return <Alert type="error" message={isHi ? "संग्रह लोड नहीं किया जा सका" : "Journey archive could not be loaded."} />;

  const archive = data?.myJourneyArchive || { pregnancyDay: 1, weekNumber: 1, trimesterSummary: [] };

  const handleSavePlan = async () => {
    const planObj = { deliveryType, feedChoice, supportLevel };
    try {
      await savePlan({
        variables: {
          planJson: JSON.stringify(planObj)
        }
      });
      setActivePlan(planObj);
      toast.success(isHi ? "पोस्टपार्टम योजना सफलतापूर्वक सहेजी गई!" : "Postpartum transition plan saved successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getTrimesterTitle = (num) => {
    if (num === 1) return isHi ? "पहली तिमाही: प्राण संचार (T1)" : "Trimester 1: Prana Sanchar";
    if (num === 2) return isHi ? "दूसरी तिमाही: इंद्रिय संचार (T2)" : "Trimester 2: Indriya Sanchar";
    return isHi ? "तीसरी तिमाही: चेतना संचार (T3)" : "Trimester 3: Chetana Sanchar";
  };

  // Structured Postpartum Checklist generator
  const getPostpartumRoadmap = () => {
    const list = [
      {
        phase: isHi ? "सप्ताह 1: आराम और रिकवरी" : "Week 1: Immediate Healing & REST",
        tasks: [
          deliveryType === 'C-Section' 
            ? (isHi ? "टांके की देखभाल करें और भारी सामान उठाने से बचें।" : "Monitor surgical incision site and avoid lifting anything heavier than the baby.")
            : (isHi ? "पैल्विक रेस्ट और गुनगुने पानी के स्नान (Sitz Bath) का उपयोग करें।" : "Practice pelvic rest and utilize sitz baths for perineal healing."),
          feedChoice === 'Breastfeeding'
            ? (isHi ? "स्तनपान की स्थिति और लैचिंग का अभ्यास करें।" : "Establish lactation holds, latch support, and nurse on demand.")
            : (isHi ? "स्तनों की सूजन कम करने के लिए ठंडी सिकाई का उपयोग करें।" : "Manage engorgement with cool compresses and establish formula schedule."),
          isHi ? "दिन में कम से कम 8-10 गिलास गुनगुना पानी पिएं।" : "Hydrate frequently with warm fluids and traditional broths."
        ]
      },
      {
        phase: isHi ? "सप्ताह 2-6: बंधन और भावनात्मक स्वास्थ्य" : "Weeks 2-6: Bonding & Emotional Check-in",
        tasks: [
          isHi ? "हल्की टहलकदमी (10-15 मिनट) और गहरी सांस लेने का अभ्यास करें।" : "Gentle walking and deep belly breathing to reconnect core muscles.",
          isHi ? "नवजात शिशु के सोने के समय खुद भी सोने का प्रयास करें।" : "Prioritize sleep synchronization with the newborn's rest cycles.",
          supportLevel === 'None'
            ? (isHi ? "स्थानीय सामुदायिक सहायता समूहों से जुड़ें।" : "Join local community support groups for postpartum mothers.")
            : (isHi ? "परिवार के सदस्यों को घर के कामों की जिम्मेदारी सौंपें।" : "Delegate household chores to family members to minimize fatigue.")
        ]
      },
      {
        phase: isHi ? "सप्ताह 6+: नियमित दिनचर्या में वापसी" : "Weeks 6+: Return to Routine",
        tasks: [
          isHi ? "डॉक्टर से पोस्टपार्टम चेकअप कराएं और व्यायाम की अनुमति लें।" : "Schedule your 6-week postpartum OB/GYN clearance checkup.",
          isHi ? "हल्के पेल्विक फ्लोर (केगेल) व्यायाम शुरू करें।" : "Gradually reintroduce pelvic floor (Kegel) and core rehab exercises.",
          isHi ? "शिशु के टीकाकरण चक्र का चार्ट अपडेट करें।" : "Keep pediatrician vaccination track-chart updated."
        ]
      }
    ];
    return list;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fffbeb 100%)', 
        padding: '32px', 
        borderRadius: '30px', 
        border: '1px solid #fbcfe8',
        marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.01)'
      }}>
        <Row align="middle" gutter={24}>
          <Col xs={24} md={16}>
            <Tag color="magenta" style={{ marginBottom: '8px', fontWeight: 'bold' }}>✨ ARCHIVE & TRANSITION</Tag>
            <Title level={2} style={{ color: 'var(--brand-maroon-dark)', margin: 0 }}>
              {isHi ? "आपकी गर्भावस्था यात्रा संग्रह" : "Your Pregnancy Journey Archive"}
            </Title>
            <Paragraph type="secondary" style={{ marginTop: '8px', fontSize: '15px' }}>
              {isHi 
                ? `दिन ${archive.pregnancyDay} (सप्ताह ${archive.weekNumber}) पर आपकी संपूर्ण यात्रा की प्रगति और आने वाले पोस्टपार्टम जीवन की तैयारी का अवलोकन।`
                : `Comprehensive overview of your metrics on Day ${archive.pregnancyDay} (Week ${archive.weekNumber}) and your customizable roadmap for postpartum life.`}
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '20px', display: 'inline-block', border: '1px solid #fed7aa' }}>
              <TrophyOutlined style={{ fontSize: '32px', color: '#f59e0b', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#64748b' }}>{isHi ? "सक्रिय दिन" : "Journey Progress"}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brand-maroon-dark)' }}>{archive.pregnancyDay} Days</div>
            </div>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Side: Trimester Archival Metrics */}
        <Col xs={24} lg={14}>
          <Card 
            title={<><CalendarOutlined /> {isHi ? "तिमाही प्रगति एवं आंकड़े" : "Trimester Progress & Metrics"}</>}
            style={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}
          >
            <Tabs defaultActiveKey="2" type="card">
              {archive.trimesterSummary.map(summary => (
                <Tabs.TabPane tab={`Trimester ${summary.trimesterNumber}`} key={String(summary.trimesterNumber)}>
                  <div style={{ padding: '12px 0' }}>
                    <Title level={4} style={{ color: 'var(--brand-maroon-dark)', marginBottom: '20px' }}>
                      {getTrimesterTitle(summary.trimesterNumber)}
                    </Title>

                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card style={{ background: '#fafaf9', borderRadius: '16px', border: 'none', textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{isHi ? "गतिविधियां पूर्ण" : "Activities Completed"}</Text>
                          <Title level={3} style={{ margin: '8px 0', color: '#059669' }}>
                            {summary.totalActivitiesCompleted} 🧘‍♀️
                          </Title>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card style={{ background: '#fafaf9', borderRadius: '16px', border: 'none', textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{isHi ? "महत्वपूर्ण आँकड़े लॉग" : "Vitals Tracked"}</Text>
                          <Title level={3} style={{ margin: '8px 0', color: '#2563eb' }}>
                            {summary.vitalsLoggedCount} 🩺
                          </Title>
                        </Card>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '20px 0' }} />

                    <Title level={5} style={{ color: '#1e293b', marginBottom: '12px' }}>📊 {isHi ? "स्वस्थता औसत" : "Wellness Averages"}</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Text style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>{isHi ? "औसत नींद" : "Average Sleep"}</Text>
                        <Text strong style={{ fontSize: '18px', color: '#475569' }}>
                          {summary.averageSleepHours != null ? `${summary.averageSleepHours} hrs` : (isHi ? "डेटा उपलब्ध नहीं" : "No logs")}
                        </Text>
                      </Col>
                      <Col span={12}>
                        <Text style={{ display: 'block', fontSize: '13px', color: '#64748b' }}>{isHi ? "औसत पानी सेवन" : "Average Hydration"}</Text>
                        <Text strong style={{ fontSize: '18px', color: '#0284c7' }}>
                          {summary.averageHydrationWater != null ? `${summary.averageHydrationWater} ml` : (isHi ? "डेटा उपलब्ध नहीं" : "No logs")}
                        </Text>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '20px 0' }} />

                    <Title level={5} style={{ color: '#1e293b', marginBottom: '12px' }}>🎭 {isHi ? "मनोदशा वितरण" : "Mood Distribution"}</Title>
                    {summary.moodFrequencyDistribution.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {summary.moodFrequencyDistribution.map(m => (
                          <Tag color="pink" key={m.mood} style={{ padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                            {m.mood}: {m.count} {isHi ? "बार" : "logs"}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <Paragraph type="secondary" style={{ fontSize: '13px' }}>
                        {isHi ? "इस तिमाही में कोई मनोदशा डेटा दर्ज नहीं किया गया।" : "No mood data recorded in this trimester."}
                      </Paragraph>
                    )}
                  </div>
                </Tabs.TabPane>
              ))}
            </Tabs>
          </Card>
        </Col>

        {/* Right Side: Postpartum Planner */}
        <Col xs={24} lg={10}>
          <Card 
            title={<><HeartOutlined /> {isHi ? "पोस्टपार्टम संक्रमण योजना" : "Postpartum Transition Planner"}</>}
            style={{ borderRadius: '24px', border: '1px solid #fbcfe8', boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}
          >
            <Paragraph style={{ fontSize: '13px', color: '#64748b' }}>
              {isHi 
                ? "अपनी डिलीवरी पद्धति, नवजात शिशु आहार विकल्प और पारिवारिक सहायता के आधार पर एक कस्टमाइज्ड रिकवरी प्लान बनाएं।"
                : "Configure a custom recovery checklist based on your planned delivery method and baby nutrition options."}
            </Paragraph>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                  {isHi ? "प्रसव प्रकार (Delivery Type)" : "Delivery Type"}
                </Text>
                <Select 
                  value={deliveryType} 
                  onChange={setDeliveryType} 
                  style={{ width: '100%' }}
                  options={[
                    { value: 'Vaginal', label: isHi ? 'सामान्य प्रसव (Vaginal)' : 'Vaginal Delivery' },
                    { value: 'C-Section', label: isHi ? 'सिजेरियन प्रसव (C-Section)' : 'C-Section Delivery' }
                  ]}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                  {isHi ? "पोषण विकल्प (Nutrition Choice)" : "Nutrition Preference"}
                </Text>
                <Select 
                  value={feedChoice} 
                  onChange={setFeedChoice} 
                  style={{ width: '100%' }}
                  options={[
                    { value: 'Breastfeeding', label: isHi ? 'स्तनपान (Breastfeeding)' : 'Breastfeeding' },
                    { value: 'Formula', label: isHi ? 'फार्मूला दूध (Formula)' : 'Formula Feeding' }
                  ]}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                  {isHi ? "पारिवारिक सहायता (Support Network)" : "Support Level"}
                </Text>
                <Select 
                  value={supportLevel} 
                  onChange={setSupportLevel} 
                  style={{ width: '100%' }}
                  options={[
                    { value: 'None', label: isHi ? 'कोई अतिरिक्त सहायता नहीं' : 'No local support' },
                    { value: 'Family', label: isHi ? 'परिवार/मित्र' : 'Family Support' },
                    { value: 'Professional', label: isHi ? 'पेशेवर दाई/नर्स' : 'Professional Care' }
                  ]}
                />
              </div>

              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                loading={savingPlan} 
                onClick={handleSavePlan}
                style={{ background: '#be123c', borderColor: '#be123c', borderRadius: '10px', height: '40px', fontWeight: 'bold', marginTop: '10px' }}
                block
              >
                {isHi ? "योजना सहेजें" : "Save Transition Plan"}
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Render Active Roadmap Timeline Checklist */}
      <Card 
        style={{ 
          marginTop: '24px', 
          borderRadius: '24px', 
          border: '1px solid #fed7aa',
          background: 'linear-gradient(to bottom, #fff, #fffbeb)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircleOutlined style={{ fontSize: '24px', color: '#ea580c' }} />
          <Title level={4} style={{ margin: 0, color: 'var(--brand-maroon-dark)' }}>
            📋 {isHi ? "आपका पोस्टपार्टम रिकवरी रोडमैप" : "Your Postpartum Recovery Roadmap"}
          </Title>
        </div>

        <Row gutter={[24, 24]}>
          {getPostpartumRoadmap().map((phaseObj, index) => (
            <Col xs={24} md={8} key={index}>
              <Card style={{ borderRadius: '16px', border: '1px solid #ffedd5', height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                <Text strong style={{ display: 'block', color: '#ea580c', marginBottom: '12px', fontSize: '14px' }}>
                  {phaseObj.phase}
                </Text>
                <List 
                  size="small"
                  dataSource={phaseObj.tasks}
                  renderItem={item => (
                    <List.Item style={{ padding: '8px 0', border: 'none', alignItems: 'flex-start', gap: '6px' }}>
                      <span>🌸</span>
                      <Text style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}>{item}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

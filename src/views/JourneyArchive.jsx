import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Card, Typography, Row, Col, Progress, Tag, Tabs, List, Select, Button, Space, Skeleton, Divider, Alert } from 'antd';
import { CalendarOutlined, HeartOutlined, SaveOutlined, TrophyOutlined, SmileOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { GET_JOURNEY_ARCHIVE_QUERY, SAVE_POSTPARTUM_PLAN_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';
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

export default function JourneyArchive({ user, t, lang }) {
  const isHi = lang === 'hi';
  const theme = getRoleTheme('MOTHER');

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

  if (loading) return <EnterpriseLoading type="card" count={2} />;
  if (error) return <EnterpriseErrorState error={error} activeRole="MOTHER" />;

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

  const progressWidget = (
    <div style={{ background: '#fff', padding: '12px 18px', borderRadius: '16px', border: `1px solid ${theme.borderColor}`, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <TrophyOutlined style={{ fontSize: '24px', color: '#f59e0b' }} />
      <div>
        <div style={{ fontSize: '10px', color: theme.textSecondary, textTransform: 'uppercase' }}>
          {isHi ? "सक्रिय दिन" : "Journey Progress"}
        </div>
        <strong style={{ fontSize: '16px', color: theme.textPrimary }}>
          {archive.pregnancyDay} Days
        </strong>
      </div>
    </div>
  );

  return (
    <div>
      <EnterprisePageHeader
        activeRole="MOTHER"
        title="Pregnancy Journey Archive"
        subtitle="Review and preserve completed pregnancy journeys."
        actions={progressWidget}
      />

      <Row gutter={[24, 24]}>
        {/* Left Side: Trimester Archival Metrics */}
        <Col xs={24} lg={14}>
          <EnterpriseCard 
            activeRole="MOTHER"
            title={isHi ? "तिमाही प्रगति एवं आंकड़े" : "Trimester Progress & Metrics"}
            hoverable={false}
          >
            <Tabs defaultActiveKey="1" type="card">
              {archive.trimesterSummary.map((summary, index) => (
                <Tabs.TabPane tab={`Trimester ${summary.trimesterNumber}`} key={String(summary.trimesterNumber || index)}>
                  <div style={{ padding: '12px 0' }}>
                    <Title level={4} style={{ color: theme.primaryColor, marginBottom: '20px' }}>
                      {getTrimesterTitle(summary.trimesterNumber)}
                    </Title>

                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card style={{ background: '#fffcfc', borderRadius: '16px', border: `1px solid ${theme.borderColor}`, textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{isHi ? "गतिविधियां पूर्ण" : "Activities Completed"}</Text>
                          <Title level={3} style={{ margin: '8px 0', color: '#287a55' }}>
                            {summary.totalActivitiesCompleted} 🧘‍♀️
                          </Title>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card style={{ background: '#fffcfc', borderRadius: '16px', border: `1px solid ${theme.borderColor}`, textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{isHi ? "महत्वपूर्ण आँकड़े लॉग" : "Vitals Tracked"}</Text>
                          <Title level={3} style={{ margin: '8px 0', color: theme.primaryColor }}>
                            {summary.vitalsLoggedCount} 🩺
                          </Title>
                        </Card>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '20px 0' }} />

                    <Title level={5} style={{ color: theme.textPrimary, marginBottom: '12px' }}>📊 {isHi ? "स्वस्थता औसत" : "Wellness Averages"}</Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Text style={{ display: 'block', fontSize: '13px', color: theme.textSecondary }}>{isHi ? "औसत नींद" : "Average Sleep"}</Text>
                        <Text strong style={{ fontSize: '18px', color: theme.textPrimary }}>
                          {summary.averageSleepHours != null ? `${summary.averageSleepHours} hrs` : (isHi ? "डेटा उपलब्ध नहीं" : "No logs")}
                        </Text>
                      </Col>
                      <Col span={12}>
                        <Text style={{ display: 'block', fontSize: '13px', color: theme.textSecondary }}>{isHi ? "औसत पानी सेवन" : "Average Hydration"}</Text>
                        <Text strong style={{ fontSize: '18px', color: theme.primaryColor }}>
                          {summary.averageHydrationWater != null ? `${summary.averageHydrationWater} ml` : (isHi ? "डेटा उपलब्ध नहीं" : "No logs")}
                        </Text>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '20px 0' }} />

                    <Title level={5} style={{ color: theme.textPrimary, marginBottom: '12px' }}>🎭 {isHi ? "मनोदशा वितरण" : "Mood Distribution"}</Title>
                    {summary.moodFrequencyDistribution.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {summary.moodFrequencyDistribution.map(m => (
                          <Tag color="rose" key={m.mood} style={{ padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
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
          </EnterpriseCard>
        </Col>

        {/* Right Side: Postpartum Transition Planner */}
        <Col xs={24} lg={10}>
          <EnterpriseCard 
            activeRole="MOTHER"
            title={isHi ? "पोस्टपार्टम केयर प्लानर" : "Postpartum Transition Planner"}
            hoverable={false}
          >
            <Paragraph type="secondary" style={{ fontSize: '13px', marginBottom: '20px' }}>
              {isHi
                ? "प्रसव के बाद के नाजुक हफ्तों में एक सुचारू और शांतिपूर्ण शारीरिक रिकवरी की योजना बनाएं।"
                : "Plan a supportive roadmap for physical healing, lactation bonding, and family help post-delivery."}
            </Paragraph>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ display: 'block', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {isHi ? "प्रसव प्रकार का चयन" : "Delivery Type Preference:"}
                </Text>
                <Select 
                  value={deliveryType} 
                  onChange={setDeliveryType} 
                  style={{ width: '100%' }}
                  options={[
                    { value: 'Vaginal', label: 'Vaginal Birth' },
                    { value: 'C-Section', label: 'C-Section Birth' }
                  ]}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {isHi ? "स्तनपान / नवजात शिशु पोषण" : "Infant Feeding Choice:"}
                </Text>
                <Select 
                  value={feedChoice} 
                  onChange={setFeedChoice} 
                  style={{ width: '100%' }}
                  options={[
                    { value: 'Breastfeeding', label: 'Exclusive Breastfeeding' },
                    { value: 'Formula', label: 'Formula Feeding' },
                    { value: 'Mixed', label: 'Mixed Feed Strategy' }
                  ]}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {isHi ? "घरेलू सहयोग स्तर" : "Support Level Available:"}
                </Text>
                <Select 
                  value={supportLevel} 
                  onChange={setSupportLevel} 
                  style={{ width: '100%' }}
                  options={[
                    { value: 'Family', label: 'Family/Relatives at Home' },
                    { value: 'HiredHelp', label: 'Hired Postpartum Care Nurse' },
                    { value: 'None', label: 'Minimal (Only Partner & Self)' }
                  ]}
                />
              </div>

              <Button
                type="primary"
                block
                icon={<SaveOutlined />}
                loading={savingPlan}
                onClick={handleSavePlan}
                style={{ borderRadius: '10px', height: '40px', fontWeight: 'bold' }}
              >
                {isHi ? "योजना सहेजें" : "Save Transition Plan"}
              </Button>
            </Space>
          </EnterpriseCard>

          {activePlan && (
            <div style={{ marginTop: '24px' }}>
              <Title level={5} style={{ color: theme.textPrimary, marginBottom: '12px' }}>
                📋 {isHi ? "अनुकूलित पोस्टपार्टम रोडमैप" : "Your Custom Postpartum Roadmap"}
              </Title>
              {getPostpartumRoadmap().map((phase, idx) => (
                <EnterpriseCard 
                  activeRole="MOTHER" 
                  key={idx} 
                  style={{ marginBottom: '12px' }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Text strong style={{ color: theme.primaryColor, display: 'block', marginBottom: '8px' }}>
                    {phase.phase}
                  </Text>
                  <List
                    size="small"
                    dataSource={phase.tasks}
                    renderItem={item => (
                      <List.Item style={{ padding: '6px 0', border: 0 }}>
                        <Text style={{ fontSize: '12px', color: theme.textSecondary }}>
                          <CheckCircleOutlined style={{ color: '#287a55', marginRight: 6 }} /> {item}
                        </Text>
                      </List.Item>
                    )}
                  />
                </EnterpriseCard>
              ))}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}

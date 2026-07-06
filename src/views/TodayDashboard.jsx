import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DAILY_CONTENT_QUERY, GET_BABY_DEVELOPMENT_QUERY } from '../graphql/operations';
import toast from 'react-hot-toast';
import { 
  Card, 
  Slider, 
  Progress, 
  Typography, 
  Row, 
  Col, 
  Button, 
  Checkbox, 
  Input, 
  Tag, 
  Space, 
  Divider 
} from 'antd';
import { 
  PlayCircleOutlined, 
  DownloadOutlined, 
  SoundOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

function getQuotientContent(selectedDay, content, userLanguage) {
  const isHi = userLanguage === 'hi';
  const isGu = userLanguage === 'gu';
  
  const defaults = {
    PQ: {
      title: isHi ? "शारीरिक स्वास्थ्य (Physical Quotient)" : (isGu ? "શારીરિક સ્વાસ્થ્ય (Physical Quotient)" : "Physical Wellness (PQ)"),
      description: isHi 
        ? "आज 15 मिनट के लिए प्रसव-पूर्व तितली खिंचाव और गहरी श्वास क्रिया करें। प्रचुर मात्रा में पानी पिएं और मौसमी फल खाएं।" 
        : (isGu 
          ? "આજે ૧૫ મિનિટ માટે હળવા પતંગિયા આસન (બટરફ્લાય સ્ટ્રેચ) અને ઊંડા શ્વાસોચ્છવાસ (પ્રાણાયામ) કરો. નાળિયેર પાણી અને મોસમી ફળો લો." 
          : "Practice 15 minutes of gentle butterfly stretches and deep pranayama breathing today. Hydrate with coconut water and seasonal fruits."),
      icon: "🧘‍♀️",
      actionLabel: isHi ? "आहार एवं योग चार्ट" : (isGu ? "આહાર અને યોગ ચાર્ટ" : "View Diet & Yoga"),
      category: "yoga"
    },
    IQ: {
      title: isHi ? "बौद्धिक स्वास्थ्य (Intelligence Quotient)" : (isGu ? "બૌદ્ધિક સ્વાસ્થ્ય (Intelligence Quotient)" : "Intelligence Development (IQ)"),
      description: isHi 
        ? "एक पहेली या वर्ग पहेली खेलें। गर्भ में पल रहे शिशु के संज्ञानात्मक विकास के लिए आज 10 मिनट कुछ नया पढ़ने में व्यतीत करें।" 
        : (isGu 
          ? "આજે એક કોયડો અથવા તાર્કિક રમત રમો. ગર્ભસ્થ શિશુના જ્ઞાનાત્મક વિકાસ માટે આજે ૧૦ મિનિટ કંઈક નવું વાંચવા માટે વિતાવો." 
          : "Solve a puzzle or play a logic game today. Nurture your baby's cognitive development by reading an educational story for 10 minutes."),
      icon: "🧠",
      actionLabel: isHi ? "तार्किक खेल खेलें" : (isGu ? "કોયડો ઉકેલો" : "Solve Puzzle"),
      category: "story"
    },
    EQ: {
      title: isHi ? "भावनात्मक स्वास्थ्य (Emotional Quotient)" : (isGu ? "ભાવનાત્મક સ્વાસ્થ્ય (Emotional Quotient)" : "Emotional Bonding (EQ)"),
      description: isHi 
        ? "गर्भ संवाद: अपने हाथों को अपने पेट पर धीरे से रखें और मुस्कुराते हुए शिशु से बातें करें। कहें कि हम सब आपका स्वागत करने के लिए उत्सुक हैं।" 
        : (isGu 
          ? "ગર્ભ સંવાદ: તમારા હાથ તમારા પેટ પર હળવેથી રાખો, હસો અને ગર્ભસ્થ શિશુ સાથે વાત કરો: 'અમે તમને ખૂબ પ્રેમ કરીએ છીએ, તમે અમારા માટે એક આશીર્વાદ છો.'" 
          : "Garbh Samvad: Place your hands on your belly, smile, and speak to your unborn child: 'We love you, you are a blessing to us.'"),
      icon: "❤️",
      actionLabel: isHi ? "संवाद अभ्यास" : (isGu ? "ગર્ભ સંવાદ કરો" : "Practice Bonding"),
      category: "dialogue"
    },
    SQ: {
      title: isHi ? "आध्यात्मिक स्वास्थ्य (Spiritual Quotient)" : (isGu ? "આધ્યાત્મિક સ્વાસ્થ્ય (Spiritual Quotient)" : "Spiritual Aura (SQ)"),
      description: isHi 
        ? "आज शांति से गायत्री मंत्र का 11 बार उच्चारण करें। सकारात्मक दिव्य ऊर्जा प्रवाह पर ध्यान केंद्रित करते हुए 10 मिनट ध्यान लगाएं।" 
        : (isGu 
          ? "આજે ૧૧ વાર શાંતિથી ગાયત્રી મંત્રનો જાપ કરો. ગર્ભસ્થ શિશુની આસપાસ દૈવી પ્રકાશ અને હકારાત્મક ઊર્જાની કલ્પના કરીને ૧૦ મિનિટ શાંત ધ્યાન કરો." 
          : "Chant the Gayatri Mantra 11 times. Spend 10 minutes in silent meditation, visualizing divine light and positive energy surrounding your baby."),
      icon: "🕉️",
      actionLabel: isHi ? "मंत्र सुनिए" : (isGu ? "મંત્ર સાંભળો" : "Listen to Mantra"),
      category: "mantra"
    }
  };

  if (content) {
    const categoryLower = (content.category || '').toLowerCase();
    
    if (categoryLower === 'yoga' || categoryLower === 'recipe') {
      defaults.PQ.title = content.title;
      defaults.PQ.description = content.body;
      defaults.PQ.dbAttached = true;
    } else if (categoryLower === 'story' || categoryLower === 'article' || categoryLower === 'puzzle') {
      defaults.IQ.title = content.title;
      defaults.IQ.description = content.body;
      defaults.IQ.dbAttached = true;
    } else if (categoryLower === 'dialogue' || categoryLower === 'affirmation') {
      defaults.EQ.title = content.title;
      defaults.EQ.description = content.body;
      defaults.EQ.dbAttached = true;
    } else if (categoryLower === 'mantra' || categoryLower === 'music' || categoryLower === 'spiritual') {
      defaults.SQ.title = content.title;
      defaults.SQ.description = content.body;
      defaults.SQ.dbAttached = true;
    }
  }

  return defaults;
}

export default function TodayDashboard({ user, t }) {
  const [selectedDay, setSelectedDay] = useState(user.pregnancyDay || 1);
  const [activeQuotient, setActiveQuotient] = useState('PQ');
  const userLang = user.language || 'en';
  const isHi = userLang === 'hi';

  const { data: contentData } = useQuery(GET_DAILY_CONTENT_QUERY, {
    variables: { dayNumber: selectedDay }
  });

  const content = contentData?.getDailyContent;
  const { data: babyData } = useQuery(GET_BABY_DEVELOPMENT_QUERY, {
    variables: { weekNumber: user.currentWeek || 1 }
  });
  const baby = babyData?.getBabyDevelopment;

  // Checklist State backed by localStorage
  const [completedActivities, setCompletedActivities] = useState(() => {
    const saved = localStorage.getItem(`completed_activities_day_${selectedDay}`);
    return saved ? JSON.parse(saved) : { PQ: false, IQ: false, EQ: false, SQ: false };
  });

  useEffect(() => {
    const saved = localStorage.getItem(`completed_activities_day_${selectedDay}`);
    if (saved) {
      setCompletedActivities(JSON.parse(saved));
    } else {
      setCompletedActivities({ PQ: false, IQ: false, EQ: false, SQ: false });
    }
  }, [selectedDay]);

  const toggleActivity = (qKey) => {
    const updated = { ...completedActivities, [qKey]: !completedActivities[qKey] };
    setCompletedActivities(updated);
    localStorage.setItem(`completed_activities_day_${selectedDay}`, JSON.stringify(updated));
    if (updated[qKey]) {
      toast.success(`${qKey} Quotient activity checked! Excellent progress.`);
    }
  };

  const completedCount = Object.values(completedActivities).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  const quotients = getQuotientContent(selectedDay, content, userLang);

  // Dream Chart State
  const [babyName, setBabyName] = useState(() => localStorage.getItem('dream_child_name') || '');
  const [selectedVirtues, setSelectedVirtues] = useState(() => {
    const saved = localStorage.getItem('dream_child_virtues');
    return saved ? JSON.parse(saved) : [];
  });

  const allVirtues = [
    { id: 'intelligence', label: isHi ? '🧠 तीक्ष्ण बुद्धि (IQ)' : '🧠 Intelligence (IQ)', desc: isHi ? 'तेज स्मरण शक्ति और त्वरित समझ' : 'Sharp recall & rapid logic' },
    { id: 'empathy', label: isHi ? '❤️ करुणा व संवेदनशीलता (EQ)' : '❤️ Compassion & Empathy (EQ)', desc: isHi ? 'दूसरों के प्रति उदारता और संबल' : 'Gentle kindness & social harmony' },
    { id: 'courage', label: isHi ? '🦁 साहस व आत्मबल (PQ)' : '🦁 Courage & Strength (PQ)', desc: isHi ? 'बहादुरी, खेल और शारीरिक स्फूर्ति' : 'Fearless spirit & glowing fitness' },
    { id: 'devotion', label: isHi ? '🧘 अध्यात्म व शांति (SQ)' : '🧘 Spiritual Calm (SQ)', desc: isHi ? 'ध्यानमग्न मन और वैदिक ज्ञान' : 'Serene mind & inner values' },
    { id: 'creativity', label: isHi ? '🎨 रचनात्मक प्रतिभा' : '🎨 Artistic Creativity', desc: isHi ? 'संगीत, कला और अनूठी कल्पनाशीलता' : 'Music, art & original imagination' },
    { id: 'eloquence', label: isHi ? '🗣️ ओजस्वी वाणी' : '🗣️ Power of Speech', desc: isHi ? 'प्रभावशाली वक्तृत्व और स्पष्टता' : 'Expressive speaking & confidence' },
  ];

  const handleVirtueToggle = (virtueId) => {
    let updated;
    if (selectedVirtues.includes(virtueId)) {
      updated = selectedVirtues.filter(v => v !== virtueId);
    } else {
      if (selectedVirtues.length >= 4) {
        toast.error(isHi ? 'आप अधिकतम 4 गुणों का चयन कर सकती हैं!' : 'You can select up to 4 virtues for the Dream Chart!');
        return;
      }
      updated = [...selectedVirtues, virtueId];
    }
    setSelectedVirtues(updated);
    localStorage.setItem('dream_child_virtues', JSON.stringify(updated));
  };

  const handleNameChange = (val) => {
    setBabyName(val);
    localStorage.setItem('dream_child_name', val);
  };

  // Music Player State
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* Waveforms Styles Injection */}
      <style>{`
        @keyframes soundwave {
          0%, 100% { height: 4px; }
          50% { height: 18px; }
        }
        .animate-wave-1 { animation: soundwave 0.8s ease-in-out infinite; }
        .animate-wave-2 { animation: soundwave 1.1s ease-in-out infinite 0.2s; }
        .animate-wave-3 { animation: soundwave 0.9s ease-in-out infinite 0.4s; }
        .animate-wave-4 { animation: soundwave 1.3s ease-in-out infinite 0.1s; }
      `}</style>

      {/* Greeting Banner */}
      <Card 
        style={{ 
          background: 'linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%)', 
          border: 0, 
          borderRadius: 24, 
          boxShadow: '0 8px 24px rgba(99, 18, 7, 0.15)' 
        }}
        styles={{ body: { padding: '32px' } }}
      >
        <div style={{ position: 'relative' }}>
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900 }}>{t.hello_mother}</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginTop: '8px', fontSize: '15px', lineHeight: 1.6 }}>
            {t.current_week.replace('{week}', user.currentWeek || 1)}. {t.size_desc.replace('{size}', baby?.size || 'a tiny seed')}
          </Paragraph>
          <Space size="middle" wrap style={{ marginTop: '16px' }}>
            <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: 0, padding: '4px 12px', fontWeight: 'bold' }}>
              {t.edd_badge.replace('{edd}', user.dueDate)}
            </Tag>
            <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: 0, padding: '4px 12px', fontWeight: 'bold' }}>
              {t.trimester_badge.replace('{trimester}', user.currentTrimester)}
            </Tag>
            <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: 0, padding: '4px 12px', fontWeight: 'bold' }}>
              🌱 Day {user.pregnancyDay} / 280
            </Tag>
          </Space>
        </div>
      </Card>

      {/* 280-Day Calendar Slider */}
      <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={18}>
            <Title level={4} style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📅 {isHi ? "280-दिवसीय दिव्य गर्भ संस्कार कैलेंडर" : "280-Day Garbh Sanskar Calendar"}
            </Title>
            <div style={{ padding: '0 10px' }}>
              <Slider 
                min={1} 
                max={280} 
                value={selectedDay} 
                onChange={(val) => setSelectedDay(val)} 
                tooltip={{ formatter: (val) => `Day ${val}` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <Tag color="orange" style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px' }}>
                Day {selectedDay} {selectedDay === user.pregnancyDay ? (isHi ? '(आज)' : '(Today)') : ''}
              </Tag>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {isHi ? "दैनिक गतिविधियां पूरा करें" : "Complete daily activities for wellness"}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={6} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Progress type="circle" percent={progressPercent} size={70} strokeColor="#f97316" />
            <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', marginTop: '12px', letterSpacing: '1px' }}>
              {isHi ? "दैनिक प्रगति" : "Daily Progress"}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 4-Quotients Activity Workspace */}
      <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ margin: 0 }}>✨ {isHi ? "संतान के 4 आयामी विकास का दैनिक अनुष्ठान" : "Your Baby's 4 Quotients Daily Rituals"}</Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            {isHi ? "गर्भस्थ शिशु के सर्वांगीण विकास के लिए चारों आयामों का अभ्यास करें" : "Nurture physical, mental, emotional and spiritual roots daily"}
          </Paragraph>
        </div>

        <Row gutter={[12, 12]}>
          {Object.entries(quotients).map(([key, q]) => {
            const isCompleted = completedActivities[key];
            const isActive = activeQuotient === key;
            return (
              <Col xs={12} sm={6} key={key}>
                <div
                  onClick={() => setActiveQuotient(key)}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    border: `2px solid ${isActive ? '#f97316' : '#f1f5f9'}`,
                    background: isActive ? '#fffaf8' : '#fff',
                    cursor: 'pointer',
                    height: '110px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <span style={{ fontSize: '24px' }}>{q.icon}</span>
                    <Checkbox 
                      checked={isCompleted} 
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleActivity(key);
                      }} 
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>{key}</Text>
                    <Text strong style={{ fontSize: '12px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</Text>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>

        <div style={{ marginTop: '24px', padding: '24px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Tag color="orange" style={{ fontWeight: 'bold' }}>{activeQuotient} Quotient Activity</Tag>
            {quotients[activeQuotient].dbAttached && (
              <Tag color="pink">{isHi ? "विशेष दैनिक सामग्री" : "Special Day Material"}</Tag>
            )}
          </div>
          <Title level={5} style={{ margin: '0 0 12px 0' }}>{quotients[activeQuotient].title}</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {quotients[activeQuotient].description}
          </Paragraph>
          
          <Divider style={{ margin: '16px 0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <Button 
              type={completedActivities[activeQuotient] ? "default" : "primary"}
              onClick={() => toggleActivity(activeQuotient)}
              icon={<CheckCircleOutlined />}
            >
              {completedActivities[activeQuotient] 
                ? (isHi ? "गतिविधि पूर्ण" : "Activity Completed")
                : (isHi ? "पूर्ण चिह्नित करें" : "Mark as Completed")
              }
            </Button>

            {content?.mediaUrl && activeQuotient === 'SQ' && (
              <Button 
                type="link" 
                href={content.mediaUrl} 
                target="_blank" 
                icon={<SoundOutlined />}
              >
                {isHi ? "लिंक्ड मीडिया खोलें →" : "Open Linked Media →"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Music & Meditation */}
      <Card className="meditation-card">
        <div className="meditation-copy">
          <Tag>Audio practice</Tag>
          <Title level={4}>{isHi ? "आज का ध्यान और संगीत" : "Today’s meditation & music"}</Title>
          <Text>{content?.mediaUrl
            ? (isHi ? "शांत स्थान चुनें और आज का निर्देशित अभ्यास सुनें।" : "Choose a quiet place and listen to today’s guided practice.")
            : (isHi ? "आज का ऑडियो अभी प्रकाशित नहीं हुआ है।" : "Today’s audio has not been published yet.")}</Text>
        </div>
        {content?.mediaUrl ? (
          <Button type="primary" icon={<PlayCircleOutlined />} href={content.mediaUrl} target="_blank">
            {isHi ? "अभ्यास खोलें" : "Open audio practice"}
          </Button>
        ) : (
          <Button disabled>{isHi ? "जल्द उपलब्ध" : "Available soon"}</Button>
        )}
      </Card>

      {/* Dream Child Chart */}
      <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>💫 {isHi ? "स्वप्न संतान संकल्प (Dream Child Chart)" : "Dream Child Chart Creator"}</Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            {isHi ? "गर्भस्थ शिशु में जिन गुणों को विकसित करना चाहती हैं, उनका संकल्प लें" : "Select and visualize the core virtues you wish to invoke in your child"}
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isHi ? "शिशु का नाम या लाडला नाम (Nickname)" : "Baby Name or Nickname"}
                </Text>
                <Input 
                  size="large" 
                  placeholder={isHi ? "जैसे: अंश, आरवी, कान्हा..." : "e.g., Little Angel, Kanha..."} 
                  value={babyName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </div>

              <div>
                <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  {isHi ? "गुणों का चयन करें (अधिकतम 4)" : "Select Virtues (Max 4)"}
                </Text>
                <Space orientation="vertical" style={{ width: '100%', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {allVirtues.map((v) => {
                    const isSelected = selectedVirtues.includes(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => handleVirtueToggle(v.id)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: `1px solid ${isSelected ? '#ff8a65' : '#f1f5f9'}`,
                          background: isSelected ? '#fffaf8' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div>
                          <Text strong style={{ fontSize: '13px' }}>{v.label}</Text>
                          <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginTop: '2px' }}>{v.desc}</Text>
                        </div>
                        <Text style={{ fontSize: '16px' }}>{isSelected ? "💖" : "＋"}</Text>
                      </div>
                    );
                  })}
                </Space>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ 
              padding: '24px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #fffcf6 0%, #fff6f6 100%)',
              border: '1px solid #fef3c7',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '290px'
            }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #fef3c7', boxShadow: '0 4px 8px rgba(0,0,0,0.02)' }}>
                <Tag color="warning" style={{ fontWeight: 'bold', border: 0 }}>ॐ स्वप्न संतान संकल्प ॐ</Tag>
                <Title level={4} style={{ margin: '16px 0 4px 0', color: '#1e293b' }}>
                  {babyName ? babyName : (isHi ? "मेरा प्यारा शिशु" : "My Dream Child")}
                </Title>
                <Paragraph type="secondary" style={{ fontSize: '11px', fontStyle: 'italic', margin: 0 }}>
                  {isHi ? "संस्कारों से संवरता स्वर्णिम भविष्य" : "Nurtured by sacred Garbh Sanskar"}
                </Paragraph>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', margin: '16px 0' }}>
                  {selectedVirtues.length > 0 ? (
                    selectedVirtues.map(vid => {
                      const matched = allVirtues.find(v => v.id === vid);
                      return (
                        <Tag color="orange" key={vid} style={{ fontWeight: 'bold', margin: 0 }}>
                          {matched?.label.split(' ')[0]} {matched?.label.split(' ').slice(1).join(' ')}
                        </Tag>
                      );
                    })
                  ) : (
                    <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                      {isHi ? "गुणों का चयन करें..." : "Select virtues on the left..."}
                    </Text>
                  )}
                </div>

                <Divider style={{ margin: '12px 0 0 0' }} />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  {isHi 
                    ? "स्वस्थ, तेजस्वी, संस्कारवान और महान चरित्र" 
                    : "May you be happy, healthy, bright, and values-driven."}
                </Text>
              </div>

              <Button 
                type="primary" 
                block 
                size="large" 
                icon={<DownloadOutlined />}
                disabled={selectedVirtues.length === 0}
                onClick={() => window.print()}
                style={{ marginTop: '16px', fontWeight: 'bold' }}
              >
                {isHi ? "स्वप्न चार्ट सहेजें / प्रिंट करें" : "Download & Print Dream Chart"}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}

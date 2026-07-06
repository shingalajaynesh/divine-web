import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_DAILY_CONTENT_QUERY, GET_BABY_DEVELOPMENT_QUERY, MY_DAILY_PROGRESS_QUERY, MY_TIMELINE_OVERVIEW_QUERY, TOGGLE_DAILY_ACTIVITY_MUTATION, SAVE_DAILY_ACTIVITY_DETAILS_MUTATION, GET_DAILY_QUIZ_QUERY, GET_MY_QUIZ_ATTEMPT_QUERY, SUBMIT_QUIZ_ANSWER_MUTATION, GET_PARTNER_ACTIVITY_QUERY, GET_MY_PARTNER_ACTIVITY_LOG_QUERY, ACKNOWLEDGE_PARTNER_ACTIVITY_MUTATION, GET_SENSORY_ACTIVITY_QUERY, GET_MY_SENSORY_ACTIVITY_LOG_QUERY, TOGGLE_SENSORY_ACTIVITY_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';
import VideoPlayerModal from '../components/VideoPlayerModal';
import AudioPlayerModal from '../components/AudioPlayerModal';
import ReadingModeModal from '../components/ReadingModeModal';
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
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  BookOutlined
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

const getMonthsForTrimester = (tri) => {
  if (tri === 1) return [1, 2, 3];
  if (tri === 2) return [4, 5, 6];
  return [7, 8, 9, 10];
};

const getWeeksForMonth = (mon) => {
  const startWeek = (mon - 1) * 4 + 1;
  return [startWeek, startWeek + 1, startWeek + 2, startWeek + 3];
};

const getDaysForWeek = (wk) => {
  const startDay = (wk - 1) * 7 + 1;
  return Array.from({ length: 7 }, (_, i) => startDay + i);
};

export default function TodayDashboard({ user, t }) {
  const [selectedDay, setSelectedDay] = useState(user.pregnancyDay || 1);
  const [activeQuotient, setActiveQuotient] = useState('PQ');
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [readingModalVisible, setReadingModalVisible] = useState(false);
  const userLang = user.language || 'en';
  const isHi = userLang === 'hi';

  const selectedTrimester = Math.max(1, Math.min(3, Math.floor((selectedDay - 1) / 84) + 1));
  const selectedMonth = Math.max(1, Math.min(10, Math.floor((selectedDay - 1) / 28) + 1));
  const selectedWeek = Math.max(1, Math.min(40, Math.floor((selectedDay - 1) / 7) + 1));

  const { data: contentData } = useQuery(GET_DAILY_CONTENT_QUERY, {
    variables: { dayNumber: selectedDay }
  });

  const content = contentData?.getDailyContent;
  const { data: babyData } = useQuery(GET_BABY_DEVELOPMENT_QUERY, {
    variables: { weekNumber: selectedWeek }
  });
  const baby = babyData?.getBabyDevelopment;

  const { data: progressData } = useQuery(MY_DAILY_PROGRESS_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const { data: timelineOverviewData } = useQuery(MY_TIMELINE_OVERVIEW_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const timelineOverview = timelineOverviewData?.myTimelineOverview;

  const [toggleDailyActivityMutation] = useMutation(TOGGLE_DAILY_ACTIVITY_MUTATION, {
    refetchQueries: [
      { query: MY_DAILY_PROGRESS_QUERY, variables: { dayNumber: selectedDay } },
      { query: MY_TIMELINE_OVERVIEW_QUERY, variables: { dayNumber: selectedDay } }
    ],
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const { data: quizData } = useQuery(GET_DAILY_QUIZ_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });
  
  const { data: quizAttemptData } = useQuery(GET_MY_QUIZ_ATTEMPT_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const [submitQuizAnswerMutation, { loading: submittingQuiz }] = useMutation(SUBMIT_QUIZ_ANSWER_MUTATION, {
    refetchQueries: [
      { query: GET_MY_QUIZ_ATTEMPT_QUERY, variables: { dayNumber: selectedDay } }
    ],
    onCompleted: (res) => {
      if (res?.submitQuizAnswer?.isCorrect) {
        toast.success(isHi ? "सही उत्तर! अद्भुत!" : "Correct answer! Amazing!");
      } else {
        toast.error(isHi ? "गलत उत्तर, कोई बात नहीं!" : "Incorrect answer, no worries!");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const dailyQuiz = quizData?.getDailyQuiz;
  const quizAttempt = quizAttemptData?.getMyQuizAttempt;

  const { data: partnerData } = useQuery(GET_PARTNER_ACTIVITY_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });
  
  const { data: partnerLogData } = useQuery(GET_MY_PARTNER_ACTIVITY_LOG_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const [acknowledgePartnerActivityMutation, { loading: togglingPartner }] = useMutation(ACKNOWLEDGE_PARTNER_ACTIVITY_MUTATION, {
    refetchQueries: [
      { query: GET_MY_PARTNER_ACTIVITY_LOG_QUERY, variables: { dayNumber: selectedDay } }
    ],
    onCompleted: (res) => {
      const acknowledged = res?.acknowledgePartnerActivity?.partnerAcknowledged;
      if (acknowledged) {
        toast.success(isHi ? "पिता/साथी गतिविधि पूरी चिह्नित की गई!" : "Partner activity marked as completed!");
      } else {
        toast.success(isHi ? "पिता/साथी गतिविधि अधूरी चिह्नित की गई!" : "Partner activity unchecked!");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const partnerActivity = partnerData?.getPartnerActivity;
  const partnerLog = partnerLogData?.getMyPartnerActivityLog;

  const { data: sensoryData } = useQuery(GET_SENSORY_ACTIVITY_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });
  
  const { data: sensoryLogData } = useQuery(GET_MY_SENSORY_ACTIVITY_LOG_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const [toggleSensoryActivityMutation, { loading: togglingSensory }] = useMutation(TOGGLE_SENSORY_ACTIVITY_MUTATION, {
    refetchQueries: [
      { query: GET_MY_SENSORY_ACTIVITY_LOG_QUERY, variables: { dayNumber: selectedDay } }
    ],
    onCompleted: (res) => {
      const completed = res?.toggleSensoryActivity?.completed;
      if (completed) {
        toast.success(isHi ? "पंचेंद्रिय विकास गतिविधि पूरी चिह्नित की गई!" : "Sensory exercise marked as completed!");
      } else {
        toast.success(isHi ? "पंचेंद्रिय विकास गतिविधि अधूरी चिह्नित की गई!" : "Sensory exercise unchecked!");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const sensoryActivity = sensoryData?.getSensoryActivity;
  const sensoryLog = sensoryLogData?.getMySensoryActivityLog;

  const completedActivities = {
    PQ: progressData?.myDailyProgress?.pqCompleted || false,
    IQ: progressData?.myDailyProgress?.iqCompleted || false,
    EQ: progressData?.myDailyProgress?.eqCompleted || false,
    SQ: progressData?.myDailyProgress?.sqCompleted || false,
  };

  const toggleActivity = async (qKey) => {
    try {
      await toggleDailyActivityMutation({
        variables: {
          dayNumber: selectedDay,
          quotient: qKey
        }
      });
      
      const newCheckedState = !completedActivities[qKey];
      if (newCheckedState) {
        toast.success(`${qKey} Quotient activity checked! Excellent progress.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const completedCount = timelineOverview?.completedCount ?? Object.values(completedActivities).filter(Boolean).length;
  const progressPercent = timelineOverview?.progressPercent ?? Math.round((completedCount / 4) * 100);

  const quotients = getQuotientContent(selectedDay, content, userLang);

  const [durationValue, setDurationValue] = useState(0);
  const [evidenceValue, setEvidenceValue] = useState('');
  const [notesValue, setNotesValue] = useState('');

  useEffect(() => {
    if (progressData?.myDailyProgress) {
      const qKey = activeQuotient.toLowerCase();
      setDurationValue(progressData.myDailyProgress[`${qKey}DurationMins`] || 0);
      setEvidenceValue(progressData.myDailyProgress[`${qKey}Evidence`] || '');
      setNotesValue(progressData.myDailyProgress[`${qKey}Notes`] || '');
    } else {
      setDurationValue(0);
      setEvidenceValue('');
      setNotesValue('');
    }
  }, [progressData, activeQuotient, selectedDay]);

  const [saveDailyActivityDetailsMutation, { loading: savingDetails }] = useMutation(SAVE_DAILY_ACTIVITY_DETAILS_MUTATION, {
    refetchQueries: [
      { query: MY_DAILY_PROGRESS_QUERY, variables: { dayNumber: selectedDay } },
      { query: MY_TIMELINE_OVERVIEW_QUERY, variables: { dayNumber: selectedDay } }
    ],
    onCompleted: () => {
      toast.success(isHi ? "गतिविधि लॉग सफलतापूर्वक सहेजा गया!" : "Activity details saved successfully!");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSaveDetails = async () => {
    try {
      await saveDailyActivityDetailsMutation({
        variables: {
          input: {
            dayNumber: selectedDay,
            quotient: activeQuotient,
            durationMins: parseInt(durationValue, 10) || 0,
            evidence: evidenceValue.trim() || null,
            notes: notesValue.trim() || null
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

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

  const isLocked = timelineOverview?.isLocked ?? (selectedDay > (user.pregnancyDay || 1));
  const unlockDateString = timelineOverview?.unlockDate
    ? new Date(timelineOverview.unlockDate).toLocaleDateString(userLang === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

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

      {/* 280-Day Calendar & Navigation */}
      <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={18}>
            <Title level={4} style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📅 {isHi ? "280-दिवसीय दिव्य गर्भ संस्कार कैलेंडर" : "280-Day Garbh Sanskar Calendar"}
            </Title>
            
            {/* Trimester/Month/Week/Day Navigation */}
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Trimester Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                {[1, 2, 3].map((tri) => {
                  const active = selectedTrimester === tri;
                  return (
                    <Button
                      key={tri}
                      type={active ? 'primary' : 'default'}
                      shape="round"
                      onClick={() => {
                        const firstDay = (tri - 1) * 84 + 1;
                        setSelectedDay(firstDay);
                      }}
                      style={{
                        fontWeight: 'bold',
                        boxShadow: active ? '0 4px 12px rgba(249, 115, 22, 0.2)' : 'none',
                      }}
                    >
                      {isHi ? `तिमाही ${tri}` : `Trimester ${tri}`}
                    </Button>
                  );
                })}
              </div>

              {/* Month Tabs */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                {getMonthsForTrimester(selectedTrimester).map((m) => {
                  const active = selectedMonth === m;
                  return (
                    <Button
                      key={m}
                      type={active ? 'primary' : 'dashed'}
                      size="small"
                      onClick={() => {
                        const firstDay = (m - 1) * 28 + 1;
                        setSelectedDay(firstDay);
                      }}
                      style={{
                        borderRadius: '8px',
                        borderColor: active ? 'transparent' : '#ff8a65',
                        color: active ? '#fff' : '#f97316',
                        background: active ? '#f97316' : '#fffcf6',
                      }}
                    >
                      {isHi ? `महीना ${m}` : `Month ${m}`}
                    </Button>
                  );
                })}
              </div>

              {/* Week Tabs */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                {getWeeksForMonth(selectedMonth).map((w) => {
                  const active = selectedWeek === w;
                  return (
                    <Button
                      key={w}
                      type={active ? 'primary' : 'text'}
                      size="small"
                      onClick={() => {
                        const firstDay = (w - 1) * 7 + 1;
                        setSelectedDay(firstDay);
                      }}
                      style={{
                        borderRadius: '6px',
                        background: active ? 'var(--color-brand-secondary)' : 'transparent',
                        color: active ? '#fff' : '#475569',
                        fontWeight: active ? 'bold' : 'normal',
                      }}
                    >
                      {isHi ? `सप्ताह ${w}` : `Week ${w}`}
                    </Button>
                  );
                })}
              </div>

              {/* Day Bubbles */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', overflowX: 'auto', padding: '8px 0' }}>
                {getDaysForWeek(selectedWeek).map((d) => {
                  const active = selectedDay === d;
                  const isDayLocked = d > (user.pregnancyDay || 1);
                  
                  // Check if this day is fully completed
                  const dayProgress = timelineOverview?.days?.find((entry) => entry.dayNumber === d);
                  const isDayCompleted = Boolean(dayProgress?.completed);

                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDay(d)}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        border: active ? '2px solid #f97316' : '1px solid #cbd5e1',
                        background: active ? '#fffaf8' : (isDayLocked ? '#f1f5f9' : '#fff'),
                        color: isDayLocked ? '#94a3b8' : '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        transition: 'all 0.2s',
                        transform: active ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{d}</span>
                      {isDayLocked && (
                        <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '10px', background: '#fff', borderRadius: '50%', padding: '1px' }}>🔒</span>
                      )}
                      {!isDayLocked && isDayCompleted && (
                        <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '10px', background: '#fff', borderRadius: '50%', padding: '1px' }}>✅</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Space>
          </Col>

          <Col xs={24} md={6} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Progress type="circle" percent={isLocked ? 0 : progressPercent} size={70} strokeColor="#f97316" />
            <Text strong style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', marginTop: '12px', letterSpacing: '1px' }}>
              {isHi ? "दैनिक प्रगति" : "Daily Progress"}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Conditionally Render Locked Cover or Daily Activities */}
      {isLocked ? (
        <Card style={{ borderRadius: 24, padding: '48px 24px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <Title level={3} style={{ color: '#1e293b' }}>
            {isHi ? `दिन ${selectedDay} वर्तमान में लॉक है` : `Day ${selectedDay} is locked`}
          </Title>
          <Paragraph type="secondary" style={{ maxWidth: '460px', margin: '8px auto 24px auto', fontSize: '14px', lineHeight: 1.6 }}>
            {isHi
              ? `यह दैनिक कार्यक्रम आपके व्यक्तिगत गर्भधारण कैलेंडर के अनुसार अनलॉक होगा। आप पिछले दिनों के किसी भी छूटे हुए कार्य को पूरा करने के लिए स्वतंत्र हैं।`
              : `This daily programme will unlock according to your personal pregnancy timeline. Feel free to browse previous days to catch up on any missed activities.`}
          </Paragraph>
          <Tag color="orange" style={{ padding: '8px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 'bold' }}>
            ⏰ {isHi ? `अनलॉक होने की तिथि:` : `Expected unlock:`} {unlockDateString}
          </Tag>
        </Card>
      ) : (
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

            {activeQuotient === 'PQ' && quotients.PQ.category === 'yoga' && (
              <div style={{ margin: '16px 0', padding: '16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#b45309', display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                  ⚠️ {isHi ? "प्रसव-पूर्व सुरक्षा और सावधानियां" : "Prenatal Safety & Precautions"} (Trimester {selectedDay <= 90 ? '1' : selectedDay <= 180 ? '2' : '3'})
                </span>
                <Text style={{ fontSize: '12px', color: '#78350f', display: 'block', marginBottom: '8px', lineHeight: '1.5' }}>
                  {selectedDay <= 90 
                    ? (isHi ? "त्रैमासिक 1 सावधानियां: पेट पर दबाव डालने वाले आसनों से बचें, झटकेदार आंदोलनों से बचें, और यदि ऐंठन या रक्तस्राव हो तो अभ्यास तुरंत रोक दें।" : "Trimester 1 Precautions: Avoid abdominal pressure, sudden twists or high-impact jumps. Stop immediately if experiencing cramping or spotting.")
                    : selectedDay <= 180
                    ? (isHi ? "त्रैमासिक 2 सावधानियां: पीठ के बल अधिक देर तक लेटने से बचें, संतुलन के लिए दीवार या सहारा लें, और अत्यधिक खिंचाव से बचें।" : "Trimester 2 Precautions: Avoid lying flat on your back for long. Use wall or chair support for balance. Do not over-stretch.")
                    : (isHi ? "त्रैमासिक 3 सावधानियां: पीठ के बल लेटने वाले आसन न करें, सांस रोकने से बचें, और हमेशा सहारे के साथ अभ्यास करें।" : "Trimester 3 Precautions: Absolutely avoid supine positions (on your back) and breath retention. Always use support (blocks/cushions).")
                  }
                </Text>
                <Text style={{ fontSize: '11px', color: '#9a3412', fontWeight: 'bold', display: 'block' }}>
                  {isHi ? "*चिकित्सीय अस्वीकरण: किसी भी व्यायाम को शुरू करने से पहले अपने स्त्री रोग विशेषज्ञ से परामर्श लें।" : "*Medical Disclaimer: Consult your obstetrician/gynecologist before performing any exercises."}
                </Text>
              </div>
            )}
            
            <Divider style={{ margin: '16px 0' }} />
            
            <div style={{ marginBottom: '16px' }}>
              <Title level={5} style={{ fontSize: '13px', margin: '0 0 12px 0', color: '#475569' }}>
                📝 {isHi ? "गतिविधि विवरण और डायरी" : "Activity Logging & Reflection"}
              </Title>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: '4px' }}><Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>{isHi ? "समय (मिनट में)" : "Duration spent (mins)"}</Text></div>
                  <InputNumber 
                    min={0} 
                    value={durationValue} 
                    onChange={setDurationValue} 
                    style={{ width: '100%' }} 
                    placeholder="e.g. 15"
                  />
                </Col>
                <Col xs={24} sm={16}>
                  <div style={{ marginBottom: '4px' }}><Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>{isHi ? "प्रमाण/लिंक (वैकल्पिक)" : "Proof/Evidence Link (optional)"}</Text></div>
                  <Input 
                    value={evidenceValue} 
                    onChange={(e) => setEvidenceValue(e.target.value)} 
                    placeholder="https://..."
                  />
                </Col>
                <Col xs={24}>
                  <div style={{ marginBottom: '4px' }}><Text type="secondary" style={{ fontSize: '11px', fontWeight: 'bold' }}>{isHi ? "आज के अनुभव / चिंतन डायरी" : "Daily Reflection Notes / Diary"}</Text></div>
                  <Input.TextArea 
                    value={notesValue} 
                    onChange={(e) => setNotesValue(e.target.value)} 
                    rows={2} 
                    placeholder={isHi ? "आज शिशु के साथ कैसा अनुभव रहा..." : "How did you and baby feel during this activity..."}
                  />
                </Col>
              </Row>
            </div>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <Space>
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
                
                <Button
                  type="primary"
                  onClick={handleSaveDetails}
                  loading={savingDetails}
                  style={{ background: '#059669', borderColor: '#059669', fontWeight: 'bold' }}
                >
                  {isHi ? "विवरण सहेजें" : "Save Details"}
                </Button>

                {['story', 'article', 'dialogue', 'affirmation'].includes(quotients[activeQuotient].category) && (
                  <Button 
                    type="default" 
                    icon={<BookOutlined />}
                    onClick={() => setReadingModalVisible(true)}
                  >
                    {isHi ? "रीडर मोड में पढ़ें" : "Open in Reader"}
                  </Button>
                )}
              </Space>

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
      )}

      {/* Daily Quiz & Puzzle Card */}
      {!isLocked && dailyQuiz && (
        <Card 
          title={
            <span>
              🧠 {isHi ? "दैनिक मस्तिष्क व्यायाम पहेली" : "Daily Cognitive Quiz & Puzzle"}
            </span>
          }
          style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        >
          <div style={{ padding: '4px' }}>
            <Title level={5} style={{ marginBottom: '16px' }}>{dailyQuiz.questionText}</Title>
            
            <Row gutter={[12, 12]}>
              {dailyQuiz.options.map((option, index) => {
                const isAttempted = !!quizAttempt;
                const isSelected = isAttempted && quizAttempt.selectedOptionIndex === index;
                const isCorrectIndex = index === dailyQuiz.correctOptionIndex;
                
                let optionStyle = {
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                };
                
                if (isAttempted) {
                  if (isSelected && quizAttempt.isCorrect) {
                    optionStyle.background = '#e6fffa';
                    optionStyle.borderColor = '#10b981';
                    optionStyle.color = '#0f766e';
                  } else if (isSelected && !quizAttempt.isCorrect) {
                    optionStyle.background = '#fef2f2';
                    optionStyle.borderColor = '#ef4444';
                    optionStyle.color = '#991b1b';
                  } else if (isCorrectIndex) {
                    optionStyle.background = '#e6fffa';
                    optionStyle.borderColor = '#10b981';
                    optionStyle.color = '#0f766e';
                  } else {
                    optionStyle.opacity = 0.5;
                    optionStyle.cursor = 'not-allowed';
                  }
                }

                const handleSelect = async () => {
                  if (isAttempted) return;
                  try {
                    await submitQuizAnswerMutation({
                      variables: {
                        dayNumber: selectedDay,
                        selectedOptionIndex: index
                      }
                    });
                  } catch (e) {
                    console.error(e);
                  }
                };

                return (
                  <Col xs={24} sm={12} key={index}>
                    <div style={optionStyle} onClick={handleSelect}>
                      <span>{option}</span>
                      {isAttempted && isCorrectIndex && <CheckCircleFilled style={{ color: '#10b981' }} />}
                      {isAttempted && isSelected && !quizAttempt.isCorrect && <CloseCircleFilled style={{ color: '#ef4444' }} />}
                    </div>
                  </Col>
                );
              })}
            </Row>

            {quizAttempt && (
              <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Text strong style={{ color: '#0f766e', display: 'block', marginBottom: '4px' }}>
                  💡 {isHi ? "उत्तर स्पष्टीकरण" : "Explanation & Garbh Development Insight"}
                </Text>
                <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
                  {dailyQuiz.explanation}
                </Paragraph>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Daily Partner & Family Activity Card */}
      {!isLocked && partnerActivity && (
        <Card 
          title={
            <span>
              🤝 {isHi ? "पिता और परिवार दैनिक अनुष्ठान" : "Partner & Family Daily Ritual"}
            </span>
          }
          style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        >
          <div style={{ padding: '4px' }}>
            <Title level={5} style={{ margin: '0 0 8px 0' }}>{partnerActivity.title}</Title>
            <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
              {partnerActivity.description}
            </Paragraph>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <Tag color={partnerLog?.partnerAcknowledged ? "green" : "orange"} style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px' }}>
                {partnerLog?.partnerAcknowledged 
                  ? (isHi ? "✓ साथी द्वारा पूर्ण किया गया" : "✓ Completed by Partner")
                  : (isHi ? "⚠️ साथी द्वारा पूर्णता लंबित" : "⚠️ Pending Partner Completion")
                }
              </Tag>
              
              <Button 
                type={partnerLog?.partnerAcknowledged ? "default" : "primary"}
                onClick={async () => {
                  try {
                    await acknowledgePartnerActivityMutation({
                      variables: { dayNumber: selectedDay }
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }}
                loading={togglingPartner}
                style={{ borderRadius: '10px' }}
              >
                {partnerLog?.partnerAcknowledged 
                  ? (isHi ? "अपूर्ण चिह्नित करें" : "Mark as Incomplete")
                  : (isHi ? "साथी द्वारा पूर्ण चिह्नित करें" : "Mark Completed by Partner")
                }
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Daily Sensory (Panchendriya) Activity Card */}
      {!isLocked && sensoryActivity && (
        <Card 
          title={
            <span>
              👁️ {isHi ? "पंचेंद्रिय विकास दैनिक अनुष्ठान" : "Five-Sense Daily Sensory Ritual"}
            </span>
          }
          style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        >
          <div style={{ padding: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Tag color="purple" style={{ fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                {sensoryActivity.senseType}
              </Tag>
            </div>
            <Title level={5} style={{ margin: '0 0 8px 0' }}>{sensoryActivity.title}</Title>
            <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
              {sensoryActivity.description}
            </Paragraph>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <Tag color={sensoryLog?.completed ? "green" : "blue"} style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px' }}>
                {sensoryLog?.completed 
                  ? (isHi ? "✓ अभ्यास पूर्ण" : "✓ Exercise Completed")
                  : (isHi ? "⚠️ लंबित" : "⚠️ Pending Practice")
                }
              </Tag>
              
              <Button 
                type={sensoryLog?.completed ? "default" : "primary"}
                onClick={async () => {
                  try {
                    await toggleSensoryActivityMutation({
                      variables: { dayNumber: selectedDay }
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }}
                loading={togglingSensory}
                style={{ borderRadius: '10px' }}
              >
                {sensoryLog?.completed 
                  ? (isHi ? "अपूर्ण चिह्नित करें" : "Mark as Incomplete")
                  : (isHi ? "पूर्ण चिह्नित करें" : "Mark Completed")
                }
              </Button>
            </div>
          </div>
        </Card>
      )}

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
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={() => {
              if (content.category === 'video') setVideoPlayerVisible(true);
              else setAudioPlayerVisible(true);
            }}
          >
            {isHi ? "अभ्यास चलाएं" : "Play practice"}
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

      {content?.mediaUrl && (
        <VideoPlayerModal
          visible={videoPlayerVisible}
          onClose={() => setVideoPlayerVisible(false)}
          mediaUrl={content.mediaUrl}
          dailyContentId={content.id}
          title={isHi ? content.titleHi || content.title : content.titleEn || content.title}
          isHi={isHi}
        />
      )}

      {content?.mediaUrl && (
        <AudioPlayerModal
          visible={audioPlayerVisible}
          onClose={() => setAudioPlayerVisible(false)}
          mediaUrl={content.mediaUrl}
          contentItemId={content.id}
          title={isHi ? content.titleHi || content.title : content.titleEn || content.title}
          isHi={isHi}
        />
      )}

      <ReadingModeModal
        visible={readingModalVisible}
        onClose={() => setReadingModalVisible(false)}
        title={quotients[activeQuotient].title}
        body={quotients[activeQuotient].description}
        lang={userLang}
      />
    </Space>
  );
}

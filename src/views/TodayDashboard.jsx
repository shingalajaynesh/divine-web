import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { GET_DAILY_CONTENT_QUERY, GET_BABY_DEVELOPMENT_QUERY, MY_DAILY_PROGRESS_QUERY, MY_TIMELINE_OVERVIEW_QUERY, TOGGLE_DAILY_ACTIVITY_MUTATION, SAVE_DAILY_ACTIVITY_DETAILS_MUTATION, GET_DAILY_QUIZ_QUERY, GET_MY_QUIZ_ATTEMPT_QUERY, SUBMIT_QUIZ_ANSWER_MUTATION, GET_PARTNER_ACTIVITY_QUERY, GET_MY_PARTNER_ACTIVITY_LOG_QUERY, ACKNOWLEDGE_PARTNER_ACTIVITY_MUTATION, GET_SENSORY_ACTIVITY_QUERY, GET_MY_SENSORY_ACTIVITY_LOG_QUERY, TOGGLE_SENSORY_ACTIVITY_MUTATION, LINK_PARTNER_MUTATION, UPDATE_PARTNER_SHARING_MUTATION, ME_QUERY, ASSIGN_PARTNER_TASK_MUTATION, SUBMIT_PARTNER_RESPONSE_MUTATION, GET_PARTNER_STREAK_QUERY, GET_RECOMMENDATIONS_QUERY } from '../graphql/operations';
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
  InputNumber,
  Tag,
  Space,
  Divider,
  Avatar,
  Skeleton
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
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(user.pregnancyDay || 1);
  const [activeQuotient, setActiveQuotient] = useState('PQ');
  const [assignTaskTitle, setAssignTaskTitle] = useState('');
  const [assignTaskDesc, setAssignTaskDesc] = useState('');
  const [partnerResponseText, setPartnerResponseText] = useState('');
  const [partnerFamilyNotes, setPartnerFamilyNotes] = useState('');
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [readingModalVisible, setReadingModalVisible] = useState(false);
  const userLang = user.language || 'en';
  const isHi = userLang === 'hi';

  const selectedTrimester = Math.max(1, Math.min(3, Math.floor((selectedDay - 1) / 84) + 1));
  const selectedMonth = Math.max(1, Math.min(10, Math.floor((selectedDay - 1) / 28) + 1));
  const selectedWeek = Math.max(1, Math.min(40, Math.floor((selectedDay - 1) / 7) + 1));

  const trimesterStory = useMemo(() => {
    const tri = selectedTrimester;
    if (tri === 1) {
      return {
        title: isHi ? "प्रथम तिमाही: प्राण संचार" : "Trimester 1: Prana Sanchar",
        desc: isHi
          ? "जीवन शक्ति का आगमन। शांतिपूर्ण मंत्रोच्चार और विश्राम पर ध्यान केंद्रित करें।"
          : "Inflow of Life Force. Establish peace, bond with quiet mantras, and practice deep breathing.",
        color: "#ca8a04",
      };
    } else if (tri === 2) {
      return {
        title: isHi ? "द्वितीय तिमाही: इंद्रिय संचार" : "Trimester 2: Indriya Sanchar",
        desc: isHi
          ? "इंद्रियों का विकास। संगीत, सकारात्मक पठन और मधुर गर्भ संवाद पर ध्यान दें।"
          : "Development of Senses. Nourish with soothing sounds, moral stories, and loving Garbh Samvad.",
        color: "#b45309",
      };
    } else {
      return {
        title: isHi ? "तृतीय तिमाही: चेतना संचार" : "Trimester 3: Chetana Sanchar",
        desc: isHi
          ? "चेतना का जागरण। प्रार्थना, उच्च नैतिक संकल्प और सजग प्रसव-पूर्व योग अभ्यास करें।"
          : "Awakening of Consciousness. Focus on prayer, character visualization, and supportive breathing.",
        color: "#be123c",
      };
    }
  }, [selectedTrimester, isHi]);

  const { data: contentData, loading: contentLoading } = useQuery(GET_DAILY_CONTENT_QUERY, {
    variables: { dayNumber: selectedDay }
  });

  const content = contentData?.getDailyContent;
  const { data: recData, loading: recLoading } = useQuery(GET_RECOMMENDATIONS_QUERY);
  const recommendations = recData?.myRecommendations || [];
  const { data: babyData, loading: babyLoading } = useQuery(GET_BABY_DEVELOPMENT_QUERY, {
    variables: { weekNumber: selectedWeek }
  });
  const baby = babyData?.getBabyDevelopment;

  const { data: progressData, loading: progressLoading } = useQuery(MY_DAILY_PROGRESS_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const { data: timelineOverviewData, loading: timelineLoading } = useQuery(MY_TIMELINE_OVERVIEW_QUERY, {
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

  const { data: quizData, loading: quizLoading } = useQuery(GET_DAILY_QUIZ_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const { data: quizAttemptData, loading: quizAttemptLoading } = useQuery(GET_MY_QUIZ_ATTEMPT_QUERY, {
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
    }
  });

  const [partnerEmail, setPartnerEmail] = useState('');
  const [linkPartner, { loading: linkingPartner }] = useMutation(LINK_PARTNER_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }],
    onCompleted: () => {
      toast.success(isHi ? "साथी सफलतापूर्वक जुड़ गया!" : "Partner linked successfully!");
      setPartnerEmail('');
    },
    onError: (err) => toast.error(err.message)
  });

  const [updatePartnerSharing] = useMutation(UPDATE_PARTNER_SHARING_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }],
    onCompleted: () => toast.success(isHi ? "साझाकरण अनुमतियां अपडेट की गईं!" : "Sharing preferences updated!"),
    onError: (err) => toast.error(err.message)
  });

  const dailyQuiz = quizData?.getDailyQuiz;
  const quizAttempt = quizAttemptData?.getMyQuizAttempt;

  const { data: partnerData, loading: partnerLoading } = useQuery(GET_PARTNER_ACTIVITY_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const { data: partnerLogData, loading: partnerLogLoading } = useQuery(GET_MY_PARTNER_ACTIVITY_LOG_QUERY, {
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

  const { data: sensoryData, loading: sensoryLoading } = useQuery(GET_SENSORY_ACTIVITY_QUERY, {
    variables: { dayNumber: selectedDay },
    skip: !user
  });

  const { data: sensoryLogData, loading: sensoryLogLoading } = useQuery(GET_MY_SENSORY_ACTIVITY_LOG_QUERY, {
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

  const { data: partnerStreakData, loading: partnerStreakLoading } = useQuery(GET_PARTNER_STREAK_QUERY, { skip: !user });
  const partnerStreak = partnerStreakData?.myPartnerStreak;

  const [assignPartnerTask, { loading: assigningTask }] = useMutation(ASSIGN_PARTNER_TASK_MUTATION, {
    refetchQueries: [
      { query: GET_MY_PARTNER_ACTIVITY_LOG_QUERY, variables: { dayNumber: selectedDay } }
    ],
    onCompleted: () => {
      setAssignTaskTitle('');
      setAssignTaskDesc('');
      toast.success(isHi ? "कार्य सफलतापूर्वक असाइन किया गया!" : "Task assigned successfully!");
    },
    onError: (err) => toast.error(err.message)
  });

  const [submitPartnerResponse, { loading: submittingResponse }] = useMutation(SUBMIT_PARTNER_RESPONSE_MUTATION, {
    refetchQueries: [
      { query: GET_MY_PARTNER_ACTIVITY_LOG_QUERY, variables: { dayNumber: selectedDay } },
      { query: GET_PARTNER_STREAK_QUERY }
    ],
    onCompleted: () => {
      setPartnerResponseText('');
      setPartnerFamilyNotes('');
      toast.success(isHi ? "प्रतिक्रिया दर्ज की गई!" : "Response saved successfully!");
    },
    onError: (err) => toast.error(err.message)
  });

  const sensoryActivity = sensoryData?.getSensoryActivity;
  const sensoryLog = sensoryLogData?.getMySensoryActivityLog;

  const completedActivities = {
    PQ: progressData?.myDailyProgress?.pqCompleted || false,
    IQ: progressData?.myDailyProgress?.iqCompleted || false,
    EQ: progressData?.myDailyProgress?.eqCompleted || false,
    SQ: progressData?.myDailyProgress?.sqCompleted || false,
  };

  const toggleActivity = React.useCallback(async (qKey) => {
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
  }, [selectedDay, completedActivities, toggleDailyActivityMutation]);

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

  const handleSaveDetails = React.useCallback(async () => {
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
  }, [selectedDay, activeQuotient, durationValue, evidenceValue, notesValue, saveDailyActivityDetailsMutation]);

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

  const handleVirtueToggle = React.useCallback((virtueId) => {
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
  }, [selectedVirtues, isHi]);

  const handleNameChange = React.useCallback((val) => {
    setBabyName(val);
    localStorage.setItem('dream_child_name', val);
  }, []);

  const isLocked = timelineOverview?.isLocked ?? (selectedDay > (user.pregnancyDay || 1));
  const unlockDateString = timelineOverview?.unlockDate
    ? new Date(timelineOverview.unlockDate).toLocaleDateString(userLang === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  // Skeleton Loading Layout to optimize LCP and CLS (only on initial load to avoid flash-on-mutation)
  const isInitialLoading = 
    (contentLoading && !content) || 
    (babyLoading && !baby) || 
    (progressLoading && !progressData) || 
    (timelineLoading && !timelineOverviewData);

  if (isInitialLoading) {
    return (
      <div style={{ padding: screens.xs ? '8px 0 80px 0' : '0 0 40px 0', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Banner Card Skeleton */}
        <Card
          style={{
            background: 'linear-gradient(135deg, var(--brand-maroon) 0%, var(--brand-maroon-dark) 100%)',
            border: 0,
            borderRadius: 24,
            boxShadow: '0 8px 24px rgba(63, 10, 17, 0.18)',
            height: 220,
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px'
          }}
          styles={{ body: { padding: '24px', width: '100%' } }}
        >
          <div style={{ width: '100%' }}>
            <Skeleton active paragraph={{ rows: 2, width: ['60%', '40%'] }} title={{ width: '30%' }} />
          </div>
        </Card>

        {/* Quick Actions Row Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '8px 0 24px 0' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} style={{ borderRadius: 16, border: '1px solid var(--line)', background: '#fff', height: 82 }}>
              <Skeleton active avatar={{ shape: 'square', size: 38 }} title={{ width: '50%' }} paragraph={{ rows: 1, width: '80%' }} />
            </Card>
          ))}
        </div>

        {/* Calendar Card Skeleton */}
        <Card style={{ borderRadius: 24, border: '1px solid var(--line)', height: 580, marginBottom: '20px' }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  // Music Player State
  return (
    <div style={{ padding: screens.xs ? '8px 0 80px 0' : '0 0 40px 0', maxWidth: '1200px', margin: '0 auto' }}>
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
      {/* Greeting Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, var(--brand-maroon) 0%, var(--brand-maroon-dark) 100%)',
          border: 0,
          borderRadius: 24,
          boxShadow: '0 8px 24px rgba(63, 10, 17, 0.18)',
          minHeight: '220px',
          marginBottom: '24px'
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Row gutter={[16, 16]} align="middle">
          {/* Left Text / Info column */}
          <Col xs={16} sm={16} md={12}>
            <Title level={isHi ? 3 : 2} style={{ color: '#fff', margin: 0, fontWeight: 900, fontSize: 'clamp(20px, 4vw, 28px)' }}>{t.hello_mother}</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginTop: '8px', fontSize: 'clamp(12px, 2.5vw, 15px)', lineHeight: 1.4 }}>
              {t.current_week.replace('{week}', user.currentWeek || 1)}. {t.size_desc.replace('{size}', baby?.size || 'a tiny seed')}
            </Paragraph>
            <Space size={[4, 8]} wrap style={{ marginTop: '12px' }}>
              <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: 0, padding: '2px 8px', fontWeight: 'bold', fontSize: '11px' }}>
                {t.edd_badge.replace('{edd}', user.dueDate)}
              </Tag>
              <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: 0, padding: '2px 8px', fontWeight: 'bold', fontSize: '11px' }}>
                {t.trimester_badge.replace('{trimester}', user.currentTrimester)}
              </Tag>
              <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: 0, padding: '2px 8px', fontWeight: 'bold', fontSize: '11px' }}>
                🌱 Day {user.pregnancyDay} / 280
              </Tag>
            </Space>
          </Col>

          {/* Middle Baby Avatar column */}
          <Col xs={8} sm={8} md={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '6px',
              borderRadius: '50%',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Avatar
                size={{ xs: 64, sm: 80, md: 100, lg: 110, xl: 120 }}
                style={{
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: 'clamp(28px, 6vw, 48px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                👶
              </Avatar>
            </div>
          </Col>

          {/* Right Motif column */}
          <Col xs={24} md={8}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Text style={{ color: '#ffd600', fontWeight: '800', fontSize: '10px', display: 'block', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>
                ✨ {isHi ? "गर्भ संस्कार विषय" : "GARBH SANSKAR MOTIF"}
              </Text>
              <Text strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                {trimesterStory.title}
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '11px', lineHeight: '1.4' }}>
                {trimesterStory.desc}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Quick Actions Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '8px 0 24px 0' }}>
        {[
          { key: '/diet-planner', icon: '🍎', title: isHi ? 'आहार योजना' : 'Diet Planner', desc: isHi ? 'दैनिक पोषण और भोजन' : 'Daily nutrition & recipes' },
          { key: '/vitals', icon: '💓', title: isHi ? 'वाइटल्स ट्रैकर' : 'Vitals Tracker', desc: isHi ? 'दैनिक वजन और लक्षण ट्रैक करें' : 'Track symptoms & vitals' },
          { key: '/weekly-report', icon: '📊', title: isHi ? 'साप्ताहिक रिपोर्ट' : 'Weekly Reports', desc: isHi ? 'प्रगति और संकल्प सारांश' : 'Progress & streaks summary' },
          { key: '/expert-consulting', icon: '👩‍⚕️', title: isHi ? 'विशेषज्ञ सलाह' : 'Expert Consulting', desc: isHi ? 'डॉक्टर और कोच स्लॉट बुक करें' : 'Book doctor & coach slots' },
          { key: '/pregnancy-tools', icon: '🛠️', title: isHi ? 'गर्भावस्था उपकरण' : 'Pregnancy Tools', desc: isHi ? 'किक काउंटर, संकुचन टाइमर, EDD' : 'Kick counter, contraction timer, EDD & bag' }
        ].map((act) => (
          <Card
            key={act.key}
            hoverable
            onClick={() => navigate(act.key)}
            style={{ borderRadius: 16, border: '1px solid var(--line)', background: '#fff' }}
            styles={{ body: { padding: '16px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px', background: 'var(--brand-cream)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {act.icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block', fontSize: '14px', color: 'var(--brand-maroon-dark)' }}>{act.title}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.desc}</Text>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {recLoading ? (
        <Card loading={true} style={{ borderRadius: 20, border: '1px solid #f1f5f9', height: 180, margin: '24px 0' }} />
      ) : recommendations.length > 0 ? (
        <div style={{ margin: '24px 0' }}>
          <Title level={4} style={{ color: 'var(--brand-maroon-dark)', margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
            ✨ {isHi ? "आपके लिए दैनिक सिफारिशें" : "Personalized Recommendations"}
          </Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {recommendations.map((rec) => (
              <Card 
                key={rec.id}
                style={{ 
                  borderRadius: '20px', 
                  border: '1px solid #f1f5f9', 
                  background: rec.isPremium && !rec.unlocked ? '#fafafa' : '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.015)' 
                }}
                styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' } }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Tag color={
                      rec.category === 'DIET' ? 'green' : 
                      rec.category === 'MINDFULNESS' ? 'purple' : 
                      rec.category === 'EXERCISE' ? 'blue' : 
                      rec.category === 'AUDIO' ? 'magenta' : 'orange'
                    }>
                      {rec.category}
                    </Tag>
                    {rec.isPremium && (
                      <Tag color={rec.unlocked ? 'gold' : 'error'}>
                        {rec.unlocked ? '🔓 Unlocked' : '🔒 Premium'}
                      </Tag>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{rec.icon}</span>
                    <div>
                      <Text strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>
                        {rec.title}
                      </Text>
                      <Paragraph type="secondary" style={{ fontSize: '11px', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {rec.description}
                      </Paragraph>
                    </div>
                  </div>
                </div>
                <Button 
                  type={rec.unlocked ? 'primary' : 'default'} 
                  block
                  onClick={() => navigate(rec.unlocked ? rec.actionLink : '/pricing')}
                  style={{ 
                    borderRadius: '8px', 
                    fontWeight: 'bold',
                    background: rec.unlocked ? '#be123c' : undefined,
                    borderColor: rec.unlocked ? '#be123c' : undefined,
                    color: rec.unlocked ? '#fff' : undefined,
                    fontSize: '12px',
                    height: '32px'
                  }}
                >
                  {rec.unlocked ? (isHi ? "अभ्यास पर जाएं" : "Go to Practice") : (isHi ? "प्रीमियम अनलॉक करें" : "Unlock Premium")}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* 280-Day Calendar & Navigation */}
      <Card style={{ 
        borderRadius: 28, 
        boxShadow: '0 10px 30px rgba(0,0,0,0.02)', 
        border: '1px solid #f1f5f9',
        background: '#fff',
        overflow: 'hidden',
        marginBottom: '24px',
        minHeight: '580px'
      }}>
        <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fffcf6 100%)', padding: '24px', borderBottom: '1px solid #fed7aa' }}>
          <Title level={4} style={{ margin: 0, color: 'var(--brand-maroon-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✨ {isHi ? "280-दिवसीय दिव्य गर्भ संस्कार यात्रा" : "280-Day Divine Garbh Sanskar Journey Map"}
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            {isHi 
              ? "अपनी गर्भावस्था के प्रत्येक दिन का अनुसरण करें और बच्चे के स्वस्थ विकास को सुनिश्चित करें।" 
              : "Track your progress across trimesters, months, and weeks with curated daily activities."}
          </Paragraph>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Trimester Timeline Track */}
          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
              {isHi ? "गर्भावस्था की तिमाहियां" : "Pregnancy Trimesters"}
            </Text>
            <Row gutter={[16, 16]}>
              {[
                { number: 1, range: "Weeks 1-12", title: isHi ? "प्राण संचार" : "Prana Sanchar", desc: isHi ? "प्रथम तिमाही" : "Trimester 1", bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '#fde68a', color: '#b45309' },
                { number: 2, range: "Weeks 13-26", title: isHi ? "इंद्रिय संचार" : "Indriya Sanchar", desc: isHi ? "द्वितीय तिमाही" : "Trimester 2", bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', border: '#fdba74', color: '#c2410c' },
                { number: 3, range: "Weeks 27-40", title: isHi ? "चेतना संचार" : "Chetana Sanchar", desc: isHi ? "तृतीय तिमाही" : "Trimester 3", bg: 'linear-gradient(135deg, #fff1f2 0%, #fecdd3 100%)', border: '#fecdd3', color: '#be123c' }
              ].map(tri => {
                const active = selectedTrimester === tri.number;
                const isCurrent = Math.max(1, Math.min(3, Math.floor(((user.pregnancyDay || 1) - 1) / 84) + 1)) === tri.number;
                return (
                  <Col xs={24} md={8} key={tri.number}>
                    <Card
                      hoverable
                      onClick={() => {
                        const firstDay = (tri.number - 1) * 84 + 1;
                        setSelectedDay(firstDay);
                      }}
                      style={{
                        borderRadius: 20,
                        background: tri.bg,
                        border: active ? `2px solid ${tri.color}` : `1px solid ${tri.border}`,
                        boxShadow: active ? '0 8px 20px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.3s'
                      }}
                      styles={{ body: { padding: '16px' } }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <Text style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>{tri.desc} · {tri.range}</Text>
                          <Title level={5} style={{ margin: '4px 0 0 0', color: tri.color, fontWeight: '800' }}>{tri.title}</Title>
                        </div>
                        {isCurrent && <Tag color="orange" style={{ borderRadius: 10, fontSize: '10px' }}>CURRENT</Tag>}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          {/* Month Cards Scrollable Row */}
          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
              {isHi ? "मासिक विकासात्मक पड़ाव" : "Monthly Developmental Progress"}
            </Text>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
              {getMonthsForTrimester(selectedTrimester).map((m) => {
                const active = selectedMonth === m;
                const monthStartDay = (m - 1) * 28 + 1;
                const isMonthLocked = monthStartDay > (user.pregnancyDay || 1);
                
                const monthHighlights = [
                  isHi ? "भ्रूण विकास शुरू" : "Embryo formation",
                  isHi ? "नन्हा दिल धड़कता है" : "Heartbeat begins",
                  isHi ? "उंगलियां और चेहरा विकास" : "Facial features",
                  isHi ? "गर्भ में हलचल शुरू" : "Movements begin",
                  isHi ? "आवाजें सुनना शुरू" : "Hearing opens",
                  isHi ? "मस्तिष्क तरंगें सक्रिय" : "Brain active",
                  isHi ? "आंखें खुलती हैं" : "Eyes opening",
                  isHi ? "तेजी से विकास" : "Rapid growth",
                  isHi ? "जन्म की तैयारी" : "Preparing for birth",
                  isHi ? "पूर्ण विकास" : "Fully developed"
                ];

                return (
                  <Card
                    key={m}
                    hoverable
                    onClick={() => setSelectedDay(monthStartDay)}
                    style={{
                      minWidth: 160,
                      maxWidth: 160,
                      borderRadius: 16,
                      border: active ? '2px solid #f97316' : '1px solid #e2e8f0',
                      background: active ? '#fffaf8' : (isMonthLocked ? '#f8fafc' : '#fff'),
                      transition: 'all 0.2s'
                    }}
                    styles={{ body: { padding: '12px' } }}
                  >
                    <Text strong style={{ display: 'block', fontSize: '13px', color: active ? '#c2410c' : '#1e293b' }}>
                      {isHi ? `महीना ${m}` : `Month ${m}`}
                    </Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                      Weeks {(m-1)*4 + 1}-{m*4}
                    </Text>
                    <div style={{ height: '36px', overflow: 'hidden', marginTop: '6px' }}>
                      <Text style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                        {monthHighlights[m - 1] || 'Growth phase'}
                      </Text>
                    </div>
                    {isMonthLocked ? (
                      <Tag color="default" style={{ marginTop: '8px', fontSize: '9px', borderRadius: 8 }}>LOCKED 🔒</Tag>
                    ) : (
                      <Tag color={active ? 'orange' : 'success'} style={{ marginTop: '8px', fontSize: '9px', borderRadius: 8 }}>
                        {active ? 'ACTIVE' : 'UNLOCKED'}
                      </Tag>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={18}>
              {/* Weeks List */}
              <div style={{ marginBottom: '20px' }}>
                <Text strong style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>
                  {isHi ? "सप्ताह चुनें" : "Select Gestational Week"}
                </Text>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {getWeeksForMonth(selectedMonth).map((w) => {
                    const active = selectedWeek === w;
                    
                    // Simple completion tracker for the week
                    const firstDay = (w - 1) * 7 + 1;
                    const lastDay = w * 7;
                    const daysCompleted = timelineOverview?.days?.filter(d => d.dayNumber >= firstDay && d.dayNumber <= lastDay && d.completed).length || 0;

                    return (
                      <Button
                        key={w}
                        type={active ? 'primary' : 'default'}
                        onClick={() => setSelectedDay(firstDay)}
                        style={{
                          borderRadius: '12px',
                          background: active ? '#be123c' : '#fff',
                          borderColor: active ? '#be123c' : '#d1d5db',
                          color: active ? '#fff' : '#475569',
                          fontWeight: 'bold',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{isHi ? `सप्ताह ${w}` : `Week ${w}`}</span>
                        {daysCompleted > 0 && (
                          <Badge count={`${daysCompleted}/7`} style={{ backgroundColor: active ? '#fff' : '#10b981', color: active ? '#be123c' : '#fff', fontSize: '10px', boxShadow: 'none' }} />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Day Progression Timeline Stepper */}
              <div>
                <Text strong style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
                  {isHi ? "दैनिक यात्रा पथ" : "Daily Journey Path"}
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '8px 0' }}>
                  {getDaysForWeek(selectedWeek).map((d, index) => {
                    const active = selectedDay === d;
                    const isDayLocked = d > (user.pregnancyDay || 1);
                    const dayProgress = timelineOverview?.days?.find((entry) => entry.dayNumber === d);
                    const isDayCompleted = Boolean(dayProgress?.completed);

                    return (
                      <React.Fragment key={d}>
                        {index > 0 && <div style={{ height: '2px', width: '20px', backgroundColor: isDayLocked ? '#cbd5e1' : '#f97316', flexShrink: 0 }} />}
                        <button
                          onClick={() => setSelectedDay(d)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: active ? '3px solid #f97316' : '1px solid #cbd5e1',
                            background: active ? '#fffaf8' : (isDayLocked ? '#e2e8f0' : '#fff'),
                            color: isDayLocked ? '#64748b' : '#1e293b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.3s',
                            transform: active ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: active ? '0 0 12px rgba(249, 115, 22, 0.4)' : 'none',
                            flexShrink: 0
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>D{d}</span>
                          {isDayLocked && (
                            <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '9px', background: '#fff', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🔒</span>
                          )}
                          {!isDayLocked && isDayCompleted && (
                            <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '9px', background: '#fff', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>✅</span>
                          )}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </Col>

            <Col xs={24} md={6} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #f1f5f9', paddingLeft: '24px' }}>
              <Progress 
                type="circle" 
                percent={isLocked ? 0 : progressPercent} 
                size={90} 
                strokeColor={{
                  '0%': '#f97316',
                  '100%': '#be123c',
                }} 
              />
              <Text strong style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginTop: '12px', letterSpacing: '1px' }}>
                {isHi ? "दैनिक पूर्णता दर" : "Daily Progress"}
              </Text>
              <Text type="secondary" style={{ fontSize: '10px', marginTop: '2px' }}>
                {isHi ? `${completedCount} / 4 आयाम पूर्ण` : `${completedCount} of 4 activities done`}
              </Text>
            </Col>
          </Row>
        </div>
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

            {/* Coaching Feedback Display */}
            {progressData?.myDailyProgress?.[`${activeQuotient.toLowerCase()}Feedback`] && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>👩‍⚕️</span>
                  <Text strong style={{ fontSize: '12px', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isHi ? "प्रशिक्षक प्रतिक्रिया" : "Guide / Coaching Feedback"}
                  </Text>
                </div>
                <Paragraph style={{ margin: 0, color: '#14532d', fontSize: '13px', fontStyle: 'italic', lineHeight: '1.5' }}>
                  "{progressData.myDailyProgress[`${activeQuotient.toLowerCase()}Feedback`]}"
                </Paragraph>
              </div>
            )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span>🤝 {isHi ? "पिता और परिवार दैनिक अनुष्ठान" : "Partner & Family Daily Ritual"}</span>
              {partnerStreak?.currentStreak > 0 && (
                <Tag color="volcano" style={{ fontWeight: 'bold', borderRadius: '12px' }}>
                  🔥 {isHi ? `साथी की लगातार सक्रियता: ${partnerStreak.currentStreak} दिन` : `Streak: ${partnerStreak.currentStreak} Days`}
                </Tag>
              )}
            </div>
          }
          style={{ 
            borderRadius: 24, 
            boxShadow: '0 8px 24px rgba(0,0,0,0.02)', 
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
            marginBottom: '20px'
          }}
        >
          <div style={{ padding: '4px' }}>
            <Title level={5} style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{partnerActivity.title}</Title>
            <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
              {partnerActivity.description}
            </Paragraph>

            {/* Custom Assigned Task Section */}
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '16px', 
              marginBottom: '20px' 
            }}>
              {partnerLog?.assignedTaskTitle ? (
                <div>
                  <Text strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    📋 {isHi ? "संबद्ध विशिष्ट कार्य (Custom Task)" : "Custom Assigned Task"}
                  </Text>
                  <Text strong style={{ fontSize: '14px', color: '#be123c', display: 'block' }}>
                    {partnerLog.assignedTaskTitle}
                  </Text>
                  {partnerLog.assignedTaskDesc && (
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '2px' }}>
                      {partnerLog.assignedTaskDesc}
                    </Text>
                  )}
                </div>
              ) : user.role?.roleType === 'MOTHER' ? (
                <div>
                  <Text strong style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '8px' }}>
                    ➕ {isHi ? "साथी के लिए नया कार्य असाइन करें" : "Assign a Custom Task to Partner"}
                  </Text>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Input
                      placeholder={isHi ? "कार्य का नाम (जैसे: पैरों की मालिश)" : "Task Title (e.g. Back massage)"}
                      value={assignTaskTitle}
                      onChange={e => setAssignTaskTitle(e.target.value)}
                      style={{ borderRadius: '8px' }}
                    />
                    <Input.TextArea
                      rows={2}
                      placeholder={isHi ? "निर्देश (वैकल्पिक)" : "Instructions / details (optional)"}
                      value={assignTaskDesc}
                      onChange={e => setAssignTaskDesc(e.target.value)}
                      style={{ borderRadius: '8px' }}
                    />
                    <Button
                      type="primary"
                      onClick={() => {
                        if (!assignTaskTitle.trim()) {
                          toast.error('Task title is required');
                          return;
                        }
                        assignPartnerTask({
                          variables: {
                            dayNumber: selectedDay,
                            title: assignTaskTitle.trim(),
                            description: assignTaskDesc.trim() || null
                          }
                        });
                      }}
                      loading={assigningTask}
                      style={{ background: '#be123c', borderColor: '#be123c', borderRadius: '8px', fontWeight: 'bold' }}
                    >
                      {isHi ? "कार्य असाइन करें" : "Assign Task"}
                    </Button>
                  </Space>
                </div>
              ) : (
                <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                  {isHi ? "माँ द्वारा अभी तक कोई विशिष्ट कार्य असाइन नहीं किया गया है।" : "No custom task assigned yet by Mother."}
                </Text>
              )}
            </div>

            {/* Response Capture Section */}
            {user.role?.roleType === 'PARTNER' && !partnerLog?.partnerResponse && (
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <Text strong style={{ fontSize: '12px', color: '#b45309', display: 'block', marginBottom: '8px' }}>
                  ✏️ {isHi ? "अपनी प्रतिक्रिया दर्ज करें" : "Write Your Action Response"}
                </Text>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Input.TextArea
                    rows={2}
                    placeholder={isHi ? "आपने यह कार्य कैसे पूरा किया..." : "How did you perform this activity..."}
                    value={partnerResponseText}
                    onChange={e => setPartnerResponseText(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  />
                  <Input.TextArea
                    rows={1}
                    placeholder={isHi ? "परिवार के अन्य सदस्यों के विचार (वैकल्पिक)" : "Notes from other family members (optional)"}
                    value={partnerFamilyNotes}
                    onChange={e => setPartnerFamilyNotes(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  />
                  <Button
                    type="primary"
                    onClick={() => {
                      if (!partnerResponseText.trim()) {
                        toast.error('Response text is required');
                        return;
                      }
                      submitPartnerResponse({
                        variables: {
                          dayNumber: selectedDay,
                          response: partnerResponseText.trim(),
                          familyNotes: partnerFamilyNotes.trim() || null
                        }
                      });
                    }}
                    loading={submittingResponse}
                    style={{ background: '#d97706', borderColor: '#d97706', borderRadius: '8px', fontWeight: 'bold' }}
                  >
                    {isHi ? "प्रतिक्रिया जमा करें" : "Submit Response"}
                  </Button>
                </Space>
              </div>
            )}

            {/* Display Submitted Responses */}
            {partnerLog?.partnerResponse && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <Text strong style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  💬 {isHi ? "साथी की प्रतिक्रिया" : "Partner Response / Action captured"}
                </Text>
                <Paragraph style={{ margin: 0, fontSize: '13px', color: '#14532d', fontStyle: 'italic' }}>
                  "{partnerLog.partnerResponse}"
                </Paragraph>
                {partnerLog.familyNotes && (
                  <div style={{ marginTop: '8px', borderTop: '1px dashed #bbf7d0', paddingTop: '8px' }}>
                    <Text strong style={{ fontSize: '10px', color: '#166534', display: 'block' }}>
                      {isHi ? "परिवार के विचार:" : "Family Notes:"}
                    </Text>
                    <Text style={{ fontSize: '12px', color: '#14532d' }}>{partnerLog.familyNotes}</Text>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <Tag color={partnerLog?.partnerAcknowledged ? "green" : "orange"} style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px' }}>
                {partnerLog?.partnerAcknowledged
                  ? (isHi ? "✓ साथी द्वारा पूर्ण" : "✓ Completed by Partner")
                  : (isHi ? "⚠️ लंबित" : "⚠️ Pending Partner Completion")
                }
              </Tag>

              {user.role?.roleType !== 'PARTNER' && (
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
                  style={{ borderRadius: '12px', fontWeight: 'bold' }}
                >
                  {partnerLog?.partnerAcknowledged
                    ? (isHi ? "अपूर्ण चिह्नित करें" : "Mark as Incomplete")
                    : (isHi ? "पूर्ण चिह्नित करें" : "Mark Completed")
                  }
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Partner Link & Consent Card */}
      {!isLocked && (
        <Card
          title={
            <span>
              🔒 {isHi ? "साथी जुड़ाव और साझाकरण सेटिंग्स" : "Partner Link & Sharing Consent"}
            </span>
          }
          style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        >
          <div style={{ padding: '4px' }}>
            {user?.partner ? (
              <div>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={12}>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      {isHi ? "संबद्ध साथी ईमेल" : "LINKED PARTNER EMAIL"}
                    </Text>
                    <Text strong style={{ fontSize: '15px' }}>{user.partner.emailAddress}</Text>
                  </Col>
                  <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                    <Tag color="success" style={{ padding: '4px 12px', borderRadius: 8 }}>
                      {isHi ? "सक्रिय रूप से संबद्ध" : "Actively Linked"}
                    </Tag>
                  </Col>
                </Row>
                <Divider style={{ margin: '16px 0' }} />
                <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '12px' }}>
                  {isHi ? "साझाकरण अनुमतियाँ" : "Sharing Permissions"}
                </Text>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Checkbox
                    checked={user.shareVitalsWithPartner}
                    onChange={(e) => {
                      updatePartnerSharing({
                        variables: {
                          shareVitals: e.target.checked,
                          shareReports: user.shareReportsWithPartner
                        }
                      });
                    }}
                  >
                    {isHi ? "साथी के साथ स्वास्थ्य महत्वपूर्ण विवरण (Vitals) साझा करें" : "Share health vitals logs with partner"}
                  </Checkbox>
                  <Checkbox
                    checked={user.shareReportsWithPartner}
                    onChange={(e) => {
                      updatePartnerSharing({
                        variables: {
                          shareVitals: user.shareVitalsWithPartner,
                          shareReports: e.target.checked
                        }
                      });
                    }}
                  >
                    {isHi ? "साथी के साथ साप्ताहिक यात्रा रिपोर्ट साझा करें" : "Share weekly journey reports with partner"}
                  </Checkbox>
                </Space>
              </div>
            ) : (
              <div>
                <Paragraph type="secondary" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  {isHi
                    ? "अपने जीवनसाथी के साथ अपनी मातृत्व यात्रा साझा करें। वे दैनिक साथी कार्यों को देख सकते हैं, प्रोत्साहन भेज सकते हैं और आपकी सहमति के अनुसार प्रगति देख सकते हैं।"
                    : "Invite and link your partner to join your Garbh Sanskar journey. They will receive their own dashboard, assigned tasks, and can send you encouraging messages."}
                </Paragraph>
                <Row gutter={12} style={{ marginTop: '16px' }}>
                  <Col xs={16} md={18}>
                    <Input
                      placeholder={isHi ? "साथी का ईमेल दर्ज करें..." : "Enter partner's email address..."}
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      style={{ borderRadius: '10px', height: '40px' }}
                    />
                  </Col>
                  <Col xs={8} md={6}>
                    <Button
                      type="primary"
                      block
                      loading={linkingPartner}
                      onClick={() => {
                        if (!partnerEmail.trim()) return;
                        linkPartner({ variables: { partnerEmail: partnerEmail.trim() } });
                      }}
                      style={{ borderRadius: '10px', height: '40px' }}
                    >
                      {isHi ? "लिंक करें" : "Link Partner"}
                    </Button>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Daily Sensory (Panchendriya) Activity Card */}
      {!isLocked && sensoryActivity && (
        <Card
          title={
            <span style={{ color: 'var(--brand-maroon-dark)', fontWeight: 'bold' }}>
              🎨 {isHi ? "पंचेंद्रिय और रचनात्मक गतिविधि" : "Five-Sense & Creative Activity"}
            </span>
          }
          style={{ 
            borderRadius: 24, 
            boxShadow: '0 8px 24px rgba(0,0,0,0.02)', 
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
            marginBottom: '20px'
          }}
        >
          <div style={{ padding: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Tag 
                color={
                  sensoryActivity.senseType === 'HEARING' ? 'orange' :
                  sensoryActivity.senseType === 'SIGHT' ? 'cyan' :
                  sensoryActivity.senseType === 'SMELL' ? 'purple' :
                  sensoryActivity.senseType === 'TASTE' ? 'gold' : 'rose'
                } 
                style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px' }}
              >
                {sensoryActivity.senseType === 'HEARING' ? (isHi ? "👂 श्रवण (Sound)" : "👂 HEARING (Shravana)") :
                 sensoryActivity.senseType === 'SIGHT' ? (isHi ? "👁️ दर्शन (Sight)" : "👁️ SIGHT (Darshana)") :
                 sensoryActivity.senseType === 'SMELL' ? (isHi ? "👃 घ्राण (Smell)" : "👃 SMELL (Ghrana)") :
                 sensoryActivity.senseType === 'TASTE' ? (isHi ? "👅 रसना (Taste)" : "👅 TASTE (Rasana)") :
                 (isHi ? "✋ स्पर्श (Touch)" : "✋ TOUCH (Sparsha)")
                }
              </Tag>
            </div>
            
            <Title level={4} style={{ margin: '0 0 10px 0', color: '#1e293b', fontWeight: 'bold' }}>
              {sensoryActivity.title}
            </Title>
            
            <Paragraph type="secondary" style={{ fontSize: '13.5px', lineHeight: 1.6, marginBottom: '20px' }}>
              {sensoryActivity.description}
            </Paragraph>

            {/* Guidance Pack Section */}
            {sensoryActivity.guidance && (
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '16px', 
                padding: '16px', 
                marginBottom: '20px' 
              }}>
                <Text strong style={{ fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  💡 {isHi ? "मार्गदर्शन और निर्देश" : "Instructions & Guidance Pack"}
                </Text>
                <Paragraph style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                  {sensoryActivity.guidance}
                </Paragraph>
              </div>
            )}

            {/* Media Packs */}
            {sensoryActivity.mediaLinks && (
              <div style={{ marginBottom: '20px' }}>
                <Text strong style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  🎵 {isHi ? "गतिविधि मीडिया संसाधन" : "Associated Guidance Media"}
                </Text>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(() => {
                    let links = [];
                    try {
                      links = JSON.parse(sensoryActivity.mediaLinks);
                    } catch (e) {
                      links = sensoryActivity.mediaLinks.split(',').map(l => l.trim()).filter(Boolean);
                    }
                    if (!Array.isArray(links)) links = [links];
                    return links.map((link, idx) => {
                      const isAudio = link.endsWith('.mp3') || link.endsWith('.wav') || link.includes('audio');
                      const isVideo = link.endsWith('.mp4') || link.includes('youtube') || link.includes('vimeo');
                      return (
                        <Button
                          key={idx}
                          type="default"
                          icon={isAudio ? <SoundOutlined /> : isVideo ? <PlayCircleOutlined /> : <BookOutlined />}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ borderRadius: '10px', fontSize: '12px' }}
                        >
                          {isAudio ? (isHi ? "ऑडियो चलाएं" : "Play Guidance Audio") : 
                           isVideo ? (isHi ? "वीडियो देखें" : "Watch Guidance Video") :
                           (isHi ? "संसाधन लिंक खोलें" : "Open Resource Link")}
                        </Button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <Tag color={sensoryLog?.completed ? "success" : "processing"} style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px' }}>
                {sensoryLog?.completed
                  ? (isHi ? "✓ गतिविधि पूर्ण" : "✓ Activity Completed")
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
                style={{ borderRadius: '12px', fontWeight: 'bold' }}
              >
                {sensoryLog?.completed
                  ? (isHi ? "अपूर्ण चिह्नित करें" : "Mark as Incomplete")
                  : (isHi ? "पूर्ण चिह्नित करें" : "Mark as Completed")
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
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
                <Space direction="vertical" style={{ width: '100%', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
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
    </div>
  );
}

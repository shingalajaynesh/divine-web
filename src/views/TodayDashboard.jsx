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
  Skeleton,
  Grid
} from 'antd';
import {
  PlayCircleOutlined,
  DownloadOutlined,
  SoundOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  BookOutlined,
  HeartOutlined,
  HeartFilled,
  BulbOutlined,
  CompassOutlined,
  SmileOutlined,
  WarningOutlined,
  FormOutlined,
  TeamOutlined,
  FireOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  MessageOutlined,
  PictureOutlined,
  EyeOutlined,
  UnlockOutlined,
  LockOutlined,
  ClockCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  CrownOutlined,
  CoffeeOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  ToolOutlined,
  SolutionOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import {
  EnterpriseCard,
  EnterpriseStatCard,
  EnterpriseSection,
  EnterpriseEmptyState,
  EnterpriseErrorState,
  EnterpriseLoading,
  EnterpriseStatusTag,
  EnterpriseDrawer,
  EnterpriseTimeline,
  EnterpriseHeroCard,
  EnterpriseQuickActions,
  EnterpriseMetricCard,
  EnterpriseOfflineBanner,
  MotherBabyIllustration
} from '../shared/components';
import { enterpriseTokens } from '../shared/theme/enterpriseTokens';

const { Title, Paragraph, Text } = Typography;

const getRecommendationIcon = (emoji) => {
  switch (emoji) {
    case '👑': return <TrophyOutlined style={{ color: '#faad14' }} />;
    case '🥬':
    case '🥦': return <HeartOutlined style={{ color: '#52c41a' }} />;
    case '🙏': return <SmileOutlined style={{ color: '#fa8c16' }} />;
    case '🧘‍♀️': return <SmileOutlined style={{ color: '#13c2c2' }} />;
    case '📖': return <BookOutlined style={{ color: '#1890ff' }} />;
    case '🎥': return <PlayCircleOutlined style={{ color: '#ff4d4f' }} />;
    case '🥚': return <HeartOutlined style={{ color: '#d9d9d9' }} />;
    case '🎵': return <SoundOutlined style={{ color: '#722ed1' }} />;
    case '🍵': return <CoffeeOutlined style={{ color: '#fa8c16' }} />;
    case '😴': return <ClockCircleOutlined style={{ color: '#2f54eb' }} />;
    case '❤️': return <HeartFilled style={{ color: '#f5222d' }} />;
    case '💧': return <HeartOutlined style={{ color: '#096dd9' }} />;
    default: return emoji;
  }
};

const getVirtueIcon = (id) => {
  switch (id) {
    case 'intelligence': return <BulbOutlined style={{ color: '#1890ff', marginRight: 6 }} />;
    case 'empathy': return <HeartOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />;
    case 'courage': return <TrophyOutlined style={{ color: '#fa8c16', marginRight: 6 }} />;
    case 'devotion': return <CompassOutlined style={{ color: '#722ed1', marginRight: 6 }} />;
    case 'creativity': return <PictureOutlined style={{ color: '#eb2f96', marginRight: 6 }} />;
    case 'eloquence': return <SoundOutlined style={{ color: '#13c2c2', marginRight: 6 }} />;
    default: return null;
  }
};

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
      icon: <SmileOutlined style={{ color: '#10b981', fontSize: '24px' }} />,
      actionLabel: isHi ? "आहार एवं योग चार्ट" : (isGu ? "આહાર અને યોગ ચાર્ट" : "View Diet & Yoga"),
      category: "yoga"
    },
    IQ: {
      title: isHi ? "बौद्धिक स्वास्थ्य (Intelligence Quotient)" : (isGu ? "બૌદ્ધિક સ્વાસ્થ્ય (Intelligence Quotient)" : "Intelligence Development (IQ)"),
      description: isHi
        ? "एक पहेली या वर्ग पहेली खेलें। गर्भ में पल रहे शिशु के संज्ञानात्मक विकास के लिए आज 10 मिनट कुछ नया पढ़ने में व्यतीत करें।"
        : (isGu
          ? "આજે એક કોયડો અથવા તાર્કિક રમત રમો. ગર્ભસ્થ શિશુના જ્ઞાનાત્મક વિકાસ માટે આજે ૧૦ મિનિટ કંઈક નવું વાંચવા માટે વિતાવો."
          : "Solve a puzzle or play a logic game today. Nurture your baby's cognitive development by reading an educational story for 10 minutes."),
      icon: <BulbOutlined style={{ color: '#1890ff', fontSize: '24px' }} />,
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
      icon: <HeartFilled style={{ color: '#f5222d', fontSize: '24px' }} />,
      actionLabel: isHi ? "संवाद अभ्यास" : (isGu ? "ગર્ભ સંવાદ કરો" : "Practice Bonding"),
      category: "dialogue"
    },
    SQ: {
      title: isHi ? "आध्यात्मिक स्वास्थ्य (Spiritual Quotient)" : (isGu ? "આધ્યાત્મિક સ્વાસ્થ્ય (Spiritual Quotient)" : "Spiritual Aura (SQ)"),
      description: isHi
        ? "आज शांति से गायत्री मंत्र का 11 बार उच्चारण करें। सकारात्मक दिव्य ऊर्जा प्रवाह पर ध्यान केंद्रित करते हुए 10 मिनट ध्यान लगाएं।"
        : (isGu
          ? "આજે ૧૧ વાર શાંતિથી ગાયત્રી મંત્રનો જાપ કરો. ગર્ભસ્થ શિશુની આસપાસ દૈવી પ્રકાશ અને હકારาત્મક ઊર્જાની કલ્પના કરીને ૧૦ મિનિટ શાંત ધ્યાન કરો."
          : "Chant the Gayatri Mantra 11 times. Spend 10 minutes in silent meditation, visualizing divine light and positive energy surrounding your baby."),
      icon: <CompassOutlined style={{ color: '#722ed1', fontSize: '24px' }} />,
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
  const screens = Grid.useBreakpoint();
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
    { id: 'intelligence', labelText: isHi ? 'तीक्ष्ण बुद्धि (IQ)' : 'Intelligence (IQ)', label: isHi ? 'तीक्ष्ण बुद्धि (IQ)' : 'Intelligence (IQ)', desc: isHi ? 'तेज स्मरण शक्ति और त्वरित समझ' : 'Sharp recall & rapid logic' },
    { id: 'empathy', labelText: isHi ? 'करुणा व संवेदनशीलता (EQ)' : 'Compassion & Empathy (EQ)', label: isHi ? 'करुणा व संवेदनशीलता (EQ)' : 'Compassion & Empathy (EQ)', desc: isHi ? 'दूसरों के प्रति उदारता और संबल' : 'Gentle kindness & social harmony' },
    { id: 'courage', labelText: isHi ? 'साहस व आत्मबल (PQ)' : 'Courage & Strength (PQ)', label: isHi ? 'साहस व आत्मबल (PQ)' : 'Courage & Strength (PQ)', desc: isHi ? 'बहादुरी, खेल और शारीरिक स्फूर्ति' : 'Fearless spirit & glowing fitness' },
    { id: 'devotion', labelText: isHi ? 'अध्यात्म व शांति (SQ)' : 'Spiritual Calm (SQ)', label: isHi ? 'अध्यात्म व शांति (SQ)' : 'Spiritual Calm (SQ)', desc: isHi ? 'ध्यानमग्न मन और वैदिक ज्ञान' : 'Serene mind & inner values' },
    { id: 'creativity', labelText: isHi ? 'रचनात्मक प्रतिभा' : 'Artistic Creativity', label: isHi ? 'रचनात्मक प्रतिभा' : 'Artistic Creativity', desc: isHi ? 'संगीत, कला और अनूठी कल्पनाशीलता' : 'Music, art & original imagination' },
    { id: 'eloquence', labelText: isHi ? 'ओजस्वी वाणी' : 'Power of Speech', label: isHi ? 'ओजस्वी वाणी' : 'Power of Speech', desc: isHi ? 'प्रभावशाली वक्तृत्व और स्पष्टता' : 'Expressive speaking & confidence' },
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

  // Skeleton Loading Layout
  const isInitialLoading = 
    (contentLoading && !content) || 
    (babyLoading && !baby) || 
    (progressLoading && !progressData) || 
    (timelineLoading && !timelineOverviewData);

  if (isInitialLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <EnterpriseLoading type="card" count={3} />
        <div style={{ marginTop: '24px' }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  // Circular progress dimensions
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div style={{ padding: screens.xs ? '8px 0 80px 0' : '0 0 40px 0', maxWidth: '1200px', margin: '0 auto' }}>
      <EnterpriseOfflineBanner />

      {/* Top Banner Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={16}>
          <EnterpriseHeroCard
            activeRole="MOTHER"
            greeting={isHi ? "नमस्ते, सुंदर माँ!" : "HELLO, BEAUTIFUL MOTHER!"}
            title={babyName ? `${babyName}'s Home` : (isHi ? "स्वर्ण मातृत्व यात्रा" : "My Holy Pregnancy")}
            quote={isHi ? "हर धड़कन प्यार से शुरू होती है।" : "Every heartbeat begins with love."}
            subtitle={isHi 
              ? `सप्ताह ${user.currentWeek} • ${trimesterStory.title} • प्राण संचार` 
              : `Week ${user.currentWeek} • Trimester ${user.currentTrimester} • Prana Sanchar`}
            illustration={<MotherBabyIllustration />}
          />
        </Col>

        <Col xs={24} md={8}>
          <EnterpriseCard activeRole="MOTHER" hoverable={false} style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#ffe4e6" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#be123c" 
                    strokeWidth="8" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', fontSize: '18px', fontWeight: 'bold', color: '#be123c' }}>
                  {progressPercent}%
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', display: 'block' }}>
                  {isHi ? "आज की प्रगति" : "TODAY'S PROGRESS"}
                </Text>
                <Text strong style={{ fontSize: '15px', color: '#24191a', display: 'block', marginTop: '4px' }}>
                  {completedCount} / 4 Activities
                </Text>
                <Text style={{ fontSize: '11px', color: '#76676a', display: 'block', marginTop: '2px' }}>
                  {isHi ? "स्वस्थ शिशु विकास के लिए" : "For healthy development"}
                </Text>
              </div>
            </div>
          </EnterpriseCard>
        </Col>
      </Row>

      {/* Quick Actions Grid */}
      <EnterpriseSection activeRole="MOTHER" title={isHi ? "त्वरित उपकरण" : "Quick Actions"}>
        <EnterpriseQuickActions
          activeRole="MOTHER"
          actions={[
            { key: '/diet-planner', icon: <HeartOutlined />, label: isHi ? 'आहार योजना' : 'Diet Planner', onClick: () => navigate('/diet-planner') },
            { key: '/vitals', icon: <HeartFilled />, label: isHi ? 'दैनिक कार्य' : 'Vitals Tracker', onClick: () => navigate('/vitals') },
            { key: '/weekly-report', icon: <BarChartOutlined />, label: isHi ? 'साप्ताहिक रिपोर्ट' : 'Weekly Reports', onClick: () => navigate('/weekly-report') },
            { key: '/expert-consulting', icon: <SolutionOutlined />, label: isHi ? 'विशेषज्ञ सलाह' : 'Expert Consulting', onClick: () => navigate('/expert-consulting') },
            { key: '/pregnancy-tools', icon: <ToolOutlined />, label: isHi ? 'गर्भावस्था उपकरण' : 'Pregnancy Tools', onClick: () => navigate('/pregnancy-tools') },
          ]}
        />
      </EnterpriseSection>

      {/* Baby Development Detail Card */}
      <EnterpriseCard activeRole="MOTHER" hoverable={false} style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8} style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar src="/smiling_baby.png" size={110} style={{ border: '3px solid #ffe4e6' }} />
          </Col>
          <Col xs={24} sm={16}>
            <span style={{ color: '#be123c', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
              {isHi ? "शिशु विकास" : "BABY DEVELOPMENT"}
            </span>
            <Title level={4} style={{ margin: '4px 0 8px 0' }}>
              {isHi ? `सप्ताह ${selectedWeek}: विकास की गति` : `Week ${selectedWeek} Development`}
            </Title>
            <Paragraph style={{ color: '#76676a', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
              {baby?.description || (isHi 
                ? "आपका शिशु तेजी से बढ़ रहा है। सकारात्मक सोचें और संगीत सुनें।" 
                : "Your baby is growing beautifully. Keep reading positive books and listen to calming music.")}
            </Paragraph>
            <div style={{ marginTop: '12px' }}>
              <Tag color="rose" style={{ fontWeight: 'bold', color: '#be123c', backgroundColor: '#fff1f2', borderColor: '#ffe4e6' }}>
                {isHi ? `आकार: ${baby?.size || "एक छोटा बीज"}` : `Size: ${baby?.size || "a tiny seed"}`}
              </Tag>
            </div>
          </Col>
        </Row>
      </EnterpriseCard>

      {/* Today's Journey Activities */}
      <EnterpriseSection activeRole="MOTHER" title={isHi ? "दैनिक संस्कार साधना" : "Today's Garbh Sanskar Journey"}>
        <Row gutter={[16, 16]}>
          {Object.entries(quotients).map(([qKey, act]) => {
            const isCompleted = completedActivities[qKey];
            return (
              <Col xs={24} sm={12} key={qKey}>
                <EnterpriseCard 
                  activeRole="MOTHER"
                  hoverable
                  style={{ 
                    borderLeft: `5px solid ${isCompleted ? '#287a55' : '#be123c'}`,
                    height: '100%'
                  }}
                  onClick={() => {
                    setActiveQuotient(qKey);
                    setReadingModalVisible(true);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '24px' }}>{act.icon}</span>
                      <div>
                        <Text strong style={{ display: 'block', fontSize: '14px', color: '#24191a' }}>
                          {act.title}
                        </Text>
                        <Paragraph type="secondary" style={{ fontSize: '12px', margin: '4px 0 0 0', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {act.description}
                        </Paragraph>
                      </div>
                    </div>
                    <Checkbox 
                      checked={isCompleted} 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActivity(qKey);
                      }} 
                    />
                  </div>
                </EnterpriseCard>
              </Col>
            );
          })}
        </Row>
      </EnterpriseSection>

      {/* Recommendations & Advice Disclaimers */}
      {recommendations.length > 0 && (
        <EnterpriseSection activeRole="MOTHER" title={isHi ? "व्यक्तिगत मार्गदर्शन" : "Wellness Guidance for You"}>
          <Row gutter={[16, 16]}>
            {recommendations.map((rec) => (
              <Col xs={24} sm={12} md={8} key={rec.id}>
                <EnterpriseCard activeRole="MOTHER">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{getRecommendationIcon(rec.icon)}</span>
                    <div>
                      <Text strong style={{ fontSize: '13px' }}>{rec.title}</Text>
                      <Paragraph type="secondary" style={{ fontSize: '11px', margin: '4px 0 0 0' }}>
                        {rec.description}
                      </Paragraph>
                    </div>
                  </div>
                  <Button 
                    type={rec.unlocked ? 'primary' : 'default'} 
                    block
                    onClick={() => navigate(rec.unlocked ? rec.actionLink : '/pricing')}
                    style={{ borderRadius: '8px', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    {rec.unlocked ? (isHi ? "शुरू करें" : "Start Now") : (isHi ? "अनलॉक करें" : "Unlock")}
                  </Button>
                </EnterpriseCard>
              </Col>
            ))}
          </Row>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>
              * This content is for general wellness education and does not replace advice from your doctor.
            </Text>
          </div>
        </EnterpriseSection>
      )}

      {/* 280-Day Calendar Maps */}
      <EnterpriseCard activeRole="MOTHER" hoverable={false} style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0, color: '#be123c' }}>
            {isHi ? "280-दिवसीय संस्कार यात्रा मानचित्र" : "280-Day Garbh Sanskar Map"}
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
            {isHi 
              ? "अपनी गर्भावस्था के प्रत्येक दिन का अनुसरण करें और बच्चे के स्वस्थ विकास को सुनिश्चित करें।" 
              : "Track your progress across trimesters, months, and weeks with curated daily activities."}
          </Paragraph>
        </div>

        {/* Trimester selection indicator bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[1, 2, 3].map((tri) => (
            <Button
              key={tri}
              type={selectedTrimester === tri ? "primary" : "default"}
              onClick={() => setSelectedDay((tri - 1) * 84 + 1)}
              style={{ borderRadius: '8px', fontWeight: 'bold' }}
            >
              Trimester {tri}
            </Button>
          ))}
        </div>

        {/* Dynamic Month selectors */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
          {getMonthsForTrimester(selectedTrimester).map((mon) => (
            <Button
              key={mon}
              size="small"
              type={selectedMonth === mon ? "primary" : "dashed"}
              onClick={() => setSelectedDay((mon - 1) * 28 + 1)}
              style={{ borderRadius: '6px' }}
            >
              Month {mon}
            </Button>
          ))}
        </div>

        {/* Week & Day bubble grid */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px' }}>
          {getWeeksForMonth(selectedMonth).map((wk) => (
            <Button
              key={wk}
              size="small"
              type={selectedWeek === wk ? "primary" : "text"}
              onClick={() => setSelectedDay((wk - 1) * 7 + 1)}
              style={{ borderRadius: '6px' }}
            >
              Wk {wk}
            </Button>
          ))}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* Days grid bubbles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {getDaysForWeek(selectedWeek).map((dy) => {
            const isToday = dy === user.pregnancyDay;
            const isSel = dy === selectedDay;
            return (
              <Button
                key={dy}
                shape="circle"
                type={isSel ? "primary" : isToday ? "dashed" : "default"}
                onClick={() => setSelectedDay(dy)}
                style={{
                  width: '40px',
                  height: '40px',
                  fontWeight: isToday ? 'bold' : 'normal',
                  borderColor: isToday ? '#be123c' : undefined
                }}
              >
                {dy}
              </Button>
            );
          })}
        </div>
      </EnterpriseCard>

      {/* Dream Child Visualizer Chart Card */}
      <EnterpriseCard activeRole="MOTHER" hoverable={false} style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}><StarOutlined style={{ color: '#faad14' }} /> {isHi ? "स्वप्न संतान संकल्प (Dream Child Chart)" : "Dream Child Chart Creator"}</Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
            {isHi ? "गर्भस्थ शिशु में जिन गुणों को विकसित करना चाहती हैं, उनका संकल्प लें" : "Select and visualize the core virtues you wish to invoke in your child"}
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  {isHi ? "शिशु का नाम या लाडला नाम (Nickname)" : "Baby Name or Nickname"}
                </Text>
                <Input
                  size="large"
                  placeholder={isHi ? "जैसे: अंश, आरवी..." : "e.g., Little Angel..."}
                  value={babyName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{ marginTop: '6px' }}
                />
              </div>

              <div>
                <Text type="secondary" strong style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  {isHi ? "गुणों का चयन करें (अधिकतम 4)" : "Select Virtues (Max 4)"}
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {allVirtues.map((v) => {
                    const isSelected = selectedVirtues.includes(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => handleVirtueToggle(v.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? '#be123c' : '#f1f5f9'}`,
                          background: isSelected ? '#fff5f5' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span>{getVirtueIcon(v.id)}</span>
                          <Text strong style={{ fontSize: '13px' }}>{v.labelText}</Text>
                        </div>
                        {isSelected ? <HeartFilled style={{ color: '#be123c' }} /> : <PlusOutlined />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fff5f5 0%, #fff0f6 100%)',
              border: '1px solid #ffe4e6',
              textAlign: 'center'
            }}>
              <Title level={5} style={{ margin: 0, color: '#be123c' }}>
                {babyName ? babyName : (isHi ? "मेरा प्यारा शिशु" : "My Dream Child")}
              </Title>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', margin: '12px 0' }}>
                {selectedVirtues.length > 0 ? (
                  selectedVirtues.map(vid => {
                    const matched = allVirtues.find(v => v.id === vid);
                    return (
                      <Tag color="rose" key={vid} style={{ fontWeight: 'bold' }}>
                        {matched?.labelText}
                      </Tag>
                    );
                  })
                ) : (
                  <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>
                    {isHi ? "गुणों का चयन करें..." : "Select virtues..."}
                  </Text>
                )}
              </div>
              <Button
                type="primary"
                block
                disabled={selectedVirtues.length === 0}
                onClick={() => window.print()}
              >
                {isHi ? "स्वप्न चार्ट प्रिंट करें" : "Print Dream Chart"}
              </Button>
            </div>
          </Col>
        </Row>
      </EnterpriseCard>

      {/* Audio/Video/Reading Modals */}
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
        title={quotients[activeQuotient]?.title}
        body={quotients[activeQuotient]?.description}
        lang={userLang}
      />
    </div>
  );
}

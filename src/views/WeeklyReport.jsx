import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Progress, 
  Table, 
  Tag, 
  Button, 
  Select, 
  Space, 
  Typography,
  Empty
} from 'antd';
import { 
  FireOutlined, 
  TrophyOutlined, 
  PrinterOutlined, 
  CheckCircleFilled, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  BookOutlined
} from '@ant-design/icons';
import { 
  MY_STREAK_QUERY, 
  MY_ACHIEVEMENTS_QUERY, 
  MY_WEEKLY_REPORT_QUERY 
} from '../graphql/operations';

const { Title, Text, Paragraph } = Typography;

const badgeDefinitions = {
  FIRST_STEPS: {
    title: 'First Steps',
    titleHi: 'पहला कदम',
    desc: 'Completed your first daily activity ritual.',
    descHi: 'अपनी पहली दैनिक गतिविधि पूरी की।',
    emoji: '👣'
  },
  THREE_DAY_STREAK: {
    title: 'Three-Day Streak',
    titleHi: 'तीन दिवसीय लय',
    desc: 'Consistent for three consecutive days.',
    descHi: 'लगातार तीन दिनों तक पूर्णता बनाए रखी।',
    emoji: '⭐'
  },
  PERFECT_WEEK: {
    title: 'Perfect Week',
    titleHi: 'सर्वश्रेष्ठ सप्ताह',
    desc: 'Maintained a perfect 7-day completion streak.',
    descHi: 'एक आदर्श 7-दिवसीय पूर्णता लय बनाए रखी।',
    emoji: '👑'
  }
};

export default function WeeklyReport({ user, lang }) {
  const isHi = lang === 'hi';
  const currentPregnancyWeek = user?.currentWeek || 1;
  const [selectedWeek, setSelectedWeek] = useState(currentPregnancyWeek);

  const { data: streakData } = useQuery(MY_STREAK_QUERY);
  const { data: achievementsData } = useQuery(MY_ACHIEVEMENTS_QUERY);
  const { data: reportData, loading: reportLoading } = useQuery(MY_WEEKLY_REPORT_QUERY, {
    variables: { weekNumber: selectedWeek }
  });

  const streak = streakData?.myStreak;
  const achievements = achievementsData?.myAchievements || [];
  const report = reportData?.myWeeklyReport;

  const unlockedBadgeKeys = achievements.map(a => a.badgeKey);

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: isHi ? 'दिन' : 'Day',
      dataIndex: 'dayNumber',
      key: 'dayNumber',
      render: (day) => <Text strong>{isHi ? `दिन ${day}` : `Day ${day}`}</Text>
    },
    {
      title: 'PQ',
      dataIndex: 'pqCompleted',
      key: 'pqCompleted',
      align: 'center',
      render: (done) => done ? <CheckCircleFilled style={{ color: '#10b981' }} /> : <CloseCircleOutlined style={{ color: '#cbd5e1' }} />
    },
    {
      title: 'IQ',
      dataIndex: 'iqCompleted',
      key: 'iqCompleted',
      align: 'center',
      render: (done) => done ? <CheckCircleFilled style={{ color: '#10b981' }} /> : <CloseCircleOutlined style={{ color: '#cbd5e1' }} />
    },
    {
      title: 'EQ',
      dataIndex: 'eqCompleted',
      key: 'eqCompleted',
      align: 'center',
      render: (done) => done ? <CheckCircleFilled style={{ color: '#10b981' }} /> : <CloseCircleOutlined style={{ color: '#cbd5e1' }} />
    },
    {
      title: 'SQ',
      dataIndex: 'sqCompleted',
      key: 'sqCompleted',
      align: 'center',
      render: (done) => done ? <CheckCircleFilled style={{ color: '#10b981' }} /> : <CloseCircleOutlined style={{ color: '#cbd5e1' }} />
    },
    {
      title: isHi ? 'कुल समय' : 'Duration',
      dataIndex: 'totalDurationMins',
      key: 'totalDurationMins',
      render: (mins) => <Tag color="blue"><ClockCircleOutlined /> {mins} {isHi ? 'मिनट' : 'mins'}</Tag>
    },
    {
      title: isHi ? 'अनुभव और डायरी' : 'Reflections & Notes',
      dataIndex: 'reflections',
      key: 'reflections',
      render: (notes) => (
        <Space orientation="vertical" size={2}>
          {notes && notes.length > 0 ? (
            notes.map((note, index) => (
              <Paragraph key={index} style={{ margin: 0, fontSize: '12px' }} type="secondary">
                • {note}
              </Paragraph>
            ))
          ) : (
            <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>
              {isHi ? 'कोई नोट्स नहीं' : 'No reflections logged'}
            </Text>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="print-container" style={{ padding: '4px' }}>
      <style>{`
        @media print {
          .app-sider, .app-topbar, .mobile-bottom-nav, .no-print, .ant-layout-sider, .ant-layout-header {
            display: none !important;
          }
          .app-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          .app-main-layout {
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }
          .print-container {
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .ant-card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            margin-bottom: 16px !important;
          }
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {isHi ? 'साप्ताहिक प्रगति और डायरी रिपोर्ट' : 'Weekly Progress & Reflection Report'}
          </Title>
          <Text type="secondary">
            {isHi ? 'शिशु के 4 आयामी विकास की साप्ताहिक रिपोर्ट' : 'Holistic quotients metrics & printable journal logs'}
          </Text>
        </div>
        
        <Space className="no-print">
          <Select
            value={selectedWeek}
            onChange={setSelectedWeek}
            style={{ width: 140 }}
            options={Array.from({ length: 40 }, (_, i) => ({
              value: i + 1,
              label: isHi ? `सप्ताह ${i + 1}` : `Week ${i + 1}`
            }))}
          />
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            style={{ background: '#f43f5e', borderColor: '#f43f5e' }}
          >
            {isHi ? 'रिपोर्ट प्रिंट करें / PDF सहेजें' : 'Print Report / Save PDF'}
          </Button>
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        {/* Left Column: Streaks and Achievements */}
        <Col xs={24} lg={8}>
          <Space orientation="vertical" style={{ width: '100%' }} size={20}>
            {/* Streak Card */}
            <Card 
              title={<span><FireOutlined style={{ color: '#f97316', marginRight: 8 }} />{isHi ? 'दैनिक लय' : 'Daily Streaks'}</span>}
              style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            >
              <Row gutter={16}>
                <Col span={12} style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                  <Statistic 
                    title={isHi ? 'वर्तमान लय' : 'Current Streak'} 
                    value={streak?.currentStreak || 0} 
                    suffix={isHi ? 'दिन' : 'days'}
                    valueStyle={{ color: '#f97316', fontWeight: 'bold' }}
                  />
                </Col>
                <Col span={12} style={{ textAlign: 'center' }}>
                  <Statistic 
                    title={isHi ? 'सर्वोत्तम लय' : 'Longest Streak'} 
                    value={streak?.longestStreak || 0} 
                    suffix={isHi ? 'दिन' : 'days'}
                    valueStyle={{ color: '#b45309', fontWeight: 'bold' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* Achievements Card */}
            <Card 
              title={<span><TrophyOutlined style={{ color: '#eab308', marginRight: 8 }} />{isHi ? 'अर्जित उपलब्धियां' : 'Achievements & Badges'}</span>}
              style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            >
              <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                {Object.entries(badgeDefinitions).map(([key, def]) => {
                  const unlocked = unlockedBadgeKeys.includes(key);
                  return (
                    <div 
                      key={key} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        background: unlocked ? '#fffbeb' : '#fafafa',
                        opacity: unlocked ? 1 : 0.6,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>
                        {unlocked ? def.emoji : '🔒'}
                      </div>
                      <div>
                        <Text strong style={{ display: 'block', fontSize: '13px' }}>
                          {isHi ? def.titleHi : def.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                          {isHi ? def.descHi : def.desc}
                        </Text>
                        {unlocked && (
                          <Tag color="gold" style={{ fontSize: '9px', marginTop: '4px' }}>
                            {isHi ? 'अनलॉक हुआ' : 'UNLOCKED'}
                          </Tag>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Space>
            </Card>
          </Space>
        </Col>

        {/* Right Column: Weekly Progress and Reflections Table */}
        <Col xs={24} lg={16}>
          <Card 
            style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            bodyStyle={{ padding: '24px' }}
          >
            {reportLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Progress type="circle" percent={30} status="active" /></div>
            ) : report ? (
              <div>
                {/* Summary Row */}
                <Row gutter={16} style={{ marginBottom: '24px', alignItems: 'center' }}>
                  <Col xs={24} sm={8} style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <Progress 
                      type="circle" 
                      percent={Math.round((report.completedDaysCount / 7) * 100)} 
                      strokeColor="#f43f5e" 
                      size={100}
                    />
                    <Text strong style={{ display: 'block', marginTop: '12px' }}>
                      {isHi ? 'साप्ताहिक पूर्णता' : 'Weekly Completion'}
                    </Text>
                  </Col>
                  
                  <Col xs={24} sm={16}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card size="small" style={{ background: '#fffafb', borderColor: '#ffe4e6' }}>
                          <Statistic 
                            title={isHi ? 'पूर्ण किए गए दिन' : 'Completed Days'} 
                            value={report.completedDaysCount} 
                            suffix="/ 7" 
                            valueStyle={{ color: '#e11d48' }}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card size="small" style={{ background: '#f0f9ff', borderColor: '#e0f2fe' }}>
                          <Statistic 
                            title={isHi ? 'कुल अभ्यास समय' : 'Total Exercise Time'} 
                            value={report.totalWeekDurationMins} 
                            suffix={isHi ? 'मिनट' : 'mins'}
                            valueStyle={{ color: '#0284c7' }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Title level={5} style={{ margin: '0 0 12px 0' }}>
                  <BookOutlined style={{ marginRight: 8 }} />
                  {isHi ? 'साप्ताहिक गतिविधि लॉग' : 'Weekly Activity Logs'}
                </Title>
                
                <Table 
                  columns={columns} 
                  dataSource={report.days} 
                  rowKey="dayNumber"
                  pagination={false} 
                  bordered
                  size="small"
                  style={{ background: '#fff' }}
                />
              </div>
            ) : (
              <Empty description={isHi ? "इस सप्ताह का कोई डेटा उपलब्ध नहीं है" : "No progress data available for this week."} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

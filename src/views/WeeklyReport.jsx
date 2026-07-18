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
  Empty,
  Radio,
  Input
} from 'antd';
import { 
  FireOutlined, 
  TrophyOutlined, 
  PrinterOutlined, 
  CheckCircleFilled, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  LockOutlined,
  StarOutlined,
  EditOutlined,
  SmileOutlined
} from '@ant-design/icons';
import { 
  MY_STREAK_QUERY, 
  MY_ACHIEVEMENTS_QUERY, 
  MY_WEEKLY_REPORT_QUERY,
  GET_MONTHLY_REPORT_QUERY
} from '../graphql/operations';

const { Title, Text, Paragraph } = Typography;

const badgeDefinitions = {
  FIRST_STEPS: {
    title: 'First Steps',
    titleHi: 'पहला कदम',
    desc: 'Completed your first daily activity ritual.',
    descHi: 'अपनी पहली दैनिक गतिविधि पूरी की।',
    emoji: <SmileOutlined style={{ color: '#52c41a' }} />
  },
  THREE_DAY_STREAK: {
    title: 'Three-Day Streak',
    titleHi: 'तीन दिवसीय लय',
    desc: 'Consistent for three consecutive days.',
    descHi: 'लगातार तीन दिनों तक पूर्णता बनाए रखी।',
    emoji: <FireOutlined style={{ color: '#ff4d4f' }} />
  },
  PERFECT_WEEK: {
    title: 'Perfect Week',
    titleHi: 'सर्वश्रेष्ठ सप्ताह',
    desc: 'Maintained a perfect 7-day completion streak.',
    descHi: 'एक आदर्श 7-दिवसीय पूर्णता लय बनाए रखी।',
    emoji: <TrophyOutlined style={{ color: '#faad14' }} />
  }
};

export default function WeeklyReport({ user, lang }) {
  const isHi = lang === 'hi';
  const currentPregnancyWeek = user?.currentWeek || 1;
  const currentPregnancyMonth = Math.max(1, Math.min(10, Math.floor((user?.pregnancyDay || 1) - 1) / 28 + 1));

  const [reportType, setReportType] = useState('WEEKLY'); // 'WEEKLY' or 'MONTHLY'
  const [selectedWeek, setSelectedWeek] = useState(currentPregnancyWeek);
  const [selectedMonth, setSelectedMonth] = useState(currentPregnancyMonth);
  const [customSummary, setCustomSummary] = useState('');

  const { data: streakData } = useQuery(MY_STREAK_QUERY);
  const { data: achievementsData } = useQuery(MY_ACHIEVEMENTS_QUERY);

  // Queries for report details
  const { data: weeklyReportData, loading: weeklyLoading } = useQuery(MY_WEEKLY_REPORT_QUERY, {
    variables: { weekNumber: selectedWeek },
    skip: reportType !== 'WEEKLY'
  });

  const { data: monthlyReportData, loading: monthlyLoading } = useQuery(GET_MONTHLY_REPORT_QUERY, {
    variables: { monthNumber: selectedMonth },
    skip: reportType !== 'MONTHLY'
  });

  const streak = streakData?.myStreak;
  const achievements = achievementsData?.myAchievements || [];
  const weeklyReport = weeklyReportData?.myWeeklyReport;
  const monthlyReport = monthlyReportData?.myMonthlyReport;

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
        <Space orientation="vertical" size={2} style={{ width: '100%' }}>
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
    <div className="print-container" style={{ padding: '8px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @media print {
          .app-sider, .app-topbar, .mobile-bottom-nav, .no-print, .ant-layout-sider, .ant-layout-header, .radio-selectors {
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
          .printable-journal-frame {
            border: 2px double #be123c !important;
            border-radius: 12px !important;
            padding: 24px !important;
            margin: 12px 0 !important;
            background: #fff !important;
          }
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: 'var(--brand-maroon-dark)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StarOutlined style={{ color: '#faad14' }} /> {isHi ? 'गर्भ संस्कार यात्रा पत्रिका और रिपोर्ट' : 'Garbh Sanskar Journey Journal & Reports'}
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {isHi ? 'शिशु के बहु-आयामी विकास का साप्ताहिक एवं मासिक प्रलेखन' : 'Weekly & monthly journey dashboards with printable memories'}
          </Text>
        </div>
        
        <Space className="no-print" size="middle">
          <Radio.Group 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          >
            <Radio.Button value="WEEKLY" style={{ fontWeight: 'bold' }}>
              {isHi ? 'साप्ताहिक रिपोर्ट' : 'Weekly Report'}
            </Radio.Button>
            <Radio.Button value="MONTHLY" style={{ fontWeight: 'bold' }}>
              {isHi ? 'मासिक रिपोर्ट' : 'Monthly Report'}
            </Radio.Button>
          </Radio.Group>

          {reportType === 'WEEKLY' ? (
            <Select
              value={selectedWeek}
              onChange={setSelectedWeek}
              style={{ width: 140 }}
              options={Array.from({ length: 40 }, (_, i) => ({
                value: i + 1,
                label: isHi ? `सप्ताह ${i + 1}` : `Week ${i + 1}`
              }))}
            />
          ) : (
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 140 }}
              options={Array.from({ length: 10 }, (_, i) => ({
                value: i + 1,
                label: isHi ? `माह ${i + 1}` : `Month ${i + 1}`
              }))}
            />
          )}

          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            style={{ background: '#be123c', borderColor: '#be123c', fontWeight: 'bold', borderRadius: '8px' }}
          >
            {isHi ? 'प्रिंट / PDF सहेजें' : 'Print / Export PDF'}
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Streaks and Achievements */}
        <Col xs={24} lg={8} className="no-print">
          <Space orientation="vertical" style={{ width: '100%' }} size={24}>
            {/* Streak Card */}
            <Card 
              title={<span><FireOutlined style={{ color: '#f97316', marginRight: 8 }} />{isHi ? 'आपकी यात्रा निरंतरता' : 'Your Journey Streaks'}</span>}
              style={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}
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
              style={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}
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
                        borderRadius: '16px',
                        border: '1px solid #f1f5f9',
                        background: unlocked ? '#fffbeb' : '#fafafa',
                        opacity: unlocked ? 1 : 0.6
                      }}
                    >
                      <div style={{ fontSize: '28px', display: 'flex', alignItems: 'center' }}>
                        {unlocked ? def.emoji : <LockOutlined style={{ color: '#bfbfbf' }} />}
                      </div>
                      <div>
                        <Text strong style={{ display: 'block', fontSize: '13px' }}>
                          {isHi ? def.titleHi : def.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                          {isHi ? def.descHi : def.desc}
                        </Text>
                        {unlocked && (
                          <Tag color="gold" style={{ fontSize: '9px', marginTop: '4px', border: 'none' }}>
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

        {/* Right Column: Printable Journal Block */}
        <Col xs={24} lg={16}>
          <div className="printable-journal-frame" style={{ 
            background: '#ffffff', 
            borderRadius: '24px', 
            border: '1px solid #f1f5f9', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.02)', 
            padding: '24px' 
          }}>
            {/* Custom customizable journal entry */}
            <div style={{ marginBottom: '24px', background: '#fffcfc', padding: '16px', borderRadius: '16px', border: '1px dashed #fecdd3' }} className="no-print">
              <Text strong style={{ fontSize: '13px', color: 'var(--brand-maroon-dark)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <EditOutlined style={{ color: '#be123c' }} /> {isHi ? "इस अवधि का आपका व्यक्तिगत अनुभव या विचार (अभिलेख में शामिल करें)" : "Add Custom Reflections / Gratitude Note for Printout"}
              </Text>
              <Input.TextArea
                rows={3}
                placeholder={isHi ? "शिशु के साथ बिताए विशेष पल, आपकी भावनाएं या आभार संदेश लिखें..." : "E.g. Feeling deep bonding with the baby during classical music sessions..."}
                value={customSummary}
                onChange={e => setCustomSummary(e.target.value)}
                style={{ borderRadius: '12px', border: '1px solid #f3f4f6' }}
              />
            </div>

            {reportType === 'WEEKLY' ? (
              // Weekly Report UI
              weeklyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Progress type="circle" percent={45} status="active" /></div>
              ) : weeklyReport ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                      <CalendarOutlined style={{ marginRight: 8, color: '#be123c' }} />
                      {isHi ? `सप्ताह ${selectedWeek} की विकास प्रगति` : `Week ${selectedWeek} Development Summary`}
                    </Title>
                    <Tag color="magenta" style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px' }}>
                      {isHi ? `दिन ${(selectedWeek-1)*7 + 1} - ${selectedWeek*7}` : `Day ${(selectedWeek-1)*7 + 1} - ${selectedWeek*7}`}
                    </Tag>
                  </div>

                  <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={8} style={{ textAlign: 'center', marginBottom: '12px' }}>
                      <Progress 
                        type="circle" 
                        percent={Math.round((weeklyReport.completedDaysCount / 7) * 100)} 
                        strokeColor="#be123c" 
                        size={110}
                      />
                      <Text strong style={{ display: 'block', marginTop: '12px', color: '#475569' }}>
                        {isHi ? 'साप्ताहिक अनुष्ठान पूर्णता' : 'Weekly Ritual Completion'}
                      </Text>
                    </Col>
                    
                    <Col xs={24} sm={16}>
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Card size="small" style={{ background: '#fffafb', borderColor: '#ffe4e6', borderRadius: '16px' }}>
                            <Statistic 
                              title={isHi ? 'लॉग किए गए दिन' : 'Days Completed'} 
                              value={weeklyReport.completedDaysCount} 
                              suffix="/ 7" 
                              valueStyle={{ color: '#be123c', fontWeight: 'bold' }}
                            />
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" style={{ background: '#f0f9ff', borderColor: '#e0f2fe', borderRadius: '16px' }}>
                            <Statistic 
                              title={isHi ? 'सक्रियता समय' : 'Total Practice Time'} 
                              value={weeklyReport.totalWeekDurationMins} 
                              suffix={isHi ? 'मिनट' : 'mins'}
                              valueStyle={{ color: '#0284c7', fontWeight: 'bold' }}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </Col>
                  </Row>

                  {customSummary && (
                    <div style={{ background: '#fafafa', borderLeft: '4px solid #be123c', padding: '12px 16px', borderRadius: '0 12px 12px 0', marginBottom: '24px' }}>
                      <Text strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StarOutlined style={{ color: '#faad14' }} /> {isHi ? "माँ के विचार और कृतज्ञता" : "Mother's Reflection & Gratitude Summary"}
                      </Text>
                      <Paragraph style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '13px', color: '#334155' }}>
                        "{customSummary}"
                      </Paragraph>
                    </div>
                  )}

                  <Title level={5} style={{ margin: '0 0 12px 0', color: '#334155' }}>
                    <BookOutlined style={{ marginRight: 8 }} />
                    {isHi ? 'दैनिक अभ्यास लॉग' : 'Daily Practice Log'}
                  </Title>
                  
                  <Table 
                    columns={columns} 
                    dataSource={weeklyReport.days} 
                    rowKey="dayNumber"
                    pagination={false} 
                    bordered
                    size="small"
                    style={{ background: '#fff' }}
                  />
                </div>
              ) : (
                <Empty description={isHi ? "इस सप्ताह का कोई डेटा उपलब्ध नहीं है" : "No progress data available for this week."} />
              )
            ) : (
              // Monthly Report UI
              monthlyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Progress type="circle" percent={60} status="active" /></div>
              ) : monthlyReport ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                      <CalendarOutlined style={{ marginRight: 8, color: '#be123c' }} />
                      {isHi ? `माह ${selectedMonth} की मासिक प्रगति रिपोर्ट` : `Month ${selectedMonth} Journey Report`}
                    </Title>
                    <Tag color="rose" style={{ fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px' }}>
                      {isHi ? `सप्ताह ${(selectedMonth-1)*4 + 1} - ${selectedMonth*4}` : `Week ${(selectedMonth-1)*4 + 1} - ${selectedMonth*4}`}
                    </Tag>
                  </div>

                  <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={8} style={{ textAlign: 'center', marginBottom: '12px' }}>
                      <Progress 
                        type="circle" 
                        percent={Math.round((monthlyReport.completedDaysCount / 28) * 100)} 
                        strokeColor="#e11d48" 
                        size={110}
                      />
                      <Text strong style={{ display: 'block', marginTop: '12px', color: '#475569' }}>
                        {isHi ? 'मासिक चक्र पूर्णता' : 'Monthly Cycle Completion'}
                      </Text>
                    </Col>
                    
                    <Col xs={24} sm={16}>
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Card size="small" style={{ background: '#fffafb', borderColor: '#ffe4e6', borderRadius: '16px' }}>
                            <Statistic 
                              title={isHi ? 'पूर्ण किए गए कुल दिन' : 'Total Days Completed'} 
                              value={monthlyReport.completedDaysCount} 
                              suffix="/ 28" 
                              valueStyle={{ color: '#be123c', fontWeight: 'bold' }}
                            />
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" style={{ background: '#f0f9ff', borderColor: '#e0f2fe', borderRadius: '16px' }}>
                            <Statistic 
                              title={isHi ? 'कुल सक्रियता समय' : 'Total Practice Time'} 
                              value={monthlyReport.totalMonthDurationMins} 
                              suffix={isHi ? 'मिनट' : 'mins'}
                              valueStyle={{ color: '#0284c7', fontWeight: 'bold' }}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </Col>
                  </Row>

                  {customSummary && (
                    <div style={{ background: '#fafafa', borderLeft: '4px solid #be123c', padding: '12px 16px', borderRadius: '0 12px 12px 0', marginBottom: '24px' }}>
                      <Text strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StarOutlined style={{ color: '#faad14' }} /> {isHi ? "मासिक माँ के विचार और डायरी" : "Monthly Reflections Summary"}
                      </Text>
                      <Paragraph style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '13px', color: '#334155' }}>
                        "{customSummary}"
                      </Paragraph>
                    </div>
                  )}

                  <Title level={5} style={{ margin: '0 0 16px 0', color: '#334155' }}>
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    {isHi ? 'सप्ताह-वार सारांश विवरण' : 'Week-wise Progress Breakdown'}
                  </Title>

                  {monthlyReport.weeks.map((wk, idx) => (
                    <Card 
                      key={idx} 
                      size="small" 
                      style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                      title={isHi ? `सप्ताह ${wk.weekNumber} प्रगति विवरण` : `Week ${wk.weekNumber} Activity Grid`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <Text type="secondary">
                          {isHi ? `पूर्ण दिन: ${wk.completedDaysCount} / 7` : `Days Completed: ${wk.completedDaysCount} / 7`}
                        </Text>
                        <Text type="secondary">
                          {isHi ? `अभ्यास समय: ${wk.totalWeekDurationMins} मिनट` : `Practice Time: ${wk.totalWeekDurationMins} mins`}
                        </Text>
                      </div>
                      <Table
                        columns={columns}
                        dataSource={wk.days}
                        rowKey="dayNumber"
                        pagination={false}
                        bordered
                        size="small"
                      />
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty description={isHi ? "इस माह का कोई डेटा उपलब्ध नहीं है" : "No progress data available for this month."} />
              )
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}

import React from 'react';
import { Avatar, Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
  ArrowRightOutlined,
  BookOutlined,
  CalendarOutlined,
  CustomerServiceOutlined,
  HeartOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  SoundOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const SUPPORT_URL = 'https://wa.me/919638484545?text=Hello%20Divine%20team%2C%20I%20would%20like%20guidance.';

const inspiration = [
  { title: 'Calm digestion', copy: 'Gentle habits for pregnancy', icon: <HeartOutlined />, className: 'tone-maroon' },
  { title: 'Mindful bonding', copy: 'Connect with your baby', icon: <SoundOutlined />, className: 'tone-saffron' },
  { title: 'Deep rest', copy: 'Sleep and meditation', icon: <PlayCircleOutlined />, className: 'tone-plum' },
];

const actions = [
  { title: 'Baby growth', copy: 'Weekly milestones', icon: <HeartOutlined />, path: '/baby-growth', tone: 'pink' },
  { title: 'Daily activities', copy: 'Mind, body and values', icon: <CalendarOutlined />, path: '/programmes', tone: 'amber' },
  { title: 'Explore library', copy: 'Stories, yoga and music', icon: <BookOutlined />, path: '/library', tone: 'green' },
  { title: 'Community', copy: 'Ask, share and support', icon: <TeamOutlined />, path: '/forum', tone: 'lavender' },
];

export default function ExperienceHome({ user }) {
  const navigate = useNavigate();
  const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Mother';

  return (
    <div className="experience-home">
      <section className="home-greeting">
        <div><Text className="home-kicker">Namaste, {firstName}</Text><Title level={1}>Your Divine space for today</Title><Paragraph>Small, thoughtful practices for you and your baby—organised in one calm place.</Paragraph></div>
        <Avatar src="/logo.jpg" size={72} shape="square" />
      </section>

      <section className="inspiration-rail">
        {inspiration.map((item) => <button key={item.title} className={`inspiration-tile ${item.className}`} onClick={() => navigate('/library')}><span className="tile-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.copy}</small></span></button>)}
      </section>

      <section className="care-banner">
        <span className="care-icon"><CustomerServiceOutlined /></span>
        <div><Title level={3}>Talk to our care team</Title><Text>Personal guidance when you need it.</Text></div>
        <Space wrap><Button type="primary" href="tel:+919638484545">Call now</Button><Button href={SUPPORT_URL} target="_blank">Schedule a call</Button></Space>
      </section>

      <section className="journey-banner">
        <div><Tag>Your pregnancy journey</Tag><Title>Week {user?.currentWeek || 1}</Title><Paragraph>Follow your personalised Garbh Sanskar plan with daily activities, expert guidance and baby-development milestones.</Paragraph><Space wrap><span>Trimester {user?.currentTrimester || 1}</span><span>Day {user?.pregnancyDay || 1} of 280</span></Space></div>
        <div className="journey-mark"><HeartOutlined /></div>
      </section>

      <SectionHeading title="Explore your Divine space" action="View library" onClick={() => navigate('/library')} />
      <Row gutter={[16, 16]}>
        {actions.map((item) => <Col xs={12} md={6} key={item.title}><button className={`home-action-card tone-${item.tone}`} onClick={() => navigate(item.path)}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.copy}</small></button></Col>)}
      </Row>

      <Row gutter={[18, 18]} className="home-content-row">
        <Col xs={24} lg={15}>
          <Card className="today-practice-card">
            <div className="practice-icon"><SafetyCertificateOutlined /></div>
            <div><Text className="home-kicker">TODAY FOR YOU</Text><Title level={3}>A quiet moment with your baby</Title><Paragraph>Sit comfortably, take five slow breaths and share one loving thought with your baby.</Paragraph><Button type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate('/programmes')}>Start today’s practice</Button></div>
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card className="programme-card"><VideoCameraOutlined className="programme-icon" /><Title level={3}>Divine Complete Programme</Title><Paragraph>Daily activities, meditation, yoga, diet guidance and live expert sessions.</Paragraph><Button block onClick={() => navigate('/programmes')}>Explore programme <ArrowRightOutlined /></Button></Card>
        </Col>
      </Row>

      <section className="testimonial-card"><span>“</span><Paragraph>The daily guidance helped me feel calmer, connected and confident throughout my pregnancy.</Paragraph><strong>A Divine mother · Surat</strong></section>

      <a className="web-floating-help" href={SUPPORT_URL} target="_blank" rel="noreferrer" aria-label="Chat with Divine support"><MessageOutlined /></a>
    </div>
  );
}

function SectionHeading({ title, action, onClick }) {
  return <div className="home-section-heading"><Title level={2}>{title}</Title><Button type="link" onClick={onClick}>{action} <ArrowRightOutlined /></Button></div>;
}

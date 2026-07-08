import React from 'react';
import {
  Avatar,
  Button,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  SafetyCertificateOutlined,
  PhoneOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://www.thedivinegarbhsanskar.com';
const SUPPORT_URL = 'https://wa.me/919638484545?text=Hello%20Divine%20Garbh%20Sanskar%20support';

export function WelcomeScreen({ t, onSignInClick }) {
  return (
    <main className="welcome-shell">
      <header className="welcome-header">
        <div className="brand-lockup">
          <Avatar src="/logo.jpg" size={52} shape="square" className="brand-logo" />
          <div>
            <strong>Divine Garbh Sanskar</strong>
            <span>Weaving cultural roots into motherhood</span>
          </div>
        </div>
        <Button href={MARKETING_URL}>Visit website</Button>
      </header>

      <section className="welcome-content">
        <div className="welcome-copy">
          <Tag className="eyebrow-tag">{t.welcome}</Tag>
          <Title>Thoughtful guidance for every week of your pregnancy.</Title>
          <Paragraph>{t.journey_desc}</Paragraph>
          <Space wrap size={12}>
            <Button type="primary" size="large" onClick={onSignInClick}>
              Sign in to your dashboard
            </Button>
            <Button size="large" icon={<PhoneOutlined />} href={SUPPORT_URL} target="_blank">
              Talk to a counsellor
            </Button>
          </Space>
          <div className="welcome-trust-row">
            <span><SafetyCertificateOutlined /> Private account</span>
            <span>Hindi & English</span>
            <span>Web, iOS & Android</span>
          </div>
        </div>

        <aside className="welcome-preview" aria-label="Product highlights">
          <img src="/logo.jpg" alt="Divine Garbh Sanskar" />
          <div className="preview-card preview-card-main">
            <small>Your journey</small>
            <strong>Daily wellness, baby growth and expert guidance</strong>
            <span>One calm, organised place for your pregnancy programme.</span>
          </div>
          <div className="preview-card preview-card-small">40-week personalised path</div>
        </aside>
      </section>
    </main>
  );
}

export default WelcomeScreen;

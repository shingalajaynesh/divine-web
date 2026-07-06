import { Card, Button, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function DedicatedGuides({ t }) {
  const guides = [
    {
      name: 'Dr. Sunita Sharma',
      role: 'Chief Garbh Sanskar Trainer',
      color: 'orange',
    },
    {
      name: 'Mrs. Priya Patel',
      role: 'Prenatal Yoga Expert',
      color: 'pink',
    }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}>👩‍⚕️ {t.guides_title}</Title>
        <Paragraph type="secondary" style={{ fontSize: '12px', margin: '2px 0 0 0' }}>
          {t.guides_sub}
        </Paragraph>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {guides.map((guide, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#ffedd5', color: '#f97316' }} />
              <div>
                <Text strong style={{ fontSize: '13px', display: 'block' }}>{guide.name}</Text>
                <Text type="secondary" style={{ fontSize: '10px' }}>{guide.role}</Text>
              </div>
            </div>
            <Button size="small" type="default" href="/expert-consulting">
              View slots
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

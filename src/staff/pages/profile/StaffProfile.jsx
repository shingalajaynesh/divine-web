import React from 'react';
import { Card, Descriptions, Divider, Typography, Tag, List, Space } from 'antd';
import { UserOutlined, HomeOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function StaffProfile({ user }) {
  // Parse permissions from the user's role
  let permissionsList = [];
  try {
    const perms = typeof user?.role?.permissions === 'string'
      ? JSON.parse(user.role.permissions || '{}')
      : (user?.role?.permissions || {});
    
    Object.keys(perms).forEach(module => {
      const ops = perms[module];
      if (Array.isArray(ops) && ops.length > 0) {
        permissionsList.push({ module, ops });
      }
    });
  } catch (e) {
    // Fail silently
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: '#be123c' }} />
            <span>Staff Profile & Credentials</span>
          </Space>
        }
        style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Display Name">
            <Text strong>{user?.displayName || 'Staff Member'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Email Address">{user?.emailAddress || '-'}</Descriptions.Item>
          <Descriptions.Item label="Assigned Clinic Center">
            <Space>
              <HomeOutlined style={{ color: '#9ca3af' }} />
              <span>{user?.center?.name || 'Main Clinic Center'}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Security Role">
            <Tag color="rose" style={{ backgroundColor: '#fff1f2', border: '1px solid #fda4af', color: '#be123c', fontWeight: 600 }}>
              {user?.role?.name || user?.role?.roleType || 'STAFF'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Title level={4}>Your Active RBAC Permissions Matrix</Title>
        <Paragraph type="secondary">
          Below are the core business modules and operations you have been granted permission to access in this clinic workspace:
        </Paragraph>

        {user?.role?.roleType === 'SUPER_ADMIN' || user?.role?.roleType === 'ADMIN' ? (
          <Alert
            message="Administrator Full Access Entitlement"
            description="As an administrator, you have full view, creation, editing, and management permissions across all system modules."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : permissionsList.length === 0 ? (
          <Alert
            message="No explicit custom permissions configured."
            description="Please contact your center administrator if you require additional module access permissions."
            type="info"
            showIcon
          />
        ) : (
          <List
            bordered
            dataSource={permissionsList}
            renderItem={(item) => (
              <List.Item>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ textTransform: 'capitalize' }}>{item.module} Module</Text>
                  <div>
                    {item.ops.map(op => (
                      <Tag color="blue" key={op} style={{ textTransform: 'uppercase', fontSize: 10 }}>{op}</Tag>
                    ))}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}

// Custom simple inline Alert
function Alert({ message, description, type, showIcon, style }) {
  const color = type === 'success' ? '#52c41a' : '#1890ff';
  return (
    <div style={{ padding: '12px 16px', border: `1px solid ${color}`, borderRadius: '6px', backgroundColor: `${color}08`, ...style }}>
      <Text strong style={{ color }}>{message}</Text>
      <Paragraph style={{ margin: 0, fontSize: 13 }}>{description}</Paragraph>
    </div>
  );
}

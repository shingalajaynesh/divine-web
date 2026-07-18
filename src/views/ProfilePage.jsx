import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';
import { Form, Input, Button, Select, Space, Row, Col, Divider, Tag, Typography, Avatar } from 'antd';
import { SaveOutlined, UserOutlined, PhoneOutlined, GlobalOutlined, StarOutlined } from '@ant-design/icons';
import { ME_QUERY, UPDATE_USER_MUTATION, SAVE_ONBOARDING_MUTATION, SAVE_EMERGENCY_CONTACTS_MUTATION } from '../graphql/operations';
import {
  EnterpriseCard,
  EnterprisePageHeader,
  getRoleTheme
} from '../shared/components';
import { enterpriseTokens } from '../shared/theme/enterpriseTokens';

const { Title, Paragraph, Text } = Typography;

export default function ProfilePage({ user, lang = 'en' }) {
  const isHi = lang === 'hi';
  const theme = getRoleTheme('MOTHER');

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [mobileNo, setMobileNo] = useState(user?.mobileNo || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  
  // Emergency contacts parsed from JSON
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setMobileNo(user.mobileNo || '');
      setLanguage(user.language || 'en');

      if (user.emergencyContacts) {
        try {
          const parsed = JSON.parse(user.emergencyContacts);
          setContactName(parsed.name || '');
          setContactPhone(parsed.phone || '');
        } catch (e) {
          // Fallback
        }
      }
    }
  }, [user]);

  // Mutations
  const [updateUser, { loading: updatingUser }] = useMutation(UPDATE_USER_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }]
  });
  const [saveOnboarding, { loading: savingLanguage }] = useMutation(SAVE_ONBOARDING_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }]
  });
  const [saveEmergencyContacts, { loading: savingContacts }] = useMutation(SAVE_EMERGENCY_CONTACTS_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }]
  });

  const handleUpdateProfile = async () => {
    if (!displayName) {
      toast.error("Display name cannot be empty");
      return;
    }
    try {
      await updateUser({
        variables: {
          id: user.id,
          displayName,
          mobileNo: mobileNo || null
        }
      });
      toast.success(isHi ? "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!" : "Profile updated successfully!");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleUpdateLanguage = async (val) => {
    try {
      await saveOnboarding({
        variables: {
          lmpDate: user.lmpDate,
          dueDate: user.dueDate,
          language: val
        }
      });
      setLanguage(val);
      toast.success("Language preference updated");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSaveContacts = async () => {
    const contactsObj = { name: contactName, phone: contactPhone };
    try {
      await saveEmergencyContacts({
        variables: {
          contactsJson: JSON.stringify(contactsObj)
        }
      });
      toast.success("Emergency contacts saved successfully");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <EnterprisePageHeader
        activeRole="MOTHER"
        kicker="Account Management"
        title="Personal Profile & Settings"
        subtitle="Manage your personal preferences, language settings, and emergency contacts"
      />

      <Row gutter={[24, 24]}>
        {/* Left Column: Read-Only System Details & Theme info */}
        <Col xs={24} md={8}>
          <EnterpriseCard activeRole="MOTHER" title="System Settings" hoverable={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <Avatar size={64} style={{ backgroundColor: theme.primaryColor, marginBottom: '8px' }}>
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
                <Title level={5} style={{ margin: 0 }}>{displayName}</Title>
                <Tag color="rose" style={{ marginTop: '8px' }}>Mother Account</Tag>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>EMAIL ADDRESS</Text>
                <Text strong style={{ fontSize: '13px' }}>{user?.emailAddress || 'Not set'}</Text>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>MEMBERSHIP STATUS</Text>
                <Tag color="gold" style={{ marginTop: '4px', fontWeight: 'bold' }}>
                  {user?.subscriptionStatus?.toUpperCase() || 'FREE'}
                </Tag>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>CLINIC CENTER</Text>
                <Text strong style={{ fontSize: '13px' }}>{user?.center?.name || 'Divine Center'}</Text>
              </div>
            </Space>
          </EnterpriseCard>
        </Col>

        {/* Right Column: Editable Profile Fields */}
        <Col xs={24} md={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Personal Information */}
            <EnterpriseCard activeRole="MOTHER" title="Personal Details" hoverable={false}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong style={{ fontSize: '11px' }}>Display Name:</Text>
                  <Input 
                    prefix={<UserOutlined />} 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <Text strong style={{ fontSize: '11px' }}>Mobile Number:</Text>
                  <Input 
                    prefix={<PhoneOutlined />} 
                    value={mobileNo} 
                    onChange={(e) => setMobileNo(e.target.value)} 
                    placeholder="Enter your phone number"
                  />
                </div>

                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  loading={updatingUser}
                  onClick={handleUpdateProfile}
                >
                  Save Profile Details
                </Button>
              </Space>
            </EnterpriseCard>

            {/* Language & Preferences */}
            <EnterpriseCard activeRole="MOTHER" title="Language Settings" hoverable={false}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                    Preferred Communication Language:
                  </Text>
                  <Select 
                    value={language} 
                    onChange={handleUpdateLanguage} 
                    style={{ width: '100%' }}
                    options={[
                      { value: 'en', label: 'English (English)' },
                      { value: 'hi', label: 'हिन्दी (Hindi)' },
                      { value: 'gu', label: 'ગુજરાતી (Gujarati)' }
                    ]}
                  />
                </div>
              </Space>
            </EnterpriseCard>

            {/* Emergency Contact */}
            <EnterpriseCard activeRole="MOTHER" title="Emergency Contacts" hoverable={false}>
              <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                Provide contact details for family members or relatives in case of medical emergency.
              </Paragraph>

              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong style={{ fontSize: '11px' }}>Contact Name:</Text>
                  <Input 
                    value={contactName} 
                    onChange={(e) => setContactName(e.target.value)} 
                    placeholder="e.g. Spouse, Parent"
                  />
                </div>

                <div>
                  <Text strong style={{ fontSize: '11px' }}>Contact Phone:</Text>
                  <Input 
                    value={contactPhone} 
                    onChange={(e) => setContactPhone(e.target.value)} 
                    placeholder="e.g. +91 99999 88888"
                  />
                </div>

                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  loading={savingContacts}
                  onClick={handleSaveContacts}
                >
                  Save Emergency Contacts
                </Button>
              </Space>
            </EnterpriseCard>
          </Space>
        </Col>
      </Row>
    </div>
  );
}

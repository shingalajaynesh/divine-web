import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Button, Input, Tag, Spin, Space, Divider, Typography, Modal } from 'antd';
import { SecurityScanOutlined, LaptopOutlined, MobileOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const GET_MY_DEVICES = gql`
  query GetMyDevices {
    getMyDevices {
      id
      deviceId
      deviceName
      deviceType
      browser
      operatingSystem
      status
      isActive
      lastSeenAt
    }
  }
`;

const REGISTER_DEVICE = gql`
  mutation RegisterDevice(
    $deviceId: String
    $deviceName: String
    $deviceType: String
    $browser: String
    $operatingSystem: String
  ) {
    registerDevice(
      deviceId: $deviceId
      deviceName: $deviceName
      deviceType: $deviceType
      browser: $browser
      operatingSystem: $operatingSystem
    ) {
      id
      deviceId
      status
    }
  }
`;

const DEAUTHORIZE_DEVICE = gql`
  mutation DeauthorizeDevice($deviceId: String!) {
    deauthorizeDevice(deviceId: $deviceId)
  }
`;

export default function DeviceLockScreen({ refetchMe }) {
  const { data: devicesData, loading: loadingDevices, refetch: refetchDevices } = useQuery(GET_MY_DEVICES);
  const [registerDevice, { loading: registering }] = useMutation(REGISTER_DEVICE);
  const [deauthorizeDevice, { loading: deauthorizing }] = useMutation(DEAUTHORIZE_DEVICE);
  const [customName, setCustomName] = useState('');

  const currentDeviceId = localStorage.getItem('divine_device_id') || '';

  const getDeviceDetails = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { browser, operatingSystem: os, deviceType: 'web' };
  };

  const handleRegisterCurrent = async () => {
    const details = getDeviceDetails();
    try {
      const result = await registerDevice({
        variables: {
          deviceId: currentDeviceId,
          deviceName: customName || `${details.browser} on ${details.operatingSystem}`,
          deviceType: details.deviceType,
          browser: details.browser,
          operatingSystem: details.operatingSystem,
        },
      });

      const reg = result.data?.registerDevice;
      if (reg) {
        toast.success(`Device registered status: ${reg.status.toUpperCase()}`);
        if (reg.status === 'approved') {
          await refetchMe();
        } else {
          refetchDevices();
        }
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeauthorize = async (targetDeviceId) => {
    Modal.confirm({
      title: 'Remove Device Authorization',
      content: 'Are you sure you want to remove authorization for this device? You may need to log out of other locations.',
      okText: 'Deauthorize',
      okType: 'danger',
      cancelText: 'Keep Device',
      onOk: async () => {
        try {
          const success = await deauthorizeDevice({
            variables: { deviceId: targetDeviceId },
          });
          if (success) {
            toast.success('Device removed successfully!');
            refetchDevices();
            handleRegisterCurrent();
          }
        } catch (e) {
          toast.error(e.message);
        }
      }
    });
  };

  const devices = devicesData?.getMyDevices || [];
  const isRegistered = devices.some((d) => d.deviceId === currentDeviceId);
  const currentDeviceRecord = devices.find((d) => d.deviceId === currentDeviceId);

  return (
    <Card 
      style={{ maxWidth: 650, width: '100%', margin: '40px auto', borderRadius: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
      styles={{ body: { padding: '32px' } }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Avatar size={64} icon={<SecurityScanOutlined />} style={{ background: '#fee2e2', color: '#ef4444', marginBottom: '16px' }} />
        <Title level={3} style={{ margin: 0 }}>Security Check: Device Limit Reached</Title>
        <Paragraph type="secondary" style={{ fontSize: '13px', marginTop: '8px', lineHeight: 1.5 }}>
          To protect your premium account subscription and data logs, Divine Garbh Sanskar restricts active account access to a maximum of 2 devices.
        </Paragraph>
      </div>

      {loadingDevices ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin description="Validating registered devices..." />
        </div>
      ) : (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {/* Current Browser Card */}
          <Card style={{ borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }} styles={{ body: { padding: '20px' } }}>
            <Text type="secondary" strong style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Current Browser
            </Text>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong style={{ fontSize: '14px', display: 'block' }}>{getDeviceDetails().browser} on {getDeviceDetails().operatingSystem}</Text>
                <Text type="secondary" style={{ fontSize: '11px' }}>ID: {currentDeviceId.substring(0, 16)}...</Text>
              </div>

              {isRegistered ? (
                <Tag color={currentDeviceRecord?.status === 'approved' ? 'success' : 'warning'} style={{ fontWeight: 'bold' }}>
                  {currentDeviceRecord?.status?.toUpperCase()}
                </Tag>
              ) : (
                <Tag color="error" style={{ fontWeight: 'bold' }}>UNREGISTERED</Tag>
              )}
            </div>

            {!isRegistered && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', display: 'flex', gap: '8px' }}>
                <Input 
                  placeholder="Device nickname (e.g. Work Laptop)" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <Button 
                  type="primary" 
                  onClick={handleRegisterCurrent} 
                  loading={registering}
                  style={{ fontWeight: 'bold' }}
                >
                  Register Device
                </Button>
              </div>
            )}
          </Card>

          {/* Registered Devices List */}
          <div>
            <Text type="secondary" strong style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              Registered Devices ({devices.length}/2)
            </Text>

            {devices.length === 0 ? (
              <Paragraph type="secondary" style={{ fontStyle: 'italic', margin: 0 }}>No registered devices found.</Paragraph>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {devices.map((device) => (
                  <Card key={device.deviceId} style={{ width: '100%', borderRadius: 12, border: '1px solid #f1f5f9' }} styles={{ body: { padding: '16px' } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Avatar icon={device.deviceType === 'mobile' ? <MobileOutlined /> : <LaptopOutlined />} style={{ background: '#f1f5f9', color: '#64748b' }} />
                        <div>
                          <Space>
                            <Text strong style={{ fontSize: '13px' }}>{device.deviceName}</Text>
                            {device.deviceId === currentDeviceId && (
                              <Tag style={{ fontSize: '9px', fontWeight: 'bold' }}>This Device</Tag>
                            )}
                          </Space>
                          <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginTop: '2px' }}>
                            Last active: {new Date(device.lastSeenAt).toLocaleString()}
                          </Text>
                        </div>
                      </Space>

                      <Space>
                        <Tag color={device.status === 'approved' ? 'success' : 'warning'} style={{ fontWeight: 'bold' }}>
                          {device.status.toUpperCase()}
                        </Tag>
                        {device.deviceId !== currentDeviceId && (
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDeauthorize(device.deviceId)}
                            loading={deauthorizing}
                          />
                        )}
                      </Space>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <Button 
              type="link" 
              icon={<ReloadOutlined />} 
              onClick={() => refetchDevices()}
              style={{ fontWeight: 'bold' }}
            >
              Refresh Device Authorization Status
            </Button>
          </div>
        </Space>
      )}
    </Card>
  );
}

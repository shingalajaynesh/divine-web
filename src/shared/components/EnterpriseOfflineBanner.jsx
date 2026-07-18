import React, { useState, useEffect } from 'react';
import { Alert } from 'antd';
import { WifiOutlined } from '@ant-design/icons';

export default function EnterpriseOfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{ margin: '8px 0' }} role="status">
      <Alert
        message="You are currently offline"
        description="Showing saved wellness activities. Sensitive features like appointments, payments, and medical reports require an active internet connection."
        type="warning"
        showIcon
        icon={<WifiOutlined />}
      />
    </div>
  );
}

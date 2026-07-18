import React from 'react';
import { Spin, Button, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function EnterpriseAuthState({ loading, authenticated, onSignIn }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Verifying session credentials..." />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', padding: '24px' }}>
        <Result
          status="403"
          title="Session Expired"
          subTitle="Your authentication token is invalid or has expired. Please sign in to access your dashboard."
          extra={
            <Button type="primary" icon={<LockOutlined />} onClick={onSignIn || (() => signOut(auth))}>
              Sign In
            </Button>
          }
        />
      </div>
    );
  }

  return null;
}

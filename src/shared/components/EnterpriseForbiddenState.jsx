import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

export default function EnterpriseForbiddenState() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', padding: '24px' }}>
      <Result
        status="403"
        title="Access Denied"
        subTitle="You do not have the required permissions to view this section."
        extra={
          <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
            Back to Home
          </Button>
        }
      />
    </div>
  );
}

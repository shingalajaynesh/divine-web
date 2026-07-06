import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import toast from 'react-hot-toast';
import { Card, Form, InputNumber, Button, Table, Tag, Typography, Row, Col, Space } from 'antd';
import { AreaChartOutlined, FormOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const GET_MY_VITALS = gql`
  query GetMyVitals {
    getMyVitals {
      id
      weight
      systolicBp
      diastolicBp
      kickCount
      bloodSugar
      loggedAt
    }
  }
`;

const LOG_VITALS = gql`
  mutation LogVitals(
    $weight: Float
    $systolicBp: Int
    $diastolicBp: Int
    $kickCount: Int
    $bloodSugar: Float
  ) {
    logVitals(
      weight: $weight
      systolicBp: $systolicBp
      diastolicBp: $diastolicBp
      kickCount: $kickCount
      bloodSugar: $bloodSugar
    ) {
      id
      loggedAt
    }
  }
`;

export default function VitalsTracker({ t }) {
  const { data: vitalsData, loading: loadingVitals, refetch: refetchVitals } = useQuery(GET_MY_VITALS);
  const [logVitals, { loading: logging }] = useMutation(LOG_VITALS);
  const [form] = Form.useForm();

  const handleLogSubmit = async (values) => {
    const { weight, systolic, diastolic, kicks, sugar } = values;
    if (!weight && !systolic && !diastolic && !kicks && !sugar) {
      toast.error('Please enter at least one metric to log!');
      return;
    }

    try {
      await logVitals({
        variables: {
          weight: weight ? parseFloat(weight) : null,
          systolicBp: systolic ? parseInt(systolic, 10) : null,
          diastolicBp: diastolic ? parseInt(diastolic, 10) : null,
          kickCount: kicks ? parseInt(kicks, 10) : null,
          bloodSugar: sugar ? parseFloat(sugar) : null,
        },
      });

      toast.success('Pregnancy vitals logged successfully!');
      form.resetFields();
      refetchVitals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const logs = vitalsData?.getMyVitals || [];
  const latestLog = logs[0] || null;

  // Simple Clinical Insights
  const getBpStatus = (sys, dia) => {
    if (!sys || !dia) return null;
    if (sys < 120 && dia < 80) return { text: 'Normal', color: 'success' };
    if ((sys >= 120 && sys <= 129) && dia < 80) return { text: 'Elevated', color: 'warning' };
    return { text: 'High (Consult Doctor)', color: 'error' };
  };

  const getKickStatus = (count) => {
    if (count === null || count === undefined) return null;
    if (count >= 10) return { text: 'Healthy Baby Activity', color: 'success' };
    return { text: 'Monitor / Try Counting Later', color: 'warning' };
  };

  const getSugarStatus = (val) => {
    if (!val) return null;
    if (val < 140) return { text: 'Normal Fasting/Postprandial', color: 'success' };
    return { text: 'Elevated (Consult Doctor)', color: 'error' };
  };

  // Ant Design Table Columns Configuration
  const columns = [
    {
      title: 'Date',
      dataIndex: 'loggedAt',
      key: 'loggedAt',
      render: (text) => <Text strong>{new Date(text).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      render: (val) => val ? `${val} kg` : '-'
    },
    {
      title: 'Blood Pressure',
      key: 'bp',
      render: (_, record) => record.systolicBp && record.diastolicBp ? `${record.systolicBp}/${record.diastolicBp} mmHg` : '-'
    },
    {
      title: 'Kicks (2h)',
      dataIndex: 'kickCount',
      key: 'kickCount',
      render: (val) => val !== null && val !== undefined ? `${val} counts` : '-'
    },
    {
      title: 'Blood Sugar',
      dataIndex: 'bloodSugar',
      key: 'bloodSugar',
      render: (val) => val ? `${val} mg/dL` : '-'
    }
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* Vitals Summary Row */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} styles={{ body: { padding: '20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>⚖️</span>
              <Tag color="orange" style={{ fontWeight: 'bold' }}>Weight</Tag>
            </div>
            <Title level={3} style={{ margin: '16px 0 4px 0' }}>
              {latestLog?.weight ? `${latestLog.weight} kg` : 'N/A'}
            </Title>
            <Text type="secondary" style={{ fontSize: '11px' }}>Latest pregnancy weight</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} styles={{ body: { padding: '20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>🩸</span>
              <Tag color="orange" style={{ fontWeight: 'bold' }}>BP</Tag>
            </div>
            <Title level={3} style={{ margin: '16px 0 4px 0' }}>
              {latestLog?.systolicBp && latestLog?.diastolicBp ? `${latestLog.systolicBp}/${latestLog.diastolicBp}` : 'N/A'}
            </Title>
            {latestLog?.systolicBp && (
              <Tag color={getBpStatus(latestLog.systolicBp, latestLog.diastolicBp)?.color} style={{ fontWeight: 'bold', marginTop: '4px' }}>
                {getBpStatus(latestLog.systolicBp, latestLog.diastolicBp)?.text}
              </Tag>
            )}
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} styles={{ body: { padding: '20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>👣</span>
              <Tag color="orange" style={{ fontWeight: 'bold' }}>Kicks</Tag>
            </div>
            <Title level={3} style={{ margin: '16px 0 4px 0' }}>
              {latestLog && latestLog.kickCount !== null && latestLog.kickCount !== undefined ? `${latestLog.kickCount}` : 'N/A'}
            </Title>
            {latestLog && latestLog.kickCount !== null && latestLog.kickCount !== undefined && (
              <Tag color={getKickStatus(latestLog.kickCount)?.color} style={{ fontWeight: 'bold', marginTop: '4px' }}>
                {getKickStatus(latestLog.kickCount)?.text}
              </Tag>
            )}
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} styles={{ body: { padding: '20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>🍭</span>
              <Tag color="orange" style={{ fontWeight: 'bold' }}>Sugar</Tag>
            </div>
            <Title level={3} style={{ margin: '16px 0 4px 0' }}>
              {latestLog?.bloodSugar ? `${latestLog.bloodSugar}` : 'N/A'}
            </Title>
            {latestLog?.bloodSugar && (
              <Tag color={getSugarStatus(latestLog.bloodSugar)?.color} style={{ fontWeight: 'bold', marginTop: '4px' }}>
                {getSugarStatus(latestLog.bloodSugar)?.text}
              </Tag>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Logger Form */}
        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} styles={{ body: { padding: '24px' } }}>
            <Title level={4} style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FormOutlined /> Log Vitals
            </Title>
            <Form form={form} layout="vertical" onFinish={handleLogSubmit}>
              <Form.Item name="weight" label={<Text strong style={{ fontSize: '12px' }}>Maternal Weight (kg)</Text>}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="e.g. 64.5" size="large" />
              </Form.Item>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="systolic" label={<Text strong style={{ fontSize: '12px' }}>Systolic BP</Text>}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 115" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="diastolic" label={<Text strong style={{ fontSize: '12px' }}>Diastolic BP</Text>}>
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 75" size="large" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="kicks" label={<Text strong style={{ fontSize: '12px' }}>Baby Kick Count (2h)</Text>}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 12" size="large" />
              </Form.Item>

              <Form.Item name="sugar" label={<Text strong style={{ fontSize: '12px' }}>Blood Sugar (mg/dL)</Text>}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="e.g. 95.0" size="large" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  loading={logging}
                  style={{ height: '48px', fontWeight: 'bold' }}
                >
                  Save Today Vitals
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* History table */}
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} styles={{ body: { padding: '24px' } }}>
            <Title level={4} style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AreaChartOutlined /> Vitals Log History
            </Title>
            <Table 
              dataSource={logs} 
              columns={columns} 
              rowKey="id" 
              loading={loadingVitals} 
              pagination={{ pageSize: 6 }} 
              style={{ borderRadius: 16, overflow: 'hidden' }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

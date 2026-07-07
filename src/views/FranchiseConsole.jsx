import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { 
  Card, Table, Progress, Tag, Row, Col, Typography, Spin, 
  List, Space, Alert, Button, Statistic, Badge 
} from 'antd';
import { 
  LineChartOutlined, TeamOutlined, GlobalOutlined, AlertOutlined, 
  TrophyOutlined, ShopOutlined, ArrowUpOutlined, StarOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const GET_FRANCHISE_METRICS = gql`
  query GetFranchiseMetrics {
    getFranchiseMetrics {
      centersCount
      totalMothersCount
      averageStaffResponsePercent
      slaAlertsCount
      centerRankings {
        centerId
        centerName
        mothersCount
        activeSubscriptionsCount
        staffResponsePercent
        rank
      }
      centerGrowthStats {
        centerName
        months {
          monthLabel
          count
        }
      }
    }
  }
`;

export default function FranchiseConsole() {
  const { data, loading, refetch } = useQuery(GET_FRANCHISE_METRICS, {
    fetchPolicy: 'network-only'
  });

  const metrics = data?.getFranchiseMetrics;

  const rankingColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 70,
      render: (rank) => (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', backgroundColor: rank === 1 ? '#fef08a' : rank === 2 ? '#e2e8f0' : rank === 3 ? '#ffedd5' : '#f1f5f9', color: rank === 1 ? '#a16207' : rank === 2 ? '#475569' : rank === 3 ? '#c2410c' : '#64748b', fontWeight: 'bold' }}>
          {rank}
        </span>
      )
    },
    {
      title: 'Center Name',
      dataIndex: 'centerName',
      key: 'centerName',
      render: (text) => <Text strong style={{ fontSize: '13px' }}>🏢 {text}</Text>
    },
    {
      title: 'Registered Mothers',
      dataIndex: 'mothersCount',
      key: 'mothersCount',
      render: (cnt) => <Text>{cnt} active</Text>
    },
    {
      title: 'Subscribers Conversion',
      dataIndex: 'activeSubscriptionsCount',
      key: 'subs',
      render: (cnt, record) => {
        const percent = record.mothersCount > 0 ? Math.round((cnt / record.mothersCount) * 100) : 0;
        return (
          <Space>
            <Progress percent={percent} size="small" style={{ width: '110px' }} strokeColor="#db2777" />
            <Text type="secondary" style={{ fontSize: '11px' }}>({cnt} premium)</Text>
          </Space>
        );
      }
    },
    {
      title: 'Staff Task Compliance',
      dataIndex: 'staffResponsePercent',
      key: 'staff',
      render: (pct) => (
        <div style={{ width: '130px' }}>
          <Progress percent={pct} size="small" status={pct < 50 ? 'exception' : 'success'} />
        </div>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>📊 Franchise Control Panel</Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>
            Benckmark metrics across multiple centers, evaluate rankings, monitor staff operational health, and inspect SLA warnings.
          </Paragraph>
        </div>
        <Button onClick={() => refetch()} icon={<LineChartOutlined />}>Refresh Metrics</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" description="Benchmarking franchise centers..." />
        </div>
      ) : metrics ? (
        <div>
          {/* Main indicators row */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 16, background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#6d28d9' }}>Active Centers</Text>}
                  value={metrics.centersCount} 
                  prefix={<ShopOutlined style={{ color: '#7c3aed' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 16, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#15803d' }}>Global Mothers Network</Text>}
                  value={metrics.totalMothersCount} 
                  prefix={<GlobalOutlined style={{ color: '#16a34a' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 16, background: '#fffbeb', border: '1px solid #fde68a' }}>
                <Statistic 
                  title={<Text strong style={{ color: '#b45309' }}>Average Staff Compliance</Text>}
                  value={metrics.averageStaffResponsePercent} 
                  suffix="%"
                  prefix={<TrophyOutlined style={{ color: '#d97706' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 16, background: metrics.slaAlertsCount > 0 ? '#fff5f5' : '#f8fafc', border: `1px solid ${metrics.slaAlertsCount > 0 ? '#fecaca' : '#e2e8f0'}` }}>
                <Statistic 
                  title={<Text strong style={{ color: metrics.slaAlertsCount > 0 ? '#b91c1c' : '#475569' }}>Active SLA Warnings</Text>}
                  value={metrics.slaAlertsCount} 
                  prefix={<AlertOutlined style={{ color: metrics.slaAlertsCount > 0 ? '#dc2626' : '#64748b' }} />}
                />
              </Card>
            </Col>
          </Row>

          {metrics.slaAlertsCount > 0 && (
            <Alert 
              message="Critical: SLA Warnings Across Center Network"
              description={`There are currently ${metrics.slaAlertsCount} support ticket(s) violating response SLA windows across the franchise network. Check center managers to address escalations.`}
              type="error"
              showIcon
              style={{ borderRadius: 12, marginBottom: '24px' }}
            />
          )}

          {/* Benchmarking rankings */}
          <Card title="Center Benchmarking & Rankings" style={{ borderRadius: 16, marginBottom: '24px' }}>
            <Table 
              dataSource={metrics.centerRankings}
              columns={rankingColumns}
              rowKey="centerId"
              pagination={false}
            />
          </Card>

          {/* Center Growth Trends */}
          <Row gutter={[16, 16]}>
            {metrics.centerGrowthStats.map((center, idx) => (
              <Col xs={24} md={12} key={idx}>
                <Card title={`Growth Trend - ${center.centerName}`} style={{ borderRadius: 16 }}>
                  <List
                    dataSource={center.months}
                    renderItem={item => (
                      <List.Item style={{ padding: '12px 0' }}>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <Text strong>{item.monthLabel}</Text>
                            <Text>{item.count} conversions</Text>
                          </div>
                          <Progress percent={Math.min(100, item.count * 15)} strokeColor="#be123c" showInfo={false} />
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <Alert type="warning" message="No franchise metrics found." showIcon />
      )}
    </Card>
  );
}

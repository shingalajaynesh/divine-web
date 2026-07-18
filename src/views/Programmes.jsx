import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Collapse, Progress, Tag, Typography, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LockOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { ENROLL_IN_PROGRAM_MUTATION, MY_PROGRAM_ENROLLMENTS_QUERY, PROGRAM_CATALOG_QUERY, UPDATE_ACTIVITY_PROGRESS_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';
import {
  EnterpriseCard,
  EnterprisePageHeader,
  EnterpriseLoading,
  EnterpriseEmptyState,
  EnterpriseErrorState,
  getRoleTheme
} from '../shared/components';
import { enterpriseTokens } from '../shared/theme/enterpriseTokens';

const { Title, Paragraph, Text } = Typography;

export default function Programmes() {
  const theme = getRoleTheme('MOTHER');
  const { data, loading, error } = useQuery(PROGRAM_CATALOG_QUERY);
  const { data: enrollmentData, refetch } = useQuery(MY_PROGRAM_ENROLLMENTS_QUERY);
  const [enroll, { loading: enrolling, error: enrollError }] = useMutation(ENROLL_IN_PROGRAM_MUTATION, { onCompleted: () => refetch() });
  const [updateProgress] = useMutation(UPDATE_ACTIVITY_PROGRESS_MUTATION, { onCompleted: () => refetch() });
  
  const enrollments = React.useMemo(() => new Map((enrollmentData?.myProgramEnrollments || []).map((item) => [item.program.id, item])), [enrollmentData]);

  const handleToggleActivity = React.useCallback(async (activityId, isCompleted) => {
    try {
      await updateProgress({
        variables: {
          activityId,
          input: {
            status: isCompleted ? 'pending' : 'completed',
            durationSeconds: 300
          }
        }
      });
      toast.success(isCompleted ? 'Activity status updated.' : 'Activity completed! Great progress.');
    } catch (e) {
      toast.error(e.message);
    }
  }, [updateProgress]);

  if (loading) return <EnterpriseLoading type="card" count={2} />;
  if (error) return <EnterpriseErrorState error={error} activeRole="MOTHER" />;
  if (!data?.programCatalog?.length) {
    return (
      <div>
        <EnterprisePageHeader
          activeRole="MOTHER"
          kicker="DIVINE LEARNING"
          title="Programmes Catalog"
          subtitle="Prepare structured maternal coaching sessions"
        />
        <EnterpriseEmptyState title="Programmes are being prepared" description="Check back soon for active course guides." />
      </div>
    );
  }

  return (
    <div>
      <EnterprisePageHeader
        activeRole="MOTHER"
        kicker="DIVINE LEARNING"
        title="Programmes for your journey"
        subtitle="Original, structured practices that help you move from learning to a calm daily routine."
      />

      {data.programCatalog.map((program) => {
        const enrollment = enrollments.get(program.id);
        const activities = program.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.activities));
        const completed = new Set((enrollment?.activityProgress || []).filter((item) => item.status === 'completed').map((item) => item.activityId));
        const progress = activities.length ? Math.round((completed.size / activities.length) * 100) : 0;
        return (
          <EnterpriseCard key={program.id} activeRole="MOTHER" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <Tag color={program.isPremium ? 'gold' : 'green'}>{program.isPremium ? 'Premium' : 'Included'}</Tag>
                <Title level={3} style={{ margin: '8px 0 4px 0', color: theme.textPrimary }}>{program.name}</Title>
                <Paragraph type="secondary" style={{ margin: 0, fontSize: '13px' }}>{program.summary}</Paragraph>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Progress type="circle" size={60} percent={progress} strokeColor={theme.primaryColor} />
                <Text style={{ fontSize: '12px', color: theme.textSecondary }}>{activities.length} activities</Text>
              </div>
            </div>

            {!enrollment ? (
              <Button 
                type="primary" 
                loading={enrolling} 
                disabled={program.isPremium} 
                icon={program.isPremium ? <LockOutlined /> : <PlayCircleOutlined />} 
                onClick={() => enroll({ variables: { programId: program.id } })}
                style={{ borderRadius: '8px' }}
              >
                {program.isPremium ? 'Requires programme access' : 'Start programme'}
              </Button>
            ) : (
              <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: '4px 12px', borderRadius: '8px' }}>
                Enrolled · {enrollment.status}
              </Tag>
            )}
            
            {enrollError && <Text type="danger" style={{ display: 'block', marginTop: '8px' }}>{enrollError.message}</Text>}

            <Divider style={{ margin: '20px 0 10px 0' }} />

            <Collapse 
              ghost 
              items={program.modules.map((module) => ({
                key: module.id,
                label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: '12px' }}>
                    <Text strong style={{ color: theme.textPrimary }}>{module.title}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{module.lessons.length} lessons</Text>
                  </div>
                ),
                children: (
                  <div>
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} style={{ borderBottom: `1px solid ${theme.borderColor}`, padding: '12px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <Title level={5} style={{ margin: 0, color: theme.textPrimary }}>{lesson.title}</Title>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{lesson.summary}</Text>
                          </div>
                          <span style={{ fontSize: '11px', color: theme.textSecondary, whiteSpace: 'nowrap' }}>
                            <ClockCircleOutlined /> {lesson.durationMins || 0} min
                          </span>
                        </div>
                        
                        {enrollment && lesson.activities && lesson.activities.length > 0 && (
                          <div style={{ marginTop: '10px', background: '#fffcfc', padding: '10px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: `1px solid ${theme.borderColor}` }}>
                            {lesson.activities.map((act) => {
                              const isDone = completed.has(act.id);
                              return (
                                <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.borderColor}` }}>
                                  <div style={{ flex: 1, marginRight: '16px' }}>
                                    <Text strong style={{ fontSize: '12px', color: isDone ? '#94a3b8' : theme.textPrimary, textDecoration: isDone ? 'line-through' : 'none' }}>
                                      {act.title}
                                    </Text>
                                    <span style={{ display: 'block', fontSize: '10px', color: theme.textSecondary }}>
                                      {act.instructions} · {act.estimatedMins} min ({act.quotient} Quotient)
                                    </span>
                                  </div>
                                  <Button 
                                    type={isDone ? 'default' : 'primary'}
                                    size="small"
                                    icon={isDone ? <CheckCircleOutlined style={{ color: '#287a55' }} /> : <PlayCircleOutlined />}
                                    onClick={() => handleToggleActivity(act.id, isDone)}
                                    style={{ 
                                      borderColor: isDone ? '#d1fae5' : undefined, 
                                      backgroundColor: isDone ? '#ecfdf5' : undefined 
                                    }}
                                  >
                                    {isDone ? 'Completed' : 'Complete'}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              }))} 
            />
          </EnterpriseCard>
        );
      })}
    </div>
  );
}

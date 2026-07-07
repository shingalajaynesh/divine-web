import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Card, Collapse, Empty, Progress, Skeleton, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LockOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { ENROLL_IN_PROGRAM_MUTATION, MY_PROGRAM_ENROLLMENTS_QUERY, PROGRAM_CATALOG_QUERY, UPDATE_ACTIVITY_PROGRESS_MUTATION } from '../graphql/operations';
import toast from 'react-hot-toast';

const { Title, Paragraph, Text } = Typography;

export default function Programmes() {
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

  if (loading) return <Card><Skeleton active /></Card>;
  if (error) return <Empty description="Programme catalogue could not be loaded." />;
  if (!data?.programCatalog?.length) return <Empty description="Programmes are being prepared." />;

  return <div className="programme-catalogue">
    <div className="catalogue-intro"><Tag>DIVINE LEARNING</Tag><Title>Programmes for your journey</Title><Paragraph>Original, structured practices that help you move from learning to a calm daily routine.</Paragraph></div>
    {data.programCatalog.map((program) => {
      const enrollment = enrollments.get(program.id);
      const activities = program.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.activities));
      const completed = new Set((enrollment?.activityProgress || []).filter((item) => item.status === 'completed').map((item) => item.activityId));
      const progress = activities.length ? Math.round((completed.size / activities.length) * 100) : 0;
      return <Card key={program.id} className="catalogue-program-card">
        <div className="catalogue-program-head"><div><Tag color={program.isPremium ? 'gold' : 'green'}>{program.isPremium ? 'Premium' : 'Included'}</Tag><Title level={2}>{program.name}</Title><Paragraph>{program.summary}</Paragraph></div><div className="catalogue-progress"><Progress type="circle" size={74} percent={progress} /><Text>{activities.length} activities</Text></div></div>
        {!enrollment ? <Button type="primary" loading={enrolling} disabled={program.isPremium} icon={program.isPremium ? <LockOutlined /> : <PlayCircleOutlined />} onClick={() => enroll({ variables: { programId: program.id } })}>{program.isPremium ? 'Requires programme access' : 'Start programme'}</Button> : <Tag icon={<CheckCircleOutlined />} color="success">Enrolled · {enrollment.status}</Tag>}
        {enrollError ? <Text type="danger" className="catalogue-error">{enrollError.message}</Text> : null}
        <Collapse ghost className="catalogue-modules" items={program.modules.map((module) => ({ key: module.id, label: <span><strong>{module.title}</strong><small>{module.lessons.length} lessons</small></span>, children: <div className="catalogue-lessons">{module.lessons.map((lesson) => (
          <div key={lesson.id} className="catalogue-lesson-wrapper" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
            <div className="catalogue-lesson" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>{lesson.title}</Title>
                <Text type="secondary" style={{ fontSize: '13px' }}>{lesson.summary}</Text>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}><ClockCircleOutlined /> {lesson.durationMins || 0} min</span>
            </div>
            
            {enrollment && lesson.activities && lesson.activities.length > 0 && (
              <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lesson.activities.map((act) => {
                  const isDone = completed.has(act.id);
                  return (
                    <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <Text strong style={{ fontSize: '13px', color: isDone ? '#94a3b8' : '#1e293b', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {act.title}
                        </Text>
                        <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                          {act.instructions} · {act.estimatedMins} min ({act.quotient} Quotient)
                        </span>
                      </div>
                      <Button 
                        type={isDone ? 'default' : 'primary'}
                        size="small"
                        icon={isDone ? <CheckCircleOutlined style={{ color: '#16a34a' }} /> : <PlayCircleOutlined />}
                        onClick={() => handleToggleActivity(act.id, isDone)}
                        style={{ 
                          borderColor: isDone ? '#bbf7d0' : undefined, 
                          backgroundColor: isDone ? '#f0fdf4' : undefined 
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
        ))}</div> }))} />
      </Card>;
    })}
  </div>;
}

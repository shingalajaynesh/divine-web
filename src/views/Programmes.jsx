import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Card, Collapse, Empty, Progress, Skeleton, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LockOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { ENROLL_IN_PROGRAM_MUTATION, MY_PROGRAM_ENROLLMENTS_QUERY, PROGRAM_CATALOG_QUERY } from '../graphql/operations';

const { Title, Paragraph, Text } = Typography;

export default function Programmes() {
  const { data, loading, error } = useQuery(PROGRAM_CATALOG_QUERY);
  const { data: enrollmentData, refetch } = useQuery(MY_PROGRAM_ENROLLMENTS_QUERY);
  const [enroll, { loading: enrolling, error: enrollError }] = useMutation(ENROLL_IN_PROGRAM_MUTATION, { onCompleted: () => refetch() });
  const enrollments = new Map((enrollmentData?.myProgramEnrollments || []).map((item) => [item.program.id, item]));

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
        <Collapse ghost className="catalogue-modules" items={program.modules.map((module) => ({ key: module.id, label: <span><strong>{module.title}</strong><small>{module.lessons.length} lessons</small></span>, children: <div className="catalogue-lessons">{module.lessons.map((lesson) => <div key={lesson.id} className="catalogue-lesson"><div><Title level={5}>{lesson.title}</Title><Text>{lesson.summary}</Text></div><span><ClockCircleOutlined /> {lesson.durationMins || 0} min</span></div>)}</div> }))} />
      </Card>;
    })}
  </div>;
}

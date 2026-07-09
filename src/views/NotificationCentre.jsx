import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Badge, Button, Card, Checkbox, Col, Empty, Input, List, Row, Select, Skeleton, Switch, Tag, Typography, Space } from 'antd';
import { BellOutlined, CheckOutlined, ClockCircleOutlined, DeleteOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons';
import {
  DELETE_REMINDER_SCHEDULE_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  NOTIFICATION_CENTRE_QUERY,
  SAVE_REMINDER_SCHEDULE_MUTATION,
  SET_NOTIFICATION_STATUS_MUTATION,
  UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
  DISPATCH_DAILY_REMINDERS_MUTATION
} from '../graphql/operations';
import toast from 'react-hot-toast';

const { Title, Paragraph, Text } = Typography;
const allDays = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 }
];

export default function NotificationCentre() {
  const { data, loading, error, refetch } = useQuery(NOTIFICATION_CENTRE_QUERY, { fetchPolicy: 'cache-and-network' });
  const [setStatus] = useMutation(SET_NOTIFICATION_STATUS_MUTATION);
  const [markAll] = useMutation(MARK_ALL_NOTIFICATIONS_READ_MUTATION);
  const [updatePreferences] = useMutation(UPDATE_NOTIFICATION_PREFERENCES_MUTATION);
  const [saveReminder] = useMutation(SAVE_REMINDER_SCHEDULE_MUTATION);
  const [deleteReminder] = useMutation(DELETE_REMINDER_SCHEDULE_MUTATION);
  const [dispatchReminders] = useMutation(DISPATCH_DAILY_REMINDERS_MUTATION);
  const [prefs, setPrefs] = useState(null);
  const [reminder, setReminder] = useState({ label: '', localTime: '08:00', daysOfWeek: [1, 2, 3, 4, 5, 6, 0], channel: 'push', enabled: true });
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');

  useEffect(() => {
    if (data?.myNotificationPreferences) {
      setPrefs({ ...data.myNotificationPreferences, __typename: undefined, id: undefined });
    }
  }, [data]);

  if (loading && !data) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px' }}>
        <Card style={{ borderRadius: 24, border: '1px solid var(--line)' }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px' }}>
        <Card style={{ borderRadius: 24, border: '1px solid var(--line)', padding: 48, textAlign: 'center' }}>
          <Empty description="Notification centre could not be loaded." />
        </Card>
      </div>
    );
  }

  const inbox = data?.myNotifications;
  const tabs = [
    { key: 'inbox', label: 'Inbox', icon: <BellOutlined />, badge: inbox?.unreadCount || 0 },
    { key: 'preferences', label: 'Preferences', icon: <SettingOutlined />, badge: 0 },
    { key: 'reminders', label: 'Reminders', icon: <ClockCircleOutlined />, badge: data?.myReminderSchedules?.length || 0 }
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px' }}>
      {/* ─── Premium Hero Banner ─── */}
      <div style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(190, 18, 60, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%), linear-gradient(135deg, #fefce8 0%, #fff7ed 30%, #fff1f2 70%, #fdf2f8 100%)',
        borderRadius: 28,
        padding: 'clamp(24px, 5vw, 44px)',
        marginBottom: 28,
        border: '1px solid rgba(234, 223, 216, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(190, 18, 60, 0.04)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(190, 18, 60, 0.08)', borderRadius: 20, padding: '6px 16px', marginBottom: 14 }}>
            <BellOutlined style={{ fontSize: 13, color: 'var(--brand-maroon)' }} />
            <Text strong style={{ color: 'var(--brand-maroon)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Stay Connected</Text>
          </div>

          <Title level={2} style={{ margin: '0 0 8px 0', color: 'var(--brand-maroon-dark)', fontWeight: 900, fontSize: 'clamp(22px, 4vw, 30px)' }}>
            Notifications & Reminders
          </Title>
          <Paragraph style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Stay informed with programme updates, daily wellness reminders, and personalized alerts for your journey.
          </Paragraph>
        </div>
      </div>

      {/* ─── Notice Banner ─── */}
      {notice && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fef2f2', borderRadius: 12, color: '#be123c', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{notice}</span>
          <Button type="text" size="small" onClick={() => setNotice('')} style={{ color: '#be123c', fontWeight: 700 }}>✕</Button>
        </div>
      )}

      {/* ─── Tab Navigation ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 20px',
              borderRadius: 14,
              border: activeTab === t.key ? '2px solid var(--brand-maroon)' : '1px solid var(--line)',
              background: activeTab === t.key ? 'var(--soft-maroon)' : '#fff',
              color: activeTab === t.key ? 'var(--brand-maroon)' : 'var(--muted)',
              fontWeight: activeTab === t.key ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
            {t.badge > 0 && (
              <Badge
                count={t.badge}
                style={{
                  backgroundColor: activeTab === t.key ? 'var(--brand-maroon)' : 'var(--muted)',
                  fontSize: 10,
                  height: 18,
                  minWidth: 18,
                  lineHeight: '18px'
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ─── INBOX TAB ─── */}
      {activeTab === 'inbox' && (
        <div>
          {/* Inbox Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
            padding: '16px 20px',
            background: '#fff',
            borderRadius: 18,
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--soft-maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BellOutlined style={{ fontSize: 18, color: 'var(--brand-maroon)' }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 14, display: 'block', color: 'var(--brand-maroon-dark)' }}>Your notifications</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {inbox?.unreadCount ? `${inbox.unreadCount} unread` : 'All caught up'} · Programme updates & reminders
                </Text>
              </div>
            </div>
            <Space size={8}>
              <Button
                style={{ borderRadius: 10, fontWeight: 600, fontSize: 12 }}
                onClick={async () => {
                  try {
                    const res = await dispatchReminders();
                    toast.success(`Sent ${res.data.dispatchDailyReminders.remindersSent} reminders!`);
                    refetch();
                  } catch (e) {
                    toast.error(e.message);
                  }
                }}
              >
                Run Daily Reminders
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                disabled={!inbox?.unreadCount}
                onClick={async () => { await markAll(); await refetch(); }}
                style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 10, fontWeight: 600, fontSize: 12 }}
              >
                Mark all read
              </Button>
            </Space>
          </div>

          {/* Notification List */}
          {inbox?.items?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {inbox.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '16px 20px',
                    borderRadius: 18,
                    border: item.status === 'unread' ? '2px solid rgba(190, 18, 60, 0.15)' : '1px solid var(--line)',
                    background: item.status === 'unread' ? 'linear-gradient(135deg, #fffbf8 0%, #fff5f5 100%)' : '#fff',
                    transition: 'all 0.2s ease',
                    boxShadow: item.status === 'unread' ? '0 4px 16px rgba(190, 18, 60, 0.06)' : 'var(--shadow-sm)'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: item.status === 'unread'
                      ? 'linear-gradient(135deg, var(--soft-maroon) 0%, #fce7f3 100%)'
                      : 'var(--canvas)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <BellOutlined style={{
                      fontSize: 18,
                      color: item.status === 'unread' ? 'var(--brand-maroon)' : 'var(--muted)'
                    }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 14, color: item.status === 'unread' ? 'var(--brand-maroon-dark)' : 'var(--ink)' }}>
                        {item.title}
                      </Text>
                      {item.status === 'unread' && (
                        <Tag style={{
                          background: 'linear-gradient(135deg, var(--brand-saffron) 0%, #fbbf24 100%)',
                          color: '#78350f',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          New
                        </Tag>
                      )}
                    </div>
                    <Paragraph style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                      {item.body}
                    </Paragraph>
                    <Text style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7 }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignSelf: 'center' }}>
                    {item.status === 'unread' && (
                      <Button
                        size="small"
                        onClick={async () => { await setStatus({ variables: { id: item.id, status: 'read' } }); refetch(); }}
                        style={{ borderRadius: 8, fontSize: 11, fontWeight: 600 }}
                      >
                        Read
                      </Button>
                    )}
                    <Button
                      size="small"
                      type="text"
                      onClick={async () => { await setStatus({ variables: { id: item.id, status: 'archived' } }); refetch(); }}
                      style={{ borderRadius: 8, fontSize: 11, color: 'var(--muted)' }}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card style={{ borderRadius: 24, border: '1px solid var(--line)', padding: 48, textAlign: 'center' }}>
              <Empty description="You're all caught up. No new notifications." />
            </Card>
          )}
        </div>
      )}

      {/* ─── PREFERENCES TAB ─── */}
      {activeTab === 'preferences' && prefs && (
        <Card
          className="quick-action-card-premium"
          style={{ borderRadius: 24, border: '1px solid var(--line)', background: '#fff' }}
          styles={{ body: { padding: 28 } }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--soft-maroon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingOutlined style={{ fontSize: 22, color: 'var(--brand-maroon)' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: 'var(--brand-maroon-dark)', fontSize: 18 }}>Delivery Preferences</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Transactional service messages remain separate from optional marketing consent.</Text>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[
              ['pushEnabled', 'Push notifications', '📱 Receive alerts on your device'],
              ['emailEnabled', 'Email updates', '📧 Get summaries in your inbox'],
              ['whatsappEnabled', 'WhatsApp reminders', '💬 Gentle nudges via WhatsApp'],
              ['marketingAllowed', 'Optional marketing', '📢 News, offers & wellness tips']
            ].map(([key, label, desc]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  borderRadius: 14,
                  border: '1px solid var(--line)',
                  background: prefs[key] ? 'linear-gradient(135deg, #fffbf2 0%, #fff5f5 100%)' : '#fff',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <Text strong style={{ fontSize: 14, display: 'block' }}>{label}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{desc}</Text>
                </div>
                <Switch
                  checked={Boolean(prefs[key])}
                  onChange={(value) => setPrefs({ ...prefs, [key]: value })}
                  style={{ backgroundColor: prefs[key] ? 'var(--brand-maroon)' : undefined }}
                />
              </div>
            ))}
          </div>

          {/* Quiet Hours */}
          <div style={{
            padding: '18px 20px',
            borderRadius: 16,
            background: 'var(--canvas)',
            border: '1px solid var(--line)',
            marginBottom: 24
          }}>
            <Title level={5} style={{ margin: '0 0 14px 0', fontSize: 14, color: 'var(--brand-maroon-dark)' }}>🌙 Quiet Hours & Timezone</Title>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={8}>
                <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Quiet starts</Text>
                <Input
                  value={prefs.quietStart || ''}
                  placeholder="22:00"
                  onChange={(e) => setPrefs({ ...prefs, quietStart: e.target.value || null })}
                  style={{ borderRadius: 10 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Quiet ends</Text>
                <Input
                  value={prefs.quietEnd || ''}
                  placeholder="07:00"
                  onChange={(e) => setPrefs({ ...prefs, quietEnd: e.target.value || null })}
                  style={{ borderRadius: 10 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Timezone</Text>
                <Input
                  value={prefs.timezone}
                  onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                  style={{ borderRadius: 10 }}
                />
              </Col>
            </Row>
          </div>

          <Button
            type="primary"
            size="large"
            onClick={async () => { await updatePreferences({ variables: { input: prefs } }); setNotice('Preferences saved.'); refetch(); }}
            style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 12, fontWeight: 700, paddingInline: 32 }}
          >
            Save Preferences
          </Button>
        </Card>
      )}

      {/* ─── REMINDERS TAB ─── */}
      {activeTab === 'reminders' && (
        <Row gutter={[24, 24]}>
          {/* Create Reminder Form */}
          <Col xs={24} md={10}>
            <Card
              className="quick-action-card-premium"
              style={{ borderRadius: 24, border: '1px solid var(--line)', background: '#fff' }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusOutlined style={{ fontSize: 20, color: 'var(--brand-maroon)' }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, color: 'var(--brand-maroon-dark)' }}>Create Reminder</Title>
                  <Text type="secondary" style={{ fontSize: 11 }}>Set up daily wellness nudges</Text>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Reminder label</Text>
                  <Input
                    value={reminder.label}
                    placeholder="Morning practice"
                    onChange={(e) => setReminder({ ...reminder, label: e.target.value })}
                    style={{ borderRadius: 10 }}
                  />
                </div>

                <div>
                  <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Time</Text>
                  <Input
                    value={reminder.localTime}
                    placeholder="08:00"
                    onChange={(e) => setReminder({ ...reminder, localTime: e.target.value })}
                    style={{ borderRadius: 10 }}
                  />
                </div>

                <div>
                  <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Channel</Text>
                  <Select
                    value={reminder.channel}
                    options={[
                      { value: 'push', label: '📱 Push' },
                      { value: 'email', label: '📧 Email' },
                      { value: 'whatsapp', label: '💬 WhatsApp' },
                      { value: 'in_app', label: '🔔 In app' }
                    ]}
                    onChange={(channel) => setReminder({ ...reminder, channel })}
                    style={{ width: '100%', borderRadius: 10 }}
                  />
                </div>

                <div>
                  <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Days of week</Text>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {allDays.map(day => (
                      <button
                        key={day.value}
                        onClick={() => {
                          const days = reminder.daysOfWeek.includes(day.value)
                            ? reminder.daysOfWeek.filter(d => d !== day.value)
                            : [...reminder.daysOfWeek, day.value];
                          setReminder({ ...reminder, daysOfWeek: days });
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          border: reminder.daysOfWeek.includes(day.value) ? '2px solid var(--brand-maroon)' : '1px solid var(--line)',
                          background: reminder.daysOfWeek.includes(day.value) ? 'var(--soft-maroon)' : '#fff',
                          color: reminder.daysOfWeek.includes(day.value) ? 'var(--brand-maroon)' : 'var(--muted)',
                          fontWeight: reminder.daysOfWeek.includes(day.value) ? 800 : 500,
                          fontSize: 11,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit'
                        }}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={async () => {
                    await saveReminder({ variables: { input: reminder } });
                    setReminder({ ...reminder, label: '' });
                    setNotice('Reminder saved.');
                    refetch();
                  }}
                  style={{ background: 'var(--brand-maroon)', borderColor: 'var(--brand-maroon)', borderRadius: 12, fontWeight: 700, height: 42, marginTop: 4 }}
                >
                  Add Reminder
                </Button>
              </div>
            </Card>
          </Col>

          {/* Existing Reminders */}
          <Col xs={24} md={14}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data?.myReminderSchedules?.length ? (
                data.myReminderSchedules.map((item) => (
                  <Card
                    key={item.id}
                    className="quick-action-card-premium"
                    style={{ borderRadius: 20, border: '1px solid var(--line)', background: '#fff' }}
                    styles={{ body: { padding: 20 } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'linear-gradient(135deg, var(--soft-saffron) 0%, #fff5df 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <ClockCircleOutlined style={{ fontSize: 20, color: '#b45309' }} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Title level={5} style={{ margin: 0, fontSize: 15, color: 'var(--brand-maroon-dark)' }}>{item.label}</Title>
                            <Tag style={{
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              background: item.channel === 'push' ? 'var(--soft-maroon)' : item.channel === 'email' ? '#f0f9ff' : item.channel === 'whatsapp' ? '#f0fdf4' : 'var(--canvas)',
                              color: item.channel === 'push' ? 'var(--brand-maroon)' : item.channel === 'email' ? '#0369a1' : item.channel === 'whatsapp' ? '#15803d' : 'var(--muted)',
                              border: 'none'
                            }}>
                              {item.channel}
                            </Tag>
                          </div>
                          <Text style={{ fontSize: 13, color: 'var(--muted)' }}>
                            🕐 {item.localTime} · {item.daysOfWeek.map((day) => allDays.find((d) => d.value === day)?.label).join(', ')}
                          </Text>
                        </div>
                      </div>
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={async () => { await deleteReminder({ variables: { id: item.id } }); refetch(); }}
                        style={{ borderRadius: 8, fontWeight: 600 }}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card style={{ borderRadius: 24, border: '1px solid var(--line)', padding: 48, textAlign: 'center' }}>
                  <Empty description="No reminders created yet. Add one to start." />
                </Card>
              )}
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
}

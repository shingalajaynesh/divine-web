import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Table, Card, Input, Select, Button, Space, Modal, Form, 
  Descriptions, Alert, Spin, Tag, Typography, DatePicker, Popconfirm 
} from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { 
  GET_STAFF_TASKS_QUERY, 
  CREATE_STAFF_TASK_MUTATION, 
  UPDATE_STAFF_TASK_STATUS_MUTATION, 
  DELETE_STAFF_TASK_MUTATION 
} from '../../../graphql/operations';

const { Title, Text, Paragraph } = Typography;

// Helper to query mothers when creating a task
const GET_MOTHERS_MINIMAL = gql`
  query GetMothersMinimal($role: String) {
    adminGetUsers(role: $role, pageSize: 100) {
      items {
        id
        displayName
      }
    }
  }
`;

const GET_ROLES = gql`
  query GetRolesForTasks {
    getRoles {
      id
      roleType
    }
  }
`;

export default function StaffTaskList({ user, lang }) {
  const isHi = lang === 'hi';
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(null);
  const [taskMotherId, setTaskMotherId] = useState(null);

  // 1. Fetch Mother Role for assignment selection
  const { data: roleData } = useQuery(GET_ROLES);
  const motherRole = roleData?.getRoles?.find(r => r.roleType === 'MOTHER');
  const motherRoleId = motherRole?.id;

  const { data: motherListData } = useQuery(GET_MOTHERS_MINIMAL, {
    variables: { role: motherRoleId || undefined },
    skip: !motherRoleId
  });

  // 2. Fetch Tasks list
  const { data, loading, error, refetch } = useQuery(GET_STAFF_TASKS_QUERY, {
    fetchPolicy: 'network-only'
  });

  // 3. Mutations
  const [createTask, { loading: creating }] = useMutation(CREATE_STAFF_TASK_MUTATION, {
    onCompleted: () => {
      refetch();
      setIsModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate(null);
      setTaskMotherId(null);
      toast.success('Task created successfully.');
    },
    onError: (err) => toast.error(err.message)
  });

  const [updateStatus, { loading: updating }] = useMutation(UPDATE_STAFF_TASK_STATUS_MUTATION, {
    onCompleted: () => {
      refetch();
      toast.success('Task status updated.');
    },
    onError: (err) => toast.error(err.message)
  });

  const [deleteTask] = useMutation(DELETE_STAFF_TASK_MUTATION, {
    onCompleted: () => {
      refetch();
      toast.success('Task deleted successfully.');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('Please enter a task title.');
      return;
    }
    await createTask({
      variables: {
        userId: taskMotherId,
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        dueDate: taskDueDate ? taskDueDate.toISOString() : null
      }
    });
  };

  const handleStatusChange = async (record, newStatus) => {
    const current = record.status;
    const allowed = {
      PENDING: ['IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'],
      IN_PROGRESS: ['BLOCKED', 'COMPLETED', 'CANCELLED'],
      BLOCKED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: []
    };

    if (current !== newStatus && !allowed[current]?.includes(newStatus)) {
      toast.error(`Invalid task status transition from ${current} to ${newStatus}`);
      return;
    }

    await updateStatus({
      variables: { id: record.id, status: newStatus }
    });
  };

  const handleDelete = async (id) => {
    await deleteTask({ variables: { id } });
  };

  const tasks = data?.getStaffTasks || [];
  const filteredTasks = tasks.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = !search.trim() || t.title.toLowerCase().includes(search.toLowerCase()) || (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      title: 'Task Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => {
        // Strip status metadata prefix if present in view
        const clean = (text || '').replace(/\[STATUS:(PENDING|IN_PROGRESS|BLOCKED|CANCELLED)\]/, '').trim();
        return clean || '-';
      }
    },
    {
      title: 'Client Mother',
      dataIndex: ['user', 'displayName'],
      key: 'mother',
      render: (val) => val ? <Tag color="pink">{val}</Tag> : '-'
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = {
          PENDING: 'orange',
          IN_PROGRESS: 'blue',
          BLOCKED: 'red',
          COMPLETED: 'green',
          CANCELLED: 'default'
        }[status] || 'orange';
        return <Tag color={color}>{status || 'PENDING'}</Tag>;
      }
    },
    {
      title: 'Update Status',
      key: 'updateStatus',
      render: (_, record) => {
        const allowed = {
          PENDING: ['IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'],
          IN_PROGRESS: ['BLOCKED', 'COMPLETED', 'CANCELLED'],
          BLOCKED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          COMPLETED: [],
          CANCELLED: []
        }[record.status] || [];

        return (
          <Select
            value={record.status}
            onChange={(val) => handleStatusChange(record, val)}
            disabled={updating || allowed.length === 0}
            style={{ width: 140 }}
            size="small"
          >
            <Select.Option value="PENDING" disabled>PENDING</Select.Option>
            <Select.Option value="IN_PROGRESS" disabled={!allowed.includes('IN_PROGRESS')}>IN_PROGRESS</Select.Option>
            <Select.Option value="BLOCKED" disabled={!allowed.includes('BLOCKED')}>BLOCKED</Select.Option>
            <Select.Option value="COMPLETED" disabled={!allowed.includes('COMPLETED')}>COMPLETED</Select.Option>
            <Select.Option value="CANCELLED" disabled={!allowed.includes('CANCELLED')}>CANCELLED</Select.Option>
          </Select>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Delete task?"
          description="Are you sure you want to delete this task?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes, delete"
          cancelText="No"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Task Management Checklist"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Reload</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Create Task</Button>
          </Space>
        }
        style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        {error && (
          <Alert
            message="Unable to load data. Please retry."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search tasks..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />

          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: '150px' }}
          >
            <Select.Option value="all">All Statuses</Select.Option>
            <Select.Option value="PENDING">PENDING</Select.Option>
            <Select.Option value="IN_PROGRESS">IN_PROGRESS</Select.Option>
            <Select.Option value="BLOCKED">BLOCKED</Select.Option>
            <Select.Option value="COMPLETED">COMPLETED</Select.Option>
            <Select.Option value="CANCELLED">CANCELLED</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Task Modal */}
      <Modal
        title="Create New Task"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateTask}
        confirmLoading={creating}
        okText="Create Task"
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Task Title" required>
            <Input 
              value={taskTitle} 
              onChange={(e) => setTaskTitle(e.target.value)} 
              placeholder="e.g. Call mother Sneha for week 12 report"
            />
          </Form.Item>
          <Form.Item label="Description/Notes">
            <Input.TextArea 
              rows={3} 
              value={taskDesc} 
              onChange={(e) => setTaskDesc(e.target.value)} 
              placeholder="Enter details..."
            />
          </Form.Item>
          <Form.Item label="Link Client Mother">
            <Select
              placeholder="Select mother user (optional)"
              value={taskMotherId}
              onChange={(val) => setTaskMotherId(val)}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={(motherListData?.adminGetUsers?.items || []).map(m => ({
                value: m.id,
                label: m.displayName || m.id
              }))}
            />
          </Form.Item>
          <Form.Item label="Due Date">
            <DatePicker 
              style={{ width: '100%' }} 
              value={taskDueDate} 
              onChange={(date) => setTaskDueDate(date)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

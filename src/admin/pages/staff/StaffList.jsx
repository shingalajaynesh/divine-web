import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Table, Card, Input, Select, Button, Space, Modal, Form, 
  Tag, Alert, Descriptions, Tooltip, Typography 
} from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, CopyOutlined, SendOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { StatusTag } from '../../components/StatusTag';
import { formatDate } from '../../components/Formatters';

const GET_STAFF_INVITATIONS = gql`
  query AdminGetStaffInvitations(
    $page: Int
    $pageSize: Int
    $search: String
    $status: String
    $centerId: ID
  ) {
    adminGetStaffInvitations(
      page: $page
      pageSize: $pageSize
      search: $search
      status: $status
      centerId: $centerId
    ) {
      items {
        id
        emailAddress
        roleId
        centerId
        token
        status
        expiresAt
        createdBy
        createdAt
        role {
          id
          name
          roleType
        }
        center {
          id
          name
        }
        creator {
          id
          displayName
        }
      }
      total
    }
  }
`;

const GET_ROLES_AND_CENTERS = gql`
  query GetRolesAndCenters {
    getRoles {
      id
      name
      roleType
    }
    getCenters {
      id
      name
    }
  }
`;

const CREATE_STAFF = gql`
  mutation CreateStaff($emailAddress: String!, $displayName: String!, $roleId: ID!, $centerId: ID!) {
    createStaff(emailAddress: $emailAddress, displayName: $displayName, roleId: $roleId, centerId: $centerId) {
      id
      emailAddress
      token
      status
    }
  }
`;

const RESEND_INVITATION = gql`
  mutation ResendStaffInvitation($invitationId: ID!) {
    resendStaffInvitation(invitationId: $invitationId) {
      id
      token
      status
    }
  }
`;

export default function StaffList({ user }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(undefined);
  const [selectedCenter, setSelectedCenter] = useState(user?.role?.roleType === 'ADMIN' ? user.centerId : undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  
  const [form] = Form.useForm();
  const { data: filterData } = useQuery(GET_ROLES_AND_CENTERS);
  
  const { data, loading, refetch } = useQuery(GET_STAFF_INVITATIONS, {
    variables: {
      page,
      pageSize,
      search: search || undefined,
      status: status || undefined,
      centerId: selectedCenter,
    },
    fetchPolicy: 'network-only',
  });

  const [createStaff, { loading: creatingStaff }] = useMutation(CREATE_STAFF, {
    onCompleted: (res) => {
      const link = `http://localhost:3000/register?token=${res.createStaff.token}`;
      setGeneratedLink(link);
      toast.success('Staff invitation created successfully');
      refetch();
      form.resetFields();
    },
    onError: (err) => toast.error(err.message),
  });

  const [resendInvitation, { loading: resending }] = useMutation(RESEND_INVITATION, {
    onCompleted: (res) => {
      const link = `http://localhost:3000/register?token=${res.resendStaffInvitation.token}`;
      setGeneratedLink(link);
      toast.success('Staff invitation resent successfully');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Activation link copied to clipboard!');
  };

  const columns = [
    {
      title: 'Email Address',
      dataIndex: 'emailAddress',
      key: 'emailAddress',
    },
    {
      title: 'Role',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Center',
      dataIndex: ['center', 'name'],
      key: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Expires At',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (val) => formatDate(val),
    },
    {
      title: 'Creator',
      dataIndex: ['creator', 'displayName'],
      key: 'creator',
      render: (text) => text || 'System',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isPending = ['INVITED', 'PENDING_ACTIVATION', 'INVITATION_EXPIRED'].includes(record.status);
        return (
          <Space>
            {isPending && (
              <Button 
                type="link" 
                size="small"
                icon={<SendOutlined />}
                loading={resending}
                onClick={() => resendInvitation({ variables: { invitationId: record.id } })}
              >
                Resend Invite
              </Button>
            )}
            <Tooltip title="Copy Token Link">
              <Button 
                shape="circle" 
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(`http://localhost:3000/register?token=${record.token}`)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Staff Invitations & Scope Control</span>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Reload</Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => {
                setGeneratedLink('');
                setModalVisible(true);
              }}
            >
              Invite Staff Member
            </Button>
          </Space>
        </div>
      }
      style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <Space wrap style={{ marginBottom: 16 }} size="middle">
        <Input
          placeholder="Search email..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="Status"
          value={status}
          onChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          style={{ width: 180 }}
          allowClear
        >
          <Select.Option value="INVITED">Invited</Select.Option>
          <Select.Option value="PENDING_ACTIVATION">Pending Activation</Select.Option>
          <Select.Option value="ACTIVE">Active</Select.Option>
          <Select.Option value="INVITATION_EXPIRED">Expired</Select.Option>
        </Select>
        {user?.role?.roleType === 'SUPER_ADMIN' && (
          <Select
            placeholder="Center"
            value={selectedCenter}
            onChange={(val) => {
              setSelectedCenter(val);
              setPage(1);
            }}
            style={{ width: 180 }}
            allowClear
          >
            {filterData?.getCenters?.map((c) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
        )}
      </Space>

      {generatedLink && (
        <Alert
          message="Staff Invitation Created Successfully!"
          description={
            <div style={{ marginTop: 8 }}>
              <p>Since the email service is currently deferred, please copy the registration URL below and send it to the staff member:</p>
              <Typography.Paragraph copyable style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: '4px' }}>
                {generatedLink}
              </Typography.Paragraph>
            </div>
          }
          type="info"
          showIcon
          closable
          style={{ marginBottom: 20 }}
          onClose={() => setGeneratedLink('')}
        />
      )}

      <Table
        dataSource={data?.adminGetStaffInvitations?.items || []}
        columns={columns}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: data?.adminGetStaffInvitations?.total || 0,
          showSizeChanger: true,
        }}
        loading={loading}
        onChange={(pagination) => {
          setPage(pagination.current);
          setPageSize(pagination.pageSize);
        }}
      />

      <Modal
        title="Invite New Staff Member"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            createStaff({
              variables: {
                emailAddress: values.emailAddress,
                displayName: values.displayName,
                roleId: values.roleId,
                centerId: user?.role?.roleType === 'ADMIN' ? user.centerId : values.centerId,
              }
            });
          }}
        >
          <Form.Item
            name="emailAddress"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="name@domain.com" />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="Display Name"
            rules={[{ required: true, message: 'Please enter staff name' }]}
          >
            <Input placeholder="Jane Doe" />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="Role Assign"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select placeholder="Select role">
              {filterData?.getRoles
                ?.filter(r => r.roleType !== 'SUPER_ADMIN' && (r.roleType !== 'ADMIN' || user?.role?.roleType === 'SUPER_ADMIN'))
                .map((r) => (
                  <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                ))}
            </Select>
          </Form.Item>

          {user?.role?.roleType === 'SUPER_ADMIN' && (
            <Form.Item
              name="centerId"
              label="Center Assign"
              rules={[{ required: true, message: 'Please select center' }]}
            >
              <Select placeholder="Select center">
                {filterData?.getCenters?.map((c) => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={creatingStaff}>
                Send invitation link
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

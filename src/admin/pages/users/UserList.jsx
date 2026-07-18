import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Card, Input, Select, Button, Space, Drawer, Form, 
  Switch, Descriptions, Alert, Spin, Tag 
} from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { StatusTag } from '../../components/StatusTag';
import { EnterpriseResponsiveTable, EnterpriseTableToolbar } from '../../../shared/components';
import { useViewport } from '../../../shared/hooks/useViewport';


const GET_USERS_PAGINATED = gql`
  query AdminGetUsers(
    $page: Int
    $pageSize: Int
    $search: String
    $status: String
    $role: String
    $centerId: ID
    $sortField: String
    $sortDirection: String
  ) {
    adminGetUsers(
      page: $page
      pageSize: $pageSize
      search: $search
      status: $status
      role: $role
      centerId: $centerId
      sortField: $sortField
      sortDirection: $sortDirection
    ) {
      items {
        id
        emailAddress
        displayName
        firstName
        lastName
        isActive
        role {
          id
          name
          roleType
        }
        center {
          id
          name
        }
      }
      total
    }
  }
`;

const GET_ADMIN_FILTERS = gql`
  query GetAdminFilters {
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

const UPDATE_USER_STATUS = gql`
  mutation UpdateUserStatus($id: ID!, $isActive: Boolean!) {
    updateUserStatus(id: $id, isActive: $isActive) {
      id
      isActive
    }
  }
`;

const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($id: ID!, $roleId: ID!) {
    updateUserRole(id: $id, roleId: $roleId) {
      id
      role {
        id
        name
        roleType
      }
    }
  }
`;

const UPDATE_USER_CENTER = gql`
  mutation UpdateUserCenter($id: ID!, $centerId: ID!) {
    updateUserCenter(id: $id, centerId: $centerId) {
      id
      center {
        id
        name
      }
    }
  }
`;

export default function UserList({ user }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(undefined);
  const [selectedRole, setSelectedRole] = useState(undefined);
  const [selectedCenter, setSelectedCenter] = useState(user?.role?.roleType === 'ADMIN' ? user.centerId : undefined);
  const [sortField, setSortField] = useState('displayName');
  const [sortDirection, setSortDirection] = useState('ASC');

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Queries
  const { data, loading, refetch } = useQuery(GET_USERS_PAGINATED, {
    variables: {
      page,
      pageSize,
      search: search.trim() || undefined,
      status,
      role: selectedRole,
      centerId: selectedCenter,
      sortField,
      sortDirection
    },
    fetchPolicy: 'network-only',
  });

  const { data: filterData, loading: filterLoading } = useQuery(GET_ADMIN_FILTERS);

  // Mutations
  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_USER_STATUS, {
    onCompleted: () => {
      toast.success('User status updated successfully');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [updateRole, { loading: updatingRole }] = useMutation(UPDATE_USER_ROLE, {
    onCompleted: () => {
      toast.success('User role updated successfully');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [updateCenter, { loading: updatingCenter }] = useMutation(UPDATE_USER_CENTER, {
    onCompleted: () => {
      toast.success('User center updated successfully');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    if (sorter.field) {
      setSortField(sorter.field);
      setSortDirection(sorter.order === 'ascend' ? 'ASC' : 'DESC');
    }
  };

  const { isMobile } = useViewport();

  const getRowActions = (record) => [
    {
      key: 'manage',
      label: 'Manage',
      icon: <EditOutlined />,
      onClick: () => {
        setSelectedUser(record);
        setDrawerVisible(true);
      }
    }
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'displayName',
      key: 'displayName',
      sorter: true,
      render: (text, record) => `${record.firstName || ''} ${record.lastName || ''}`.trim() || record.displayName || 'N/A',
      mobileRole: 'primary',
      responsivePriority: 1
    },
    {
      title: 'Email',
      dataIndex: 'emailAddress',
      key: 'emailAddress',
      sorter: true,
      mobileRole: 'secondary',
      responsivePriority: 2
    },
    {
      title: 'Role',
      dataIndex: ['role', 'name'],
      key: 'role',
      render: (text) => <Tag color="blue">{text || 'Mother'}</Tag>,
      responsivePriority: 2,
      reuseRenderInDetails: true
    },
    {
      title: 'Center',
      dataIndex: ['center', 'name'],
      key: 'center',
      render: (text) => text || 'Global',
      responsivePriority: 3,
      reuseRenderInDetails: true
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      sorter: true,
      render: (isActive) => <StatusTag status={isActive ? 'ACTIVE' : 'INACTIVE'} />,
      mobileRole: 'status',
      responsivePriority: 1,
      reuseRenderInDetails: true
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EditOutlined />} 
          onClick={() => {
            setSelectedUser(record);
            setDrawerVisible(true);
          }}
        >
          Manage
        </Button>
      ),
      responsivePriority: 1
    },
  ];

  return (
    <Card style={{ borderRadius: '8px' }}>
      <EnterpriseTableToolbar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search users..."
        filterCount={[status, selectedRole, selectedCenter].filter(Boolean).length}
        filters={
          <>
            <Select
              placeholder="Filter status"
              allowClear
              value={status}
              onChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
              style={{ width: isMobile ? '100%' : 140 }}
            >
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>

            <Select
              placeholder="Filter Role"
              allowClear
              value={selectedRole}
              onChange={(val) => {
                setSelectedRole(val);
                setPage(1);
              }}
              loading={filterLoading}
              style={{ width: isMobile ? '100%' : 160 }}
            >
              {filterData?.getRoles?.map((r) => (
                <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
              ))}
            </Select>

            {user?.role?.roleType === 'SUPER_ADMIN' && (
              <Select
                placeholder="Filter Center"
                allowClear
                value={selectedCenter}
                onChange={(val) => {
                  setSelectedCenter(val);
                  setPage(1);
                }}
                loading={filterLoading}
                style={{ width: isMobile ? '100%' : 180 }}
              >
                {filterData?.getCenters?.map((c) => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            )}
          </>
        }
        onReload={() => refetch()}
        loading={loading}
      />

      <EnterpriseResponsiveTable
        dataSource={data?.adminGetUsers?.items || []}
        columns={columns}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.adminGetUsers?.total || 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          }
        }}
        loading={loading}
        onRetry={() => refetch()}
        getRowActions={getRowActions}
        onChange={handleTableChange}
      />

      <Drawer
        title="Manage User Account"
        width={400}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedUser(null);
        }}
        open={drawerVisible}
        destroyOnClose
      >
        {selectedUser && (
          <div>
            <Descriptions title="Account Details" column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Display Name">{selectedUser.displayName}</Descriptions.Item>
              <Descriptions.Item label="Email Address">{selectedUser.emailAddress}</Descriptions.Item>
            </Descriptions>

            <Form layout="vertical">
              <Form.Item label="Account Status">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Switch
                    checked={selectedUser.isActive}
                    loading={updatingStatus}
                    onChange={(checked) => {
                      updateStatus({ variables: { id: selectedUser.id, isActive: checked } });
                      setSelectedUser({ ...selectedUser, isActive: checked });
                    }}
                  />
                  <span>{selectedUser.isActive ? 'Active Access' : 'Suspended Access'}</span>
                </div>
              </Form.Item>

              <Form.Item label="Role Assignment">
                <Select
                  value={selectedUser.role?.id}
                  loading={updatingRole}
                  onChange={(val) => {
                    updateRole({ variables: { id: selectedUser.id, roleId: val } });
                    setSelectedUser({ ...selectedUser, role: { ...selectedUser.role, id: val } });
                  }}
                >
                  {filterData?.getRoles
                    ?.filter(r => r.roleType !== 'SUPER_ADMIN' || user?.role?.roleType === 'SUPER_ADMIN')
                    .map((r) => (
                      <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                    ))}
                </Select>
              </Form.Item>

              {user?.role?.roleType === 'SUPER_ADMIN' && (
                <Form.Item label="Center Assignment">
                  <Select
                    value={selectedUser.center?.id || undefined}
                    loading={updatingCenter}
                    onChange={(val) => {
                      updateCenter({ variables: { id: selectedUser.id, centerId: val } });
                      setSelectedUser({ ...selectedUser, center: { ...selectedUser.center, id: val } });
                    }}
                  >
                    {filterData?.getCenters?.map((c) => (
                      <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </Drawer>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Card, Select, Checkbox, Row, Col, Button, Space, Typography, Spin, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';

const GET_ROLES = gql`
  query GetRoles {
    getRoles {
      id
      name
      roleType
      permissions
    }
  }
`;

const UPDATE_ROLE_PERMISSIONS = gql`
  mutation UpdateRolePermissions($roleId: ID!, $permissions: String!) {
    updateRolePermissions(roleId: $roleId, permissions: $permissions) {
      id
      permissions
    }
  }
`;

// List of modular modules and operations
const MODULES = [
  { key: 'users', label: 'User & Subscriber Management' },
  { key: 'staff', label: 'Staff & Team Invitations' },
  { key: 'payments', label: 'Payments, Refunds & Reconcile' },
  { key: 'store', label: 'Store Boutique & Inventory' },
  { key: 'content', label: 'Content Studio CMS' },
  { key: 'support', label: 'Help & Customer Support' }
];

const OPERATIONS = [
  { key: 'read', label: 'Read (View lists & details)' },
  { key: 'write', label: 'Write (Create, edit, adjust)' },
  { key: 'delete', label: 'Delete (Remove records)' },
  { key: 'reconcile', label: 'Reconcile (Manual settlement)' }
];

export default function RolePermissionsMatrix() {
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [matrix, setMatrix] = useState({}); // { [moduleKey]: { [operationKey]: boolean } }

  const { data, loading, refetch } = useQuery(GET_ROLES, {
    onCompleted: (res) => {
      if (res.getRoles?.length && !selectedRoleId) {
        setSelectedRoleId(res.getRoles[0].id);
      }
    }
  });

  const [updatePermissions, { loading: saving }] = useMutation(UPDATE_ROLE_PERMISSIONS, {
    onCompleted: () => {
      toast.success('Access matrix policy updated successfully');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedRole = data?.getRoles?.find(r => r.id === selectedRoleId);

  useEffect(() => {
    if (selectedRole) {
      let parsed = {};
      try {
        parsed = JSON.parse(selectedRole.permissions || '{}');
      } catch (e) {
        parsed = {};
      }
      
      const newMatrix = {};
      MODULES.forEach(m => {
        newMatrix[m.key] = {};
        OPERATIONS.forEach(o => {
          // If role permissions is array: e.g. { users: ["read", "write"] }
          const perms = parsed[m.key] || [];
          newMatrix[m.key][o.key] = Array.isArray(perms) ? perms.includes(o.key) : !!perms[o.key];
        });
      });
      setMatrix(newMatrix);
    }
  }, [selectedRole]);

  const handleCheckboxChange = (moduleKey, operationKey, checked) => {
    setMatrix(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [operationKey]: checked
      }
    }));
  };

  const handleSave = () => {
    if (!selectedRoleId) return;
    
    // Construct JSON payload
    const payload = {};
    MODULES.forEach(m => {
      const activeOps = [];
      OPERATIONS.forEach(o => {
        if (matrix[m.key]?.[o.key]) {
          activeOps.push(o.key);
        }
      });
      if (activeOps.length > 0) {
        payload[m.key] = activeOps;
      }
    });

    updatePermissions({
      variables: {
        roleId: selectedRoleId,
        permissions: JSON.stringify(payload)
      }
    });
  };

  if (loading && !data) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spin size="large" /></div>;
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Role Policies Matrix</span>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Reload</Button>
        </div>
      }
      style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <Typography.Paragraph type="secondary">
        Select a role below to inspect and configure visual access matrices. Check operations allowed for each core business module.
      </Typography.Paragraph>

      <div style={{ marginBottom: 24, maxWidth: 300 }}>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Select Role Template</Typography.Text>
        <Select
          style={{ width: '100%' }}
          value={selectedRoleId}
          onChange={(val) => setSelectedRoleId(val)}
        >
          {data?.getRoles?.map((r) => (
            <Select.Option key={r.id} value={r.id}>{r.name} ({r.roleType})</Select.Option>
          ))}
        </Select>
      </div>

      <Divider />

      {selectedRole && (
        <div>
          <Typography.Title level={5} style={{ marginBottom: 20 }}>
            Configure Capabilities: <span style={{ color: '#be123c' }}>{selectedRole.name}</span>
          </Typography.Title>

          <div style={{ background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
            {MODULES.map((m) => (
              <div 
                key={m.key} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px 24px', 
                  borderBottom: '1px solid #f0f0f0',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '1 1 250px', fontWeight: 600 }}>
                  {m.label}
                </div>
                <div style={{ flex: '2 1 400px' }}>
                  <Row gutter={[16, 8]}>
                    {OPERATIONS.map((o) => (
                      <Col key={o.key} xs={12} sm={6}>
                        <Checkbox
                          checked={matrix[m.key]?.[o.key] || false}
                          onChange={(e) => handleCheckboxChange(m.key, o.key, e.target.checked)}
                          disabled={selectedRole.roleType === 'SUPER_ADMIN'} // Super Admin has all permissions implicitly
                        >
                          {o.key.toUpperCase()}
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={selectedRole.roleType === 'SUPER_ADMIN'}
              style={{ background: '#be123c', borderColor: '#be123c', borderRadius: '6px' }}
            >
              Save Capabilities Matrix
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

import React, { useState } from 'react';
import { Input, Button, Drawer, Badge, Space } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useViewport } from '../hooks/useViewport';

/**
 * EnterpriseTableToolbar manages inputs, dropdown selections, filter active count badges,
 * and collapses filters inside a drawer for compact mobile screens (< 768px).
 */
export default function EnterpriseTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = null,
  filterCount = 0,
  extra = null,
  onReload = null,
  loading = false,
  ...props
}) {
  const { isMobile } = useViewport();
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Render mobile toolbar layout
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', width: '100%' }}>
        {/* Search bar & filter trigger on one line */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
          {onSearchChange && (
            <Input
              placeholder={searchPlaceholder}
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ flex: 1, minHeight: '40px' }}
              allowClear
            />
          )}

          {filters && (
            <Badge count={filterCount} color="#be123c" offset={[-2, 2]}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setDrawerVisible(true)}
                aria-label="Open filters drawer"
                aria-haspopup="dialog"
                style={{ minHeight: '40px', minWidth: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Filters
              </Button>
            </Badge>
          )}

          {onReload && (
            <Button
              icon={<ReloadOutlined />}
              onClick={onReload}
              loading={loading}
              aria-label="Reload data"
              style={{ minHeight: '40px', minWidth: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          )}
        </div>

        {/* Extra buttons line (e.g. Create, Export) */}
        {extra && (
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {extra}
          </div>
        )}

        {/* Mobile Slide-in Drawer containing filters */}
        {filters && (
          <Drawer
            title="Filter Records"
            placement="bottom"
            height="auto"
            open={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            destroyOnClose
            styles={{ body: { padding: '24px 16px' } }}
            footer={
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
                <Button type="primary" onClick={() => setDrawerVisible(false)} style={{ minHeight: '40px', minWidth: '100%' }}>
                  Apply Filters
                </Button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filters}
            </div>
          </Drawer>
        )}
      </div>
    );
  }

  // Render desktop/tablet inline toolbar layout
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', width: '100%' }}>
      <Space wrap size="middle" style={{ flex: 1 }}>
        {onSearchChange && (
          <Input
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '220px', minHeight: '40px' }}
            allowClear
          />
        )}
        {filters}
      </Space>

      <Space size="middle">
        {onReload && (
          <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>
            Reload
          </Button>
        )}
        {extra}
      </Space>
    </div>
  );
}

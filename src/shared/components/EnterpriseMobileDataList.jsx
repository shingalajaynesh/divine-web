import React, { useState } from 'react';
import { Checkbox, Dropdown, Button, Modal, Pagination, Spin, Alert, Empty } from 'antd';
import { MoreOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { renderColumnValue } from '../utils/tableHelpers';

/**
 * Mobile-specific list rendering component.
 */
export default function EnterpriseMobileDataList({
  columns = [],
  dataSource = [],
  rowKey = 'id',
  loading = false,
  error = null,
  onRetry = null,
  pagination = {},
  rowSelection = null,
  getRowActions = null,
  // Expansion props:
  expandedRowKeys,
  onExpandedRowsChange,
  onExpand,
  expandedRowRender,
  ...props
}) {
  const [localExpandedKeys, setLocalExpandedKeys] = useState([]);

  // 1. Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <Spin size="large" tip="Loading records..." />
      </div>
    );
  }

  // 2. Error state
  if (error) {
    return (
      <Alert
        message="Failed to load records"
        description={
          <div>
            <p>{error.message || 'An error occurred while fetching data.'}</p>
            {onRetry && (
              <Button type="primary" size="small" onClick={onRetry} style={{ marginTop: 8 }}>
                Retry
              </Button>
            )}
          </div>
        }
        type="error"
        showIcon
        style={{ margin: '16px 0' }}
      />
    );
  }

  // 3. Empty state
  if (!dataSource || dataSource.length === 0) {
    return (
      <div style={{ padding: '30px 0' }}>
        <Empty description="No records found" />
      </div>
    );
  }

  // 4. Mapped mobile metadata roles
  const primaryCol = columns.find(c => c.mobileRole === 'primary') || columns[0];
  const secondaryCol = columns.find(c => c.mobileRole === 'secondary') || columns[1];
  const statusCol = columns.find(c => c.mobileRole === 'status');
  const hiddenCols = columns.filter(c => c.mobileRole === 'hidden' || (!c.mobileRole && c.responsivePriority > 1));

  // Determine active expansion keys
  const activeExpandedKeys = expandedRowKeys || localExpandedKeys;

  const isExpanded = (key) => activeExpandedKeys.includes(key);

  const toggleExpand = (key, record) => {
    const expanded = !isExpanded(key);
    if (onExpand) {
      onExpand(expanded, record);
    }
    const nextKeys = expanded
      ? [...activeExpandedKeys, key]
      : activeExpandedKeys.filter(k => k !== key);
    
    if (onExpandedRowsChange) {
      onExpandedRowsChange(nextKeys);
    }
    if (!expandedRowKeys) {
      setLocalExpandedKeys(nextKeys);
    }
  };

  // Helper to handle actions execution with optional confirm confirmation popup
  const handleActionClick = (action, record) => {
    const execute = async () => {
      try {
        await action.onClick(record);
      } catch (err) {
        console.error('Mobile action execution failed:', err);
      }
    };

    if (action.confirm) {
      const confirmConfig = typeof action.confirm === 'string'
        ? { title: 'Confirm Action', content: action.confirm }
        : action.confirm;

      Modal.confirm({
        title: confirmConfig.title || 'Confirm Action',
        content: confirmConfig.content || 'Are you sure you want to proceed?',
        okText: confirmConfig.okText || 'Confirm',
        cancelText: confirmConfig.cancelText || 'Cancel',
        okType: action.danger ? 'danger' : 'primary',
        onOk: execute
      });
    } else {
      execute();
    }
  };

  return (
    <div className="enterprise-mobile-list">
      {dataSource.map((record, index) => {
        const key = record[rowKey] || String(index);
        const hasActions = getRowActions && getRowActions(record);
        const actionsMenu = hasActions ? {
          items: getRowActions(record)
            .filter(act => !act.hidden)
            .map(act => ({
              key: act.key || act.label,
              label: act.label,
              disabled: act.disabled,
              danger: act.danger,
              icon: act.icon,
              onClick: () => handleActionClick(act, record)
            }))
        } : null;

        const isChecked = rowSelection && rowSelection.selectedRowKeys?.includes(key);

        return (
          <div key={key} className="enterprise-mobile-card">
            {/* Header row (Primary, status, actions overflow) */}
            <div className="enterprise-mobile-card-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '75%' }}>
                {rowSelection && (
                  <span className="touch-target-checkbox">
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const nextKeys = checked
                          ? [...(rowSelection.selectedRowKeys || []), key]
                          : (rowSelection.selectedRowKeys || []).filter(k => k !== key);
                        const selectedRows = checked
                          ? [...(dataSource.filter(r => rowSelection.selectedRowKeys?.includes(r[rowKey]))), record]
                          : dataSource.filter(r => nextKeys.includes(r[rowKey]));
                        if (rowSelection.onChange) {
                          rowSelection.onChange(nextKeys, selectedRows);
                        }
                      }}
                      aria-label={`Select row ${index + 1}`}
                    />
                  </span>
                )}
                <div className="enterprise-mobile-card-primary">
                  {primaryCol ? renderColumnValue(record, primaryCol, 'mobile') : '-'}
                </div>
              </div>

              {/* Status and Action dropdown stack */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {statusCol && (
                  <div>
                    {renderColumnValue(record, statusCol, 'mobile')}
                  </div>
                )}
                {hasActions && actionsMenu.items.length > 0 && (
                  <Dropdown menu={actionsMenu} trigger={['click']} placement="bottomRight">
                    <Button 
                      icon={<MoreOutlined />} 
                      type="text" 
                      className="mobile-row-actions-trigger" 
                      aria-label="Actions menu"
                    />
                  </Dropdown>
                )}
              </div>
            </div>

            {/* Secondary row */}
            {secondaryCol && (
              <div className="enterprise-mobile-card-secondary" style={{ paddingLeft: rowSelection ? '44px' : '0' }}>
                {renderColumnValue(record, secondaryCol, 'mobile')}
              </div>
            )}

            {/* Expansion detail links */}
            {(hiddenCols.length > 0 || expandedRowRender) && (
              <div style={{ paddingLeft: rowSelection ? '44px' : '0', marginTop: '4px' }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => toggleExpand(key, record)}
                  icon={isExpanded(key) ? <UpOutlined /> : <DownOutlined />}
                  aria-expanded={isExpanded(key)}
                  aria-label={`Toggle details for ${primaryCol ? renderColumnValue(record, primaryCol, 'mobile') : 'this row'}`}
                  style={{ padding: 0, height: 'auto', fontSize: '13px' }}
                >
                  {isExpanded(key) ? 'Hide details' : 'Show details'}
                </Button>

                {/* Details card content (Semantic dl/dt/dd) */}
                {isExpanded(key) && (
                  <div style={{ marginTop: '12px' }}>
                    {hiddenCols.length > 0 && (
                      <dl className="mobile-details-list">
                        {hiddenCols.map(col => {
                          const label = col.mobileLabel || col.title;
                          const renderedLabel = typeof label === 'function' ? label() : label;
                          return (
                            <React.Fragment key={String(col.key || col.dataIndex || col.title)}>
                              <dt>{renderedLabel}</dt>
                              <dd>{renderColumnValue(record, col, 'detail')}</dd>
                            </React.Fragment>
                          );
                        })}
                      </dl>
                    )}

                    {/* Appends business custom expanded row content below descriptions */}
                    {expandedRowRender && (
                      <div style={{ marginTop: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                        {expandedRowRender(record, index, 0, true)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Mobile-friendly Pagination */}
      {pagination && pagination.total > 0 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            simple
            size="small"
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={pagination.onChange}
          />
        </div>
      )}
    </div>
  );
}

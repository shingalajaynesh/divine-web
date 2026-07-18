import React, { useState } from 'react';
import { Table, Descriptions } from 'antd';
import { useViewport } from '../hooks/useViewport';
import EnterpriseMobileDataList from './EnterpriseMobileDataList';
import { renderColumnValue } from '../utils/tableHelpers';

/**
 * EnterpriseResponsiveTable dynamically routes list/tabular data between a standard Ant Design
 * table for desktop/tablet sizes and a high-performance structured list component for mobile screens.
 */
export default function EnterpriseResponsiveTable({
  columns = [],
  dataSource = [],
  rowKey = 'id',
  loading = false,
  error = null,
  onRetry = null,
  pagination = {},
  rowSelection = null,
  getRowActions = null,
  expandable = {},
  allowMobileScroll = false,
  sticky = true,
  ...props
}) {
  const { isMobile, isTablet } = useViewport();
  const [localExpandedKeys, setLocalExpandedKeys] = useState([]);

  // 1. Process column priorities (Honor explicit metadata or apply clean defaults)
  const processedColumns = columns.map((col, index) => {
    if (col.responsivePriority) return col;

    const keyStr = String(col.key || '').toLowerCase();
    const dataIndexStr = String(Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex || '').toLowerCase();
    const titleStr = String(col.title || '').toLowerCase();

    let responsivePriority = 3; // Default Priority 3

    // First column is always Priority 1
    if (index === 0) {
      responsivePriority = 1;
    }
    // Action/Status columns are Priority 1
    else if (
      keyStr.includes('action') || 
      titleStr.includes('action') ||
      keyStr.includes('isactive') ||
      keyStr.includes('status') ||
      dataIndexStr.includes('status')
    ) {
      responsivePriority = 1;
    }
    // Primary identifiers, names are Priority 1
    else if (
      titleStr.includes('name') ||
      dataIndexStr.includes('name') ||
      keyStr.includes('name')
    ) {
      responsivePriority = 1;
    }
    // Secondary fields are Priority 2 (Trimester, Week, Email, Mobile, Amount, Role)
    else if (
      titleStr.includes('email') ||
      titleStr.includes('role') ||
      titleStr.includes('week') ||
      titleStr.includes('trimester') ||
      titleStr.includes('mobile') ||
      titleStr.includes('amount') ||
      titleStr.includes('type')
    ) {
      responsivePriority = 2;
    }

    return { ...col, responsivePriority };
  });

  // 2. Render mobile list view if on mobile size and not explicitly scrolling
  if (isMobile && !allowMobileScroll) {
    const controlledExpandProps = {
      expandedRowKeys: expandable.expandedRowKeys || props.expandedRowKeys,
      onExpandedRowsChange: expandable.onExpandedRowsChange || props.onExpandedRowsChange,
      onExpand: expandable.onExpand || props.onExpand,
    };

    return (
      <EnterpriseMobileDataList
        columns={processedColumns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        error={error}
        onRetry={onRetry}
        pagination={pagination}
        rowSelection={rowSelection}
        getRowActions={getRowActions}
        expandedRowRender={expandable.expandedRowRender}
        {...controlledExpandProps}
      />
    );
  }

  // 3. Desktop/Tablet Tabular layout: Filter visible columns based on breakpoint
  const visibleColumns = processedColumns.filter(col => {
    if (isTablet) {
      return col.responsivePriority <= 2;
    }
    return col.responsivePriority <= 3;
  });

  // Find columns that are hidden in the current tabular viewport and should go to detail expansion
  const hiddenColumns = processedColumns.filter(col => {
    if (isTablet) {
      return col.responsivePriority > 2;
    }
    return col.responsivePriority === 4;
  });

  // Controlled/Uncontrolled expanded keys integration
  const activeExpandedKeys = expandable.expandedRowKeys || props.expandedRowKeys || localExpandedKeys;

  const handleExpandedRowsChange = (keys) => {
    if (expandable.onExpandedRowsChange) {
      expandable.onExpandedRowsChange(keys);
    }
    if (props.onExpandedRowsChange) {
      props.onExpandedRowsChange(keys);
    }
    if (!expandable.expandedRowKeys && !props.expandedRowKeys) {
      setLocalExpandedKeys(keys);
    }
  };

  // Build automatic desktop/tablet detail expander if hidden columns are present
  let finalExpandable = expandable;
  if (hiddenColumns.length > 0) {
    const detailExpandedRowRender = (record, index, indent, expanded) => {
      return (
        <div style={{ padding: '12px 24px', background: '#fafafa', borderRadius: '8px' }}>
          <Descriptions 
            title="Additional Details" 
            bordered 
            column={2} 
            size="small"
            style={{ background: '#fff' }}
          >
            {hiddenColumns.map(col => {
              const label = col.mobileLabel || col.title;
              const renderedLabel = typeof label === 'function' ? label() : label;
              return (
                <Descriptions.Item key={String(col.key || col.dataIndex || col.title)} label={renderedLabel}>
                  {renderColumnValue(record, col, 'detail')}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
          {expandable.expandedRowRender && (
            <div style={{ marginTop: '16px' }}>
              {expandable.expandedRowRender(record, index, indent, expanded)}
            </div>
          )}
        </div>
      );
    };

    finalExpandable = {
      ...expandable,
      expandedRowRender: detailExpandedRowRender,
      expandedRowKeys: activeExpandedKeys,
      onExpandedRowsChange: handleExpandedRowsChange,
    };
  }

  // Desktop horizontal scroll is opt-in or safety-only
  const scrollProps = allowMobileScroll || props.scroll
    ? props.scroll || { x: 'max-content' }
    : undefined;

  return (
    <Table
      className="enterprise-responsive-table"
      columns={visibleColumns}
      dataSource={dataSource}
      rowKey={rowKey}
      loading={loading}
      pagination={pagination}
      rowSelection={rowSelection}
      expandable={finalExpandable}
      sticky={sticky}
      scroll={scrollProps}
      {...props}
    />
  );
}

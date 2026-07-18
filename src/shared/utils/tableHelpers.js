import React from 'react';

/**
 * Extracts raw data from a record using dataIndex (supports string, nested path arrays).
 * 
 * @param {object} record The row record object.
 * @param {object} col The column configuration.
 * @returns {any} The extracted value or undefined.
 */
export function getColumnValue(record, col) {
  if (!col || !col.dataIndex) return undefined;
  
  if (Array.isArray(col.dataIndex)) {
    return col.dataIndex.reduce((obj, key) => obj?.[key], record);
  }
  return record[col.dataIndex];
}

/**
 * Formats and renders column values for desktop table viewports, mobile list cells, or details blocks.
 * 
 * @param {object} record The row record object.
 * @param {object} col The column configuration.
 * @param {'desktop' | 'mobile' | 'detail'} type The rendering context.
 * @returns {React.ReactNode} The rendered element or string value.
 */
export function renderColumnValue(record, col, type = 'desktop') {
  if (!col) return '-';
  
  const rawValue = getColumnValue(record, col);
  
  // 1. Check custom detail / mobile render overrides first
  if (type === 'detail' && col.detailRender) {
    return col.detailRender(rawValue, record);
  }
  if (type === 'mobile' && col.mobileRender) {
    return col.mobileRender(rawValue, record);
  }

  // 2. Check standard render reuse conditions
  if (col.render && (type === 'desktop' || col.reuseRenderInDetails)) {
    return col.render(rawValue, record);
  }

  // 3. Fallback to basic string representations
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '-';
  }
  return String(rawValue);
}

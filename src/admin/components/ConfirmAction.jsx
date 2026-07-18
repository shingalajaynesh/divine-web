import React, { useState } from 'react';
import { Modal, Input, Button } from 'antd';

export function ConfirmAction({ visible, onCancel, onConfirm, title, content, requireReason = false, confirmText = 'Confirm' }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      onCancel();
    } catch (err) {
      // Toast or error handlings are done by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={title}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          danger
          onClick={handleConfirm}
          loading={loading}
          disabled={requireReason && !reason.trim()}
        >
          {confirmText}
        </Button>,
      ]}
    >
      <div style={{ marginBottom: requireReason ? 16 : 0 }}>
        <p>{content}</p>
        {requireReason && (
          <Input.TextArea
            rows={3}
            placeholder="Please enter a reason for this action..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}

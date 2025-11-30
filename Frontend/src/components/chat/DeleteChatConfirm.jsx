import React, { useState, useEffect } from 'react';
import './NewChatPanel.css';

const DeleteChatConfirm = ({ open, title = 'this chat', onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!open) setSubmitting(false); }, [open]);
  if (!open) return null;

  const confirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nc-backdrop" onClick={onClose}>
      <div className="nc-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="nc-header">
          <h3>Delete chat</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="nc-body">
          <p>Are you sure you want to delete <strong>{title}</strong>? This will remove its messages and associated AI memory. This action cannot be undone.</p>
          <div className="nc-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="danger-btn" onClick={confirm} disabled={submitting}>{submitting ? 'Deleting…' : 'Delete'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteChatConfirm;

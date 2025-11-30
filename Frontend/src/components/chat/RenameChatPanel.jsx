import React, { useState, useEffect } from 'react';
import './NewChatPanel.css';

const RenameChatPanel = ({ open, initialTitle = '', onClose, onRename }) => {
  const [title, setTitle] = useState(initialTitle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setTitle(initialTitle || ''); setError(''); setSubmitting(false); } }, [open, initialTitle]);

  if (!open) return null;

  const submit = async (e) => {
    e?.preventDefault();
    if (!title.trim()) { setError('Please enter a title'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onRename?.(title.trim());
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to rename chat');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nc-backdrop" onClick={onClose}>
      <div className="nc-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="nc-header">
          <h3>Rename chat</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="nc-body" onSubmit={submit}>
          <label htmlFor="rc-title">New title</label>
          <input id="rc-title" placeholder="Enter new chat title" value={title} onChange={e => setTitle(e.target.value)} />
          {error && <div className="error-text">{error}</div>}
          <div className="nc-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameChatPanel;

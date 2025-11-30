import React, { useState } from 'react';
import './NewChatPanel.css';

const NewChatPanel = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async (e) => {
    e?.preventDefault();
    if (!title.trim()) { setError('Please enter a title'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onCreate?.(title.trim());
      setTitle('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create chat');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="nc-backdrop" onClick={onClose}>
      <div className="nc-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="nc-header">
          <h3>Create new chat</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="nc-body" onSubmit={submit}>
          <label htmlFor="nc-title">Chat title</label>
          <input id="nc-title" placeholder="Name your chat" value={title} onChange={e => setTitle(e.target.value)} />
          {error && <div className="error-text">{error}</div>}
          <div className="nc-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChatPanel;

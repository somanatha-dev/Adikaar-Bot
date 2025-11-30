import React, { useEffect, useState } from 'react';
import './AccountPanel.css';
import { http } from '../../lib/http.js';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setChats, selectChat } from '../../store/chatSlice.js';

const AccountPanel = ({ open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!open) return;
    // reset transient UI state on each open
    setDeleted(false);
    setConfirmDelete(false);
    setLoading(true);
    setError('');
    http.get('/api/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [open]);

  const doLogout = async () => {
    try { await http.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('token'); // Clear token from localStorage
    setUser(null);
    // clear chat state so UI updates without reload
    dispatch(setChats([]));
    dispatch(selectChat(null));
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!pwd.currentPassword || !pwd.newPassword) { setError('Fill all fields'); return; }
    if (pwd.newPassword !== pwd.confirm) { setError('Passwords do not match'); return; }
    try {
      await http.post('/api/auth/change-password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      alert('Password updated');
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update password');
    }
  };

  const deleteAccount = async () => {
    try {
      await http.delete('/api/auth/delete-account');
      setUser(null);
      setConfirmDelete(false);
      setDeleted(true);
      // clear chat state immediately
      dispatch(setChats([]));
      dispatch(selectChat(null));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete account');
      setConfirmDelete(false);
    }
  };

  if (!open) return null;

  return (
    <div className="account-backdrop" onClick={onClose}>
      <div className="account-panel" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="account-header">
          <h3>Account</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        {deleted ? (
          <div className="notice-body">
            <h4>Account deleted</h4>
            <p className="muted">Your account and all associated chats and messages were removed.</p>
            <div className="notice-actions">
              <button className="primary-btn" onClick={() => { onClose?.(); navigate('/'); }}>OK</button>
            </div>
          </div>
        ) : loading ? (
          <p className="muted">Loading…</p>
        ) : (
          user ? (
            <div className="account-body">
              <div className="profile-block">
                <div className="profile-row"><span className="label">Email</span><span>{user.email}</span></div>
                <div className="profile-row"><span className="label">First name</span><span>{user.fullName?.firstName || ''}</span></div>
                <div className="profile-row"><span className="label">Last name</span><span>{user.fullName?.lastName || ''}</span></div>
              </div>

              <form className="password-form" onSubmit={changePassword}>
                <h4>Change password</h4>
                <input type="password" placeholder="Current password" value={pwd.currentPassword} onChange={e => setPwd(p => ({...p, currentPassword: e.target.value}))} />
                <input type="password" placeholder="New password" value={pwd.newPassword} onChange={e => setPwd(p => ({...p, newPassword: e.target.value}))} />
                <input type="password" placeholder="Confirm new password" value={pwd.confirm} onChange={e => setPwd(p => ({...p, confirm: e.target.value}))} />
                {error && <div className="error-text">{error}</div>}
                <button type="submit" className="primary-btn">Update Password</button>
              </form>

              <div className="danger-zone">
                <button className="danger-btn" onClick={() => setConfirmDelete(true)}>Delete account</button>
                <button className="secondary-btn" onClick={doLogout}>Log out</button>
              </div>
            </div>
          ) : (
            <div className="account-body">
              <p className="muted">You're not signed in.</p>
              <div className="auth-actions">
                <button className="primary-btn" onClick={() => { onClose?.(); navigate('/login'); }}>Login</button>
                <button className="secondary-btn" onClick={() => { onClose?.(); navigate('/register'); }}>Register</button>
              </div>
            </div>
          )
        )}

        {confirmDelete && (
          <div className="confirm-backdrop" onClick={() => setConfirmDelete(false)}>
            <div className="confirm-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
              <h4>Delete account?</h4>
              <p className="muted">This will permanently delete your account, chats, and messages. This action cannot be undone.</p>
              <div className="confirm-actions">
                <button className="secondary-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="danger-btn" onClick={deleteAccount}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPanel;

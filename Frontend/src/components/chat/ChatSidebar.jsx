import React, { useEffect, useState } from 'react';
import './ChatSidebar.css';


const ChatSidebar = ({ chats, activeChatId, onSelectChat, onNewChat, open, onOpenAccount, onRenameChat, onDeleteChat }) => {

  const [ menuOpenFor, setMenuOpenFor ] = useState(null);
  const [ menuPos, setMenuPos ] = useState({ top: 0, left: 0 });

  const openMenu = (id, el) => {
    const rect = el?.getBoundingClientRect?.();
    if (rect) {
      const estimatedWidth = 180; // matches min-width in CSS
      const left = Math.max(8, Math.min(window.innerWidth - estimatedWidth - 8, rect.right - estimatedWidth));
      const top = rect.bottom + 8;
      setMenuPos({ top, left });
    }
    setMenuOpenFor(id);
  };

  const closeMenu = () => setMenuOpenFor(null);

  useEffect(() => {
    if (!menuOpenFor) return;
    const onResize = () => closeMenu();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpenFor]);


  
  return (
    <aside className={"chat-sidebar " + (open ? 'open' : '')} aria-label="Previous chats">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <button className="small-btn" onClick={onNewChat}>New</button>
        {open && (
          <button
            className="sidebar-close-btn"
            aria-label="Close sidebar"
            onClick={() => window.dispatchEvent(new CustomEvent('closeSidebar'))}
          >✕</button>
        )}
      </div>
      <nav className="chat-list" aria-live="polite">
        {chats.map(c => (
          <div key={c._id} className={"chat-list-item " + (c._id === activeChatId ? 'active' : '')}>
            <button className="chat-item-main" onClick={() => onSelectChat(c._id)}>
              <span className="title-line">{c.title}</span>
            </button>
            <button className="chat-item-ellipsis" aria-label="More" onClick={(e) => openMenu(c._id, e.currentTarget)}>
              ⋯
            </button>
          </div>
        ))}
        {chats.length === 0 && <p className="empty-hint">No chats yet.</p>}
      </nav>
      <div className="sidebar-footer">
        <button className="account-btn" onClick={onOpenAccount}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 22c0-4 4-7 8-7s8 3 8 7"/></svg>
          <span>Account</span>
        </button>
      </div>
      {menuOpenFor && (
        <>
          <button className="chat-menu-overlay" aria-label="Close menu" onClick={closeMenu} />
          <div className="chat-item-menu floating" role="menu" style={{ top: menuPos.top + 'px', left: menuPos.left + 'px' }}>
            {(() => {
              const c = chats.find(x => x._id === menuOpenFor);
              return (
                <>
                  <button className="menu-item" onClick={() => { closeMenu(); onRenameChat?.(c?._id, c?.title); }}>Rename chat</button>
                  <button className="menu-item danger" onClick={() => { closeMenu(); onDeleteChat?.(c?._id); }}>Delete chat</button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </aside>
  );
};

export default ChatSidebar;

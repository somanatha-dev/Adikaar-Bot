import React from 'react';
import './ChatMobileBar.css';
import './ChatLayout.css';



const ChatMobileBar = ({ onToggleSidebar, onNewChat, sidebarOpen, activeChatTitle }) => (
  <header className="chat-mobile-bar">
    <button
      className="chat-icon-btn"
      onClick={onToggleSidebar}
      aria-label={sidebarOpen ? "Close chat history" : "Open chat history"}
    >
      {sidebarOpen ? "✕" : "☰"}
    </button>
    <h1 className="chat-app-title">{activeChatTitle || "Chat"}</h1>
    <button className="chat-icon-btn" onClick={onNewChat} aria-label="New chat">＋</button>
  </header>
);

export default ChatMobileBar;

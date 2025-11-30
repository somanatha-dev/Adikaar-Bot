import React, { useCallback, useEffect, useState } from 'react';
import { io } from "socket.io-client";
import ChatMobileBar from '../components/chat/ChatMobileBar.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatComposer from '../components/chat/ChatComposer.jsx';
import '../components/chat/ChatLayout.css';
import AccountPanel from '../components/account/AccountPanel.jsx';
import NewChatPanel from '../components/chat/NewChatPanel.jsx';
import RenameChatPanel from '../components/chat/RenameChatPanel.jsx';
import DeleteChatConfirm from '../components/chat/DeleteChatConfirm.jsx';
import { fakeAIReply } from '../components/chat/aiClient.js';
import { useDispatch, useSelector } from 'react-redux';
import { http, SOCKET_URL } from '../lib/http.js';
import {
  ensureInitialChat,
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  setChats,
  updateChatTitle,
  removeChat
} from '../store/chatSlice.js';

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chat.chats);
  const activeChatId = useSelector(state => state.chat.activeChatId);
  const input = useSelector(state => state.chat.input);
  const isSending = useSelector(state => state.chat.isSending);
  const [ sidebarOpen, setSidebarOpen ] = React.useState(false);
  const [ socket, setSocket ] = useState(null);
  const [ showAccount, setShowAccount ] = useState(false);
  const [ showNewChat, setShowNewChat ] = useState(false);
  const [ showRename, setShowRename ] = useState(false);
  const [ renameChatId, setRenameChatId ] = useState(null);
  const [ renameInitialTitle, setRenameInitialTitle ] = useState('');
  const [ showDelete, setShowDelete ] = useState(false);
  const [ deleteChatId, setDeleteChatId ] = useState(null);
  const [ deleteChatTitle, setDeleteChatTitle ] = useState('');

  // Listen for sidebar close event from close button
  React.useEffect(() => {
    const handler = () => setSidebarOpen(false);
    window.addEventListener('closeSidebar', handler);
    return () => window.removeEventListener('closeSidebar', handler);
  }, []);

  // Use _id (backend field) instead of id to resolve active chat
  const activeChat = chats.find(c => c._id === activeChatId) || null;

  const [ messages, setMessages ] = useState([
    // {
    //   type: 'user',
    //   content: 'Hello, how can I help you today?'
    // },
    // {
    //   type: 'ai',
    //   content: 'Hi there! I need assistance with my account.'
    // }
  ]);

  const handleNewChat = () => setShowNewChat(true);

  const handleRenameChat = (id, currentTitle) => {
    setRenameChatId(id);
    setRenameInitialTitle(currentTitle || '');
    setShowRename(true);
  };

  const handleDeleteChat = (id) => {
    const chat = chats.find(c => c._id === id);
    setDeleteChatId(id);
    setDeleteChatTitle(chat?.title || 'this chat');
    setShowDelete(true);
  };

  const createNewChat = async (title) => {
    const response = await http.post('/api/chat', { title });
    dispatch(startNewChat(response.data.chat));
    setSidebarOpen(false);
    setShowNewChat(false);
    await getMessages(response.data.chat._id);
  };

  // Ensure at least one chat exists initially
  useEffect(() => {

    http.get("/api/chat")
      .then(response => {
        dispatch(setChats(response.data.chats.reverse()));
      })

    const tempSocket = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token: localStorage.getItem('token')
      }
    })

    tempSocket.on("ai-response", (messagePayload) => {
      console.log("Received AI response:", messagePayload);

      setMessages((prevMessages) => [ ...prevMessages, {
        type: 'ai',
        content: messagePayload.content,
        createdAt: new Date()
      } ]);

      dispatch(sendingFinished());
    });

    setSocket(tempSocket);

  }, []);

  // Load messages whenever active chat changes programmatically
  useEffect(() => {
    if (activeChatId) {
      getMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  const sendMessage = async () => {

    const trimmed = input.trim();
    console.log("Sending message:", trimmed);
    if (!trimmed || !activeChatId || isSending) return;
    dispatch(sendingStarted());

    const newMessages = [ ...messages, {
      type: 'user',
      content: trimmed,
      createdAt: new Date()
    } ];

    console.log("New messages:", newMessages);

    setMessages(newMessages);
    dispatch(setInput(''));

    socket.emit("ai-message", {
      chat: activeChatId,
      content: trimmed
    })

    // try {
    //   const reply = await fakeAIReply(trimmed);
    //   dispatch(addAIMessage(activeChatId, reply));
    // } catch {
    //   dispatch(addAIMessage(activeChatId, 'Error fetching AI response.', true));
    // } finally {
    //   dispatch(sendingFinished());
    // }
  }

  const getMessages = async (chatId) => {

  const response = await  http.get(`/api/chat/messages/${chatId}`)

   console.log("Fetched messages:", response.data.messages);

   setMessages(response.data.messages.map(m => ({
     type: m.role === 'user' ? 'user' : 'ai',
     content: m.content,
     createdAt: m.createdAt
   })));

  }

  const renameChat = async (newTitle) => {
    if (!renameChatId) return;
    const id = renameChatId;
    await http.patch(`/api/chat/${id}`, { title: newTitle });
    dispatch(updateChatTitle({ id, title: newTitle }));
    setShowRename(false);
    setRenameChatId(null);
    setRenameInitialTitle('');
  };

  const deleteChat = async () => {
    if (!deleteChatId) return;
    const id = deleteChatId;
    await http.delete(`/api/chat/${id}`);
    const wasActive = activeChatId === id;
    dispatch(removeChat(id));
    setShowDelete(false);
    setDeleteChatId(null);
    setDeleteChatTitle('');
    if (wasActive) {
      // Messages for the new active chat will load via effect; clear immediately for UX
      setMessages([]);
    }
  };


return (
  <div className="chat-layout minimal">
    <ChatMobileBar
      onToggleSidebar={() => setSidebarOpen(o => !o)}
      onNewChat={handleNewChat}
      sidebarOpen={sidebarOpen}
      activeChatTitle={activeChat?.title}
    />
    <ChatSidebar
      chats={chats}
      activeChatId={activeChatId}
      onSelectChat={(id) => {
        dispatch(selectChat(id));
        setSidebarOpen(false);
      }}
      onNewChat={handleNewChat}
      open={sidebarOpen}
      onOpenAccount={() => setShowAccount(true)}
      onRenameChat={handleRenameChat}
      onDeleteChat={handleDeleteChat}
    />

    
    <main className="chat-main" role="main">
      {messages.length === 0 && (
        <div className="chat-welcome" aria-hidden="true">
          <div className="chip">Early Preview</div>
          <h1>Adhikaar</h1>
          <p>Ask about Indian government schemes, IDs, and policies. Your chats stay in the sidebar so you can pick up where you left off.</p>
        </div>
      )}
      <ChatMessages messages={messages} isSending={isSending} />
      {
        activeChatId &&
        <ChatComposer
          input={input}
          setInput={(v) => dispatch(setInput(v))}
          onSend={sendMessage}
          isSending={isSending}
        />}
    </main>
    {sidebarOpen && (
      <button
        className="sidebar-backdrop"
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
      />
    )}
    <AccountPanel open={showAccount} onClose={() => setShowAccount(false)} />
    <NewChatPanel open={showNewChat} onClose={() => setShowNewChat(false)} onCreate={createNewChat} />
    <RenameChatPanel
      open={showRename}
      initialTitle={renameInitialTitle}
      onClose={() => setShowRename(false)}
      onRename={renameChat}
    />
    <DeleteChatConfirm
      open={showDelete}
      title={deleteChatTitle}
      onClose={() => setShowDelete(false)}
      onConfirm={deleteChat}
    />
  </div>
);
};

export default Home;

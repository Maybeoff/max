import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import ChatList from '../Chat/ChatList';
import ChatWindow from '../Chat/ChatWindow';
import { useSocket } from '../../context/SocketContext';

function MainLayout() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    loadChats();
  }, [socket]);

  const loadChats = () => {
    if (!socket) return;
    
    socket.emit('get-chats', (response) => {
      if (response.success) {
        setChats(response.chats);
      } else {
        console.error('Ошибка загрузки чатов:', response.error);
      }
    });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <ChatList 
        chats={chats} 
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        onChatsUpdate={loadChats}
      />
      <ChatWindow 
        chat={selectedChat}
        onChatUpdate={loadChats}
      />
    </Box>
  );
}

export default MainLayout;

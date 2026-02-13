import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import VideocamIcon from '@mui/icons-material/Videocam';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import FileUpload from './FileUpload';

function ChatWindow({ chat, onChatUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [attachMenuAnchor, setAttachMenuAnchor] = useState(null);
  const socket = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chat && socket) {
      loadMessages();
      socket.emit('join-chat', chat.id);
    }

    return () => {
      if (chat && socket) {
        socket.emit('leave-chat', chat.id);
      }
    };
  }, [chat, socket]);

  useEffect(() => {
    if (socket) {
      socket.on('new-message', (message) => {
        if (message.chatId === chat?.id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });

      socket.on('user-typing', ({ username }) => {
        setTyping(username);
        setTimeout(() => setTyping(false), 3000);
      });

      return () => {
        socket.off('new-message');
        socket.off('user-typing');
      };
    }
  }, [socket, chat]);

  const loadMessages = () => {
    if (!socket || !chat) return;
    
    socket.emit('get-messages', { chatId: chat.id }, (response) => {
      if (response.success) {
        setMessages(response.messages);
        scrollToBottom();
      } else {
        console.error('Ошибка загрузки сообщений:', response.error);
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat) return;

    try {
      socket?.emit('send-message', {
        chatId: chat.id,
        content: newMessage,
        type: 'text'
      });

      setNewMessage('');
      onChatUpdate();
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const handleTyping = () => {
    socket?.emit('typing', { chatId: chat.id });
  };

  const handleFileUploaded = (fileData) => {
    socket?.emit('send-message', {
      chatId: chat.id,
      content: fileData.filename,
      type: fileData.type,
      fileUrl: fileData.url,
      fileName: fileData.filename,
      fileSize: fileData.size
    });
    onChatUpdate();
  };

  const handleQuickImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setNewMessage('Загрузка файла...');
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки файла');
      }
      
      const data = await response.json();
      
      // Определяем тип файла
      let fileType = 'document';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';
      
      setNewMessage('');
      
      // Отправляем сообщение с файлом
      socket?.emit('send-message', {
        chatId: chat.id,
        content: data.filename,
        type: fileType,
        fileUrl: data.url,
        fileName: data.filename,
        fileSize: data.size
      });
      
      onChatUpdate();
    } catch (error) {
      setNewMessage('');
      console.error('Ошибка загрузки:', error);
      alert('Ошибка загрузки файла');
    }

  };

  const getChatName = () => {
    if (!chat) return '';
    if (chat.isGroup) return chat.name;
    const otherUser = chat.participants.find(p => p.id !== user.id);
    return otherUser?.username || 'Неизвестный';
  };

  const getChatAvatar = () => {
    if (!chat) return '';
    if (chat.isGroup) return chat.avatar;
    const otherUser = chat.participants.find(p => p.id !== user.id);
    return otherUser?.avatar;
  };

  if (!chat) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#E3F2FD',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Выберите чат для начала общения
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#E3F2FD' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <Avatar src={getChatAvatar()} sx={{ mr: 2 }}>
          {getChatName()[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {getChatName()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {typing ? `${typing} печатает...` : 'был(а) в сети недавно'}
          </Typography>
        </Box>
        <IconButton>
          <PhoneIcon />
        </IconButton>
        <IconButton>
          <VideocamIcon />
        </IconButton>
        <IconButton>
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <MessageList messages={messages} currentUserId={user.id} />
      <div ref={messagesEndRef} />

      {/* Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #E0E0E0',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleQuickImageUpload}
        />
        
        <TextField
          fullWidth
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          multiline
          maxRows={4}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton 
                  size="small"
                  onClick={(e) => setAttachMenuAnchor(e.currentTarget)}
                >
                  <AttachFileIcon />
                </IconButton>
                <Menu
                  anchorEl={attachMenuAnchor}
                  open={Boolean(attachMenuAnchor)}
                  onClose={() => setAttachMenuAnchor(null)}
                >
                  <MenuItem onClick={() => {
                    fileInputRef.current?.click();
                    setAttachMenuAnchor(null);
                  }}>
                    <ListItemIcon><ImageIcon /></ListItemIcon>
                    <ListItemText>Фото</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    setFileUploadOpen(true);
                    setAttachMenuAnchor(null);
                  }}>
                    <ListItemIcon><VideoFileIcon /></ListItemIcon>
                    <ListItemText>Видео</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    setFileUploadOpen(true);
                    setAttachMenuAnchor(null);
                  }}>
                    <ListItemIcon><InsertDriveFileIcon /></ListItemIcon>
                    <ListItemText>Документ</ListItemText>
                  </MenuItem>
                </Menu>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small">
                  <EmojiEmotionsIcon />
                </IconButton>
                <IconButton
                  type="submit"
                  size="small"
                  color="primary"
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: '#FFFFFF',
            },
          }}
        />
      </Box>

      <FileUpload
        open={fileUploadOpen}
        onClose={() => setFileUploadOpen(false)}
        onFileUploaded={handleFileUploaded}
      />
    </Box>
  );
}

export default ChatWindow;

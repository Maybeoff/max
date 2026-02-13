import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import NewChatDialog from './NewChatDialog';

function ChatList({ chats, selectedChat, onSelectChat, onChatsUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openNewChat, setOpenNewChat] = useState(false);

  const filteredChats = chats.filter(chat => {
    const chatName = chat.isGroup ? chat.name : chat.participants[0]?.username || '';
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.name;
    return chat.participants[0]?.username || 'Неизвестный';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroup) return chat.avatar || chat.name?.[0];
    return chat.participants[0]?.avatar || chat.participants[0]?.username?.[0];
  };

  const formatTime = (date) => {
    if (!date) return '';
    return format(new Date(date), 'HH:mm', { locale: ru });
  };

  return (
    <Box
      sx={{
        width: 340,
        bgcolor: '#FFFFFF',
        borderRight: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #E0E0E0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Чаты
          </Typography>
          <IconButton size="small" onClick={() => setOpenNewChat(true)}>
            <AddIcon />
          </IconButton>
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Поиск"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: '#F5F5F5',
            },
          }}
        />
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {filteredChats.map((chat) => (
          <ListItem
            key={chat.id}
            button
            selected={selectedChat?.id === chat.id}
            onClick={() => onSelectChat(chat)}
            sx={{
              borderBottom: '1px solid #F0F0F0',
              '&.Mui-selected': {
                bgcolor: '#F0F7FF',
              },
              '&:hover': {
                bgcolor: '#F5F5F5',
              },
            }}
          >
            <ListItemAvatar>
              <Badge
                color="success"
                variant="dot"
                invisible={true}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar src={getChatAvatar(chat)}>
                  {getChatName(chat)[0]?.toUpperCase()}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {getChatName(chat)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(chat.updatedAt)}
                  </Typography>
                </Box>
              }
              secondary={
                <Typography variant="body2" color="text.secondary" noWrap>
                  {chat.lastMessage?.content || 'Нет сообщений'}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>

      <NewChatDialog
        open={openNewChat}
        onClose={() => setOpenNewChat(false)}
        onChatCreated={onChatsUpdate}
      />
    </Box>
  );
}

export default ChatList;

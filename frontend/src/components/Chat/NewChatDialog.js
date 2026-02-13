import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { useSocket } from '../../context/SocketContext';

function NewChatDialog({ open, onClose, onChatCreated }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 0 && socket) {
      setLoading(true);
      socket.emit('search-users', { query }, (response) => {
        setLoading(false);
        if (response.success) {
          console.log('Найдено пользователей:', response.users);
          setUsers(response.users);
        } else {
          console.error('Ошибка поиска:', response.error);
          alert('Ошибка поиска пользователей');
        }
      });
    } else {
      setUsers([]);
    }
  };

  const handleCreateChat = (userId) => {
    if (!socket) return;
    
    socket.emit('create-chat', { participantId: userId, isGroup: false }, (response) => {
      if (response.success) {
        onChatCreated();
        onClose();
        setSearchQuery('');
        setUsers([]);
      } else {
        console.error('Ошибка создания чата:', response.error);
        alert(response.error || 'Ошибка создания чата');
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Новый чат</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Введите имя пользователя или email..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && users.length === 0 && searchQuery.length > 0 && (
          <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
            <Typography>Пользователи не найдены</Typography>
          </Box>
        )}
        
        {!loading && users.length === 0 && searchQuery.length === 0 && (
          <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
            <Typography>Начните вводить для поиска</Typography>
          </Box>
        )}
        
        <List>
          {users.map((user) => (
            <ListItem
              key={user.id}
              button
              onClick={() => handleCreateChat(user.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  bgcolor: '#F5F5F5'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar src={user.avatar}>
                  {user.username?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={user.bio || user.email}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}

export default NewChatDialog;

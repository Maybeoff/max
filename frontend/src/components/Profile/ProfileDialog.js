import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Avatar,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import PrivacySettings from './PrivacySettings';

function ProfileDialog({ open, onClose }) {
  const { user, setUser } = useAuth();
  const socket = useSocket();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user, open]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      setError('Можно загружать только изображения');
      return;
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер изображения не должен превышать 5MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');

    try {
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
      setAvatar(data.url);
    } catch (err) {
      setError('Ошибка загрузки аватара');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    if (!socket) {
      setError('Нет подключения к серверу');
      setLoading(false);
      return;
    }
    
    socket.emit('update-profile', {
      username,
      bio,
      phone,
      avatar
    }, (response) => {
      setLoading(false);
      
      if (response.success) {
        setUser(response.user);
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(response.error || 'Ошибка обновления профиля');
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Мой профиль</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Профиль успешно обновлен!
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatar}
              sx={{ width: 120, height: 120, mb: 2 }}
            >
              {username?.[0]?.toUpperCase()}
            </Avatar>
            
            {uploadingAvatar && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  borderRadius: '50%',
                  mb: 2
                }}
              >
                <CircularProgress size={40} sx={{ color: 'white' }} />
              </Box>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 10,
                right: -5,
                bgcolor: 'primary.main',
                color: 'white',
                width: 40,
                height: 40,
                '&:hover': { bgcolor: 'primary.dark' }
              }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <PhotoCameraIcon />
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 500 }}>
            Нажмите на камеру чтобы загрузить фото
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {user?.id} • {user?.email}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          required
        />
        
        <TextField
          fullWidth
          label="О себе"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          margin="normal"
          multiline
          rows={3}
          placeholder="Расскажите о себе..."
        />
        
        <TextField
          fullWidth
          label="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          margin="normal"
          placeholder="+7 (999) 123-45-67"
        />
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button 
          startIcon={<SecurityIcon />}
          onClick={() => setPrivacyOpen(true)}
          disabled={loading}
        >
          Приватность
        </Button>
        <Box>
          <Button onClick={onClose} disabled={loading} sx={{ mr: 1 }}>
            Отмена
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={loading || !username || uploadingAvatar}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Box>
      </DialogActions>

      <PrivacySettings 
        open={privacyOpen} 
        onClose={() => setPrivacyOpen(false)} 
      />
    </Dialog>
  );
}

export default ProfileDialog;

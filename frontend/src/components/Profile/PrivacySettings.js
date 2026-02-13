import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

function PrivacySettings({ open, onClose }) {
  const { user, setUser } = useAuth();
  const socket = useSocket();
  const [settings, setSettings] = useState({
    showEmail: 'contacts',
    showPhone: 'contacts',
    showLastSeen: 'everyone',
    showAvatar: 'everyone',
    showBio: 'everyone'
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.privacySettings) {
      setSettings(user.privacySettings);
    }
  }, [user, open]);

  const handleChange = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    
    // Автосохранение
    if (socket) {
      socket.emit('update-privacy', { privacySettings: newSettings }, (response) => {
        if (response.success) {
          setUser(response.user);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
        }
      });
    }
  };

  const options = [
    { value: 'everyone', label: 'Все' },
    { value: 'contacts', label: 'Мои контакты' },
    { value: 'nobody', label: 'Никто' }
  ];

  const privacyItems = [
    { field: 'showEmail', label: 'Email', description: 'Кто может видеть ваш email' },
    { field: 'showPhone', label: 'Номер телефона', description: 'Кто может видеть ваш номер' },
    { field: 'showLastSeen', label: 'Время последнего визита', description: 'Кто может видеть когда вы были онлайн' },
    { field: 'showAvatar', label: 'Фото профиля', description: 'Кто может видеть ваше фото' },
    { field: 'showBio', label: 'О себе', label: 'Кто может видеть информацию о вас' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Приватность и безопасность</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Настройки сохранены
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Управляйте тем, кто может видеть вашу личную информацию
        </Typography>

        {privacyItems.map((item, index) => (
          <Box key={item.field}>
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                {item.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {item.description}
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={settings[item.field]}
                  onChange={(e) => handleChange(item.field, e.target.value)}
                >
                  {options.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {index < privacyItems.length - 1 && <Divider />}
          </Box>
        ))}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 Настройка "Мои контакты" означает, что информацию увидят только пользователи, 
            с которыми у вас есть общие чаты.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default PrivacySettings;

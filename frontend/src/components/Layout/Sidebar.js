import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileDialog from '../Profile/ProfileDialog';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        width: 60,
        bgcolor: '#FFFFFF',
        borderRight: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
      }}
    >
      <Avatar
        sx={{ width: 40, height: 40, mb: 3, cursor: 'pointer' }}
        src={user?.avatar}
        onClick={handleMenuOpen}
      >
        {user?.username?.[0]?.toUpperCase()}
      </Avatar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem disabled>
          <Box>
            <div style={{ fontWeight: 600 }}>{user?.username}</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>{user?.email}</div>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setProfileOpen(true); handleMenuClose(); }}>
          <PersonIcon sx={{ mr: 1 }} fontSize="small" />
          Мой профиль
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); }}>
          <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
          Настройки
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
          Выйти
        </MenuItem>
      </Menu>

      <Tooltip title="Чаты" placement="right">
        <IconButton sx={{ mb: 2, color: '#0077FF' }}>
          <ChatIcon />
        </IconButton>
      </Tooltip>

      <Box sx={{ flexGrow: 1 }} />

      <Tooltip title="Настройки" placement="right">
        <IconButton onClick={() => setProfileOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <ProfileDialog 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)} 
      />
    </Box>
  );
}

export default Sidebar;

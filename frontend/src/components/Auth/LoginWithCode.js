import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

function LoginWithCode() {
  const [step, setStep] = useState(1); // 1 = email, 2 = code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data } = await axios.post('/api/auth/request-code', { email });
      setStep(2);
      setTimer(600); // 10 минут
      
      // Таймер обратного отсчета
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data } = await axios.post('/api/auth/login-with-code', { email, code });
      
      // Сохраняем авторизацию
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      navigate('/');
      window.location.reload(); // Перезагружаем для инициализации socket
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          {step === 1 ? 'Вход по коду' : 'Введите код'}
        </Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        
        {step === 1 ? (
          <Box component="form" onSubmit={handleRequestCode} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Получить код'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none', color: '#0077FF', marginRight: 16 }}>
                Вход с паролем
              </Link>
              <Link to="/register" style={{ textDecoration: 'none', color: '#0077FF' }}>
                Регистрация
              </Link>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleVerifyCode} sx={{ mt: 1, width: '100%' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Код отправлен на {email}
            </Alert>
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Код из email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              disabled={loading}
              inputProps={{ maxLength: 6, style: { fontSize: 24, textAlign: 'center', letterSpacing: 8 } }}
            />
            
            {timer > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                Код действителен: {formatTime(timer)}
              </Typography>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || code.length !== 6}
            >
              {loading ? <CircularProgress size={24} /> : 'Войти'}
            </Button>
            
            <Button
              fullWidth
              variant="text"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Изменить email
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default LoginWithCode;

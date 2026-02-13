import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Alert, CircularProgress } from '@mui/material';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from 'axios';

// Получите ключ на https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

function Register() {
  const [step, setStep] = useState(1); // 1 = данные, 2 = код
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Получаем токен reCAPTCHA
      const recaptchaToken = recaptchaRef.current?.getValue();
      
      if (!recaptchaToken) {
        setError('Пожалуйста, подтвердите что вы не робот');
        setLoading(false);
        return;
      }
      
      const { data } = await axios.post('/api/auth/register', {
        username,
        email,
        password,
        recaptchaToken
      });
      
      if (data.requiresVerification) {
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
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data } = await axios.post('/api/auth/verify-registration', {
        username,
        email,
        password,
        code
      });
      
      // Сохраняем авторизацию
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    
    try {
      await axios.post('/api/auth/resend-code', { email });
      setTimer(600);
      
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
          {step === 1 ? 'Регистрация' : 'Подтверждение email'}
        </Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        
        {step === 1 ? (
          <Box component="form" onSubmit={handleRegister} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                theme="light"
              />
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none', color: '#0077FF' }}>
                Уже есть аккаунт? Войти
              </Link>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleVerifyCode} sx={{ mt: 1, width: '100%' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Код подтверждения отправлен на {email}
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
              {loading ? <CircularProgress size={24} /> : 'Подтвердить'}
            </Button>
            
            <Button
              fullWidth
              variant="text"
              onClick={handleResendCode}
              disabled={loading || timer > 540}
            >
              Отправить код повторно
            </Button>
            
            <Button
              fullWidth
              variant="text"
              onClick={() => setStep(1)}
              disabled={loading}
              sx={{ mt: 1 }}
            >
              Изменить данные
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default Register;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, VerificationCode } = require('../models');
const { generateCode, sendVerificationCode, sendWelcomeEmail } = require('../utils/emailService');
const { verifyRecaptcha } = require('../utils/recaptcha');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Регистрация - шаг 1: отправка кода
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, recaptchaToken } = req.body;
    
    // Проверяем reCAPTCHA
    if (recaptchaToken) {
      const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidCaptcha) {
        return res.status(400).json({ error: 'Проверка reCAPTCHA не пройдена' });
      }
    }
    
    if (!username || username.length < 1) {
      return res.status(400).json({ error: 'Имя пользователя обязательно' });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Некорректный email' });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }
    
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (userExists) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    // Генерируем код подтверждения
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут
    
    // Сохраняем код
    await VerificationCode.create({
      email,
      code,
      expiresAt
    });
    
    // Отправляем код на email
    const sent = await sendVerificationCode(email, code);
    
    if (!sent) {
      return res.status(500).json({ error: 'Ошибка отправки email' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Код подтверждения отправлен на email',
      email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: error.message });
  }
});

// Регистрация - шаг 2: подтверждение кода и создание аккаунта
router.post('/verify-registration', async (req, res) => {
  try {
    const { username, email, password, code } = req.body;
    
    // Проверяем код
    const verificationCode = await VerificationCode.findOne({
      email,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!verificationCode) {
      return res.status(401).json({ error: 'Неверный или истекший код' });
    }
    
    // Проверяем что пользователь еще не создан
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (userExists) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    // Создаем пользователя с подтвержденным email
    const user = await User.create({ 
      username, 
      email, 
      password,
      emailVerified: true 
    });
    
    // Помечаем код как использованный
    verificationCode.isUsed = true;
    await verificationCode.save();
    
    // Отправляем приветственное письмо
    sendWelcomeEmail(email, username);
    
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Ошибка подтверждения регистрации:', error);
    res.status(500).json({ error: error.message });
  }
});

// Повторная отправка кода
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Некорректный email' });
    }
    
    // Генерируем новый код
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Удаляем старые неиспользованные коды
    await VerificationCode.deleteMany({
      email,
      isUsed: false
    });
    
    // Создаем новый код
    await VerificationCode.create({
      email,
      code,
      expiresAt
    });
    
    // Отправляем код
    const sent = await sendVerificationCode(email, code);
    
    if (sent) {
      res.json({ 
        success: true, 
        message: 'Новый код отправлен на email'
      });
    } else {
      res.status(500).json({ error: 'Ошибка отправки email' });
    }
  } catch (error) {
    console.error('Ошибка повторной отправки:', error);
    res.status(500).json({ error: error.message });
  }
});

// Запрос кода для входа
router.post('/request-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Некорректный email' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Генерируем код
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Сохраняем код
    await VerificationCode.create({
      email,
      code,
      expiresAt
    });
    
    // Отправляем код
    const sent = await sendVerificationCode(email, code);
    
    if (sent) {
      res.json({ 
        success: true, 
        message: 'Код отправлен на email',
        expiresIn: 600
      });
    } else {
      res.status(500).json({ error: 'Ошибка отправки email' });
    }
  } catch (error) {
    console.error('Ошибка запроса кода:', error);
    res.status(500).json({ error: error.message });
  }
});

// Вход с кодом
router.post('/login-with-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    // Проверяем код
    const verificationCode = await VerificationCode.findOne({
      email,
      code,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!verificationCode) {
      return res.status(401).json({ error: 'Неверный или истекший код' });
    }
    
    // Помечаем код как использованный
    verificationCode.isUsed = true;
    await verificationCode.save();
    
    // Обновляем статус
    user.status = 'online';
    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Ошибка входа с кодом:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обычный вход с паролем
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    user.status = 'online';
    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

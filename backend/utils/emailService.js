const nodemailer = require('nodemailer');

// Создаем транспорт для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Генерация 6-значного кода
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Отправка кода подтверждения
const sendVerificationCode = async (email, code) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Код подтверждения для входа',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0077FF;">Код подтверждения</h2>
          <p>Ваш код для входа в мессенджер:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #0077FF; font-size: 36px; margin: 0; letter-spacing: 8px;">${code}</h1>
          </div>
          <p style="color: #666;">Код действителен в течение 10 минут.</p>
          <p style="color: #666; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email отправлен:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    return false;
  }
};

// Отправка приветственного письма
const sendWelcomeEmail = async (email, username) => {
  // Режим разработки - пропускаем
  if (process.env.EMAIL_DISABLED === 'true') {
    console.log('📧 [DEV MODE] Приветственное письмо пропущено для', username);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Добро пожаловать в мессенджер!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0077FF;">Добро пожаловать, ${username}!</h2>
          <p>Спасибо за регистрацию в нашем мессенджере.</p>
          <p>Теперь вы можете:</p>
          <ul>
            <li>Обмениваться сообщениями с друзьями</li>
            <li>Отправлять фото, видео и документы</li>
            <li>Создавать групповые чаты</li>
            <li>Настраивать свой профиль</li>
          </ul>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Если у вас есть вопросы, свяжитесь с нами.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Приветственное письмо отправлено');
  } catch (error) {
    console.error('❌ Ошибка отправки приветственного письма:', error);
  }
};

module.exports = {
  generateCode,
  sendVerificationCode,
  sendWelcomeEmail
};

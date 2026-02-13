const axios = require('axios');

const verifyRecaptcha = async (token) => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey || secretKey === 'your_recaptcha_secret_key_here') {
      console.warn('⚠️  reCAPTCHA не настроена, пропускаем проверку');
      return true; // В режиме разработки пропускаем
    }
    
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ reCAPTCHA пройдена');
      return true;
    } else {
      console.log('❌ reCAPTCHA не пройдена:', response.data['error-codes']);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка проверки reCAPTCHA:', error.message);
    return false;
  }
};

module.exports = { verifyRecaptcha };

const axios = require('axios');

const verifyRecaptcha = async (token) => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    // Тестовые ключи Google - всегда пропускаем
    if (secretKey === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe') {
      console.log('✅ reCAPTCHA (тестовый режим)');
      return true;
    }
    
    if (!secretKey || secretKey === 'your_recaptcha_secret_key_here') {
      console.warn('⚠️  reCAPTCHA не настроена, пропускаем проверку');
      return true;
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
    // В случае ошибки API пропускаем (чтобы не блокировать регистрацию)
    return true;
  }
};

module.exports = { verifyRecaptcha };

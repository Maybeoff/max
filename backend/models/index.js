const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB подключена');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
};

const User = require('./User');
const Chat = require('./Chat');
const Message = require('./Message');
const VerificationCode = require('./VerificationCode');

module.exports = {
  connectDB,
  User,
  Chat,
  Message,
  VerificationCode
};

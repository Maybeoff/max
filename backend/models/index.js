const sequelize = require('../config/database');
const User = require('./User');
const Chat = require('./Chat');
const Message = require('./Message');
const ChatParticipant = require('./ChatParticipant');
const MessageRead = require('./MessageRead');
const VerificationCode = require('./VerificationCode');

// Relationships
Chat.belongsToMany(User, { through: ChatParticipant, as: 'participants', foreignKey: 'chatId' });
User.belongsToMany(Chat, { through: ChatParticipant, foreignKey: 'userId' });

Chat.hasMany(Message, { foreignKey: 'chatId', as: 'messages' });
Message.belongsTo(Chat, { foreignKey: 'chatId' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Message.hasMany(MessageRead, { foreignKey: 'messageId', as: 'reads' });
MessageRead.belongsTo(Message, { foreignKey: 'messageId' });

User.hasMany(MessageRead, { foreignKey: 'userId' });
MessageRead.belongsTo(User, { foreignKey: 'userId' });

Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('База данных синхронизирована');
  } catch (error) {
    console.error('Ошибка синхронизации базы данных:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Chat,
  Message,
  ChatParticipant,
  MessageRead,
  VerificationCode,
  syncDatabase
};

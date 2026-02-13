const jwt = require('jsonwebtoken');
const { User, Message, Chat, ChatParticipant } = require('../models');
const { Op } = require('sequelize');

const users = new Map();

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error'));
      }
      
      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Пользователь подключен:', socket.userId);
    users.set(socket.userId, socket.id);
    
    // Обновляем статус на online
    User.update({ status: 'online' }, { where: { id: socket.userId } });

    // Получить список чатов
    socket.on('get-chats', async (callback) => {
      try {
        const chats = await Chat.findAll({
          include: [
            {
              model: User,
              as: 'participants',
              attributes: ['id', 'username', 'email', 'avatar', 'status'],
              through: { attributes: [] },
              where: { id: socket.userId }
            }
          ]
        });

        const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
          const allParticipants = await chat.getParticipants({
            attributes: ['id', 'username', 'email', 'avatar', 'status']
          });
          
          const lastMessage = await Message.findOne({
            where: { chatId: chat.id },
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }]
          });

          const otherParticipants = allParticipants.filter(p => p.id !== socket.userId);

          return {
            id: chat.id,
            name: chat.name,
            isGroup: chat.isGroup,
            avatar: chat.avatar,
            isEncrypted: chat.isEncrypted,
            participants: otherParticipants,
            lastMessage,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
          };
        }));

        callback({ success: true, chats: chatsWithDetails.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) });
      } catch (error) {
        console.error('Ошибка получения чатов:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Создать новый чат
    socket.on('create-chat', async (data, callback) => {
      try {
        const { participantId, isGroup, name, participants } = data;
        
        if (isGroup) {
          const chat = await Chat.create({
            name,
            isGroup: true,
            adminId: socket.userId
          });
          
          await chat.addParticipants([...participants, socket.userId]);
          const allParticipants = await chat.getParticipants({
            attributes: ['id', 'username', 'email', 'avatar']
          });
          
          callback({ 
            success: true, 
            chat: {
              id: chat.id,
              name: chat.name,
              isGroup: chat.isGroup,
              participants: allParticipants
            }
          });
        } else {
          let chat = await Chat.findOne({
            include: [{
              model: User,
              as: 'participants',
              where: { id: { [Op.in]: [socket.userId, participantId] } },
              through: { attributes: [] }
            }],
            where: { isGroup: false }
          });
          
          if (!chat) {
            chat = await Chat.create({ isGroup: false });
            await chat.addParticipants([socket.userId, participantId]);
          }
          
          const allParticipants = await chat.getParticipants({
            attributes: ['id', 'username', 'email', 'avatar']
          });
          const otherParticipants = allParticipants.filter(p => p.id !== socket.userId);
          
          callback({ 
            success: true, 
            chat: {
              id: chat.id,
              isGroup: chat.isGroup,
              participants: otherParticipants
            }
          });
        }
      } catch (error) {
        console.error('Ошибка создания чата:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Получить сообщения чата
    socket.on('get-messages', async (data, callback) => {
      try {
        const { chatId } = data;
        
        const messages = await Message.findAll({
          where: { chatId },
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'avatar']
            },
            {
              model: Message,
              as: 'replyTo',
              attributes: ['id', 'content']
            }
          ],
          order: [['createdAt', 'ASC']]
        });
        
        callback({ success: true, messages });
      } catch (error) {
        console.error('Ошибка получения сообщений:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Поиск пользователей
    socket.on('search-users', async (data, callback) => {
      try {
        const { query } = data;
        
        const users = await User.findAll({
          where: {
            [Op.or]: [
              { username: { [Op.like]: `%${query}%` } },
              { email: { [Op.like]: `%${query}%` } }
            ],
            id: { [Op.ne]: socket.userId }
          },
          attributes: { exclude: ['password'] },
          limit: 20
        });
        
        callback({ success: true, users });
      } catch (error) {
        console.error('Ошибка поиска:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Обновить профиль
    socket.on('update-profile', async (data, callback) => {
      try {
        const { username, bio, phone, avatar } = data;
        
        await User.update(
          { username, bio, phone, avatar },
          { where: { id: socket.userId } }
        );
        
        const updatedUser = await User.findByPk(socket.userId, {
          attributes: { exclude: ['password'] }
        });
        
        callback({ success: true, user: updatedUser });
      } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        callback({ success: false, error: error.message });
      }
    });

    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log(`👤 Пользователь ${socket.userId} присоединился к чату ${chatId}`);
    });

    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      console.log(`👤 Пользователь ${socket.userId} покинул чат ${chatId}`);
    });

    socket.on('send-message', async (data) => {
      try {
        const message = await Message.create({
          chatId: data.chatId,
          senderId: socket.userId,
          content: data.content,
          type: data.type || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          replyToId: data.replyTo
        });
        
        const fullMessage = await Message.findByPk(message.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'avatar']
            }
          ]
        });
        
        await Chat.update(
          { updatedAt: new Date() },
          { where: { id: data.chatId } }
        );
        
        io.to(data.chatId).emit('new-message', fullMessage);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing', (data) => {
      socket.to(data.chatId).emit('user-typing', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('stop-typing', (data) => {
      socket.to(data.chatId).emit('user-stop-typing', {
        userId: socket.userId
      });
    });

    socket.on('disconnect', async () => {
      console.log('🔌 Пользователь отключен:', socket.userId);
      users.delete(socket.userId);
      
      await User.update(
        { status: 'offline', lastSeen: new Date() },
        { where: { id: socket.userId } }
      );
    });
  });
};

const jwt = require('jsonwebtoken');
const { User, Message, Chat } = require('../models');
const { filterUserData } = require('../utils/privacyFilter');

const users = new Map();

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error'));
      }
      
      socket.userId = user._id.toString();
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
    User.findByIdAndUpdate(socket.userId, { status: 'online' }).exec();

    // Получить список чатов
    socket.on('get-chats', async (callback) => {
      try {
        const chats = await Chat.find({
          participants: socket.userId
        }).populate('participants', 'username email avatar status')
          .sort({ updatedAt: -1 });

        const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
          const lastMessage = await Message.findOne({ chatId: chat._id })
            .sort({ createdAt: -1 })
            .populate('senderId', 'username');

          const otherParticipants = chat.participants.filter(
            p => p._id.toString() !== socket.userId
          );

          return {
            id: chat._id,
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

        callback({ success: true, chats: chatsWithDetails });
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
            adminId: socket.userId,
            participants: [...participants, socket.userId]
          });
          
          await chat.populate('participants', 'username email avatar');
          
          callback({ 
            success: true, 
            chat: {
              id: chat._id,
              name: chat.name,
              isGroup: chat.isGroup,
              participants: chat.participants
            }
          });
        } else {
          let chat = await Chat.findOne({
            isGroup: false,
            participants: { $all: [socket.userId, participantId] }
          }).populate('participants', 'username email avatar');
          
          if (!chat) {
            chat = await Chat.create({
              isGroup: false,
              participants: [socket.userId, participantId]
            });
            await chat.populate('participants', 'username email avatar');
          }
          
          const otherParticipants = chat.participants.filter(
            p => p._id.toString() !== socket.userId
          );
          
          callback({ 
            success: true, 
            chat: {
              id: chat._id,
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
        
        const messages = await Message.find({ chatId })
          .populate('senderId', 'username avatar')
          .populate('replyToId', 'content')
          .sort({ createdAt: 1 });
        
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
        
        const users = await User.find({
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ],
          _id: { $ne: socket.userId }
        }).select('-password').limit(20);
        
        // Фильтруем данные на основе настроек приватности
        const filteredUsers = users.map(user => filterUserData(user, socket.userId, false));
        
        callback({ success: true, users: filteredUsers });
      } catch (error) {
        console.error('Ошибка поиска:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Обновить профиль
    socket.on('update-profile', async (data, callback) => {
      try {
        const { username, bio, phone, avatar } = data;
        
        const updatedUser = await User.findByIdAndUpdate(
          socket.userId,
          { username, bio, phone, avatar },
          { new: true }
        ).select('-password');
        
        callback({ success: true, user: updatedUser });
      } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Обновить настройки приватности
    socket.on('update-privacy', async (data, callback) => {
      try {
        const { privacySettings } = data;
        
        const updatedUser = await User.findByIdAndUpdate(
          socket.userId,
          { privacySettings },
          { new: true }
        ).select('-password');
        
        callback({ success: true, user: updatedUser });
      } catch (error) {
        console.error('Ошибка обновления приватности:', error);
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
        
        const fullMessage = await Message.findById(message._id)
          .populate('senderId', 'username avatar');
        
        await Chat.findByIdAndUpdate(data.chatId, { updatedAt: new Date() });
        
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
      
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      });
    });
  });
};

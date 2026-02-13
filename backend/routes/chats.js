const express = require('express');
const router = express.Router();
const { Chat, User, Message, ChatParticipant } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.findAll({
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'username', 'email', 'avatar', 'status'],
          through: { attributes: [] },
          where: { id: req.user.id }
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

      const otherParticipants = allParticipants.filter(p => p.id !== req.user.id);

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

    res.json(chatsWithDetails.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { participantId, isGroup, name, participants } = req.body;
    
    if (isGroup) {
      const chat = await Chat.create({
        name,
        isGroup: true,
        adminId: req.user.id
      });
      
      await chat.addParticipants([...participants, req.user.id]);
      const allParticipants = await chat.getParticipants({
        attributes: ['id', 'username', 'email', 'avatar']
      });
      
      res.status(201).json({
        id: chat.id,
        name: chat.name,
        isGroup: chat.isGroup,
        participants: allParticipants
      });
    } else {
      let chat = await Chat.findOne({
        include: [{
          model: User,
          as: 'participants',
          where: { id: { [Op.in]: [req.user.id, participantId] } },
          through: { attributes: [] }
        }],
        where: { isGroup: false }
      });
      
      if (!chat) {
        chat = await Chat.create({ isGroup: false });
        await chat.addParticipants([req.user.id, participantId]);
      }
      
      const allParticipants = await chat.getParticipants({
        attributes: ['id', 'username', 'email', 'avatar']
      });
      const otherParticipants = allParticipants.filter(p => p.id !== req.user.id);
      
      res.status(201).json({
        id: chat.id,
        isGroup: chat.isGroup,
        participants: otherParticipants
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'participants',
        attributes: ['id', 'username', 'email', 'avatar']
      }]
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }
    
    const isParticipant = chat.participants.some(p => p.id === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

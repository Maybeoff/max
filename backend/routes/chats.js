const express = require('express');
const router = express.Router();
const { Chat, User, Message } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    }).populate('participants', 'username email avatar status')
      .sort({ updatedAt: -1 });

    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
      const lastMessage = await Message.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .populate('senderId', 'username');

      const otherParticipants = chat.participants.filter(
        p => p._id.toString() !== req.user._id.toString()
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

    res.json(chatsWithDetails);
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
        adminId: req.user._id,
        participants: [...participants, req.user._id]
      });
      
      await chat.populate('participants', 'username email avatar');
      
      res.status(201).json({
        id: chat._id,
        name: chat.name,
        isGroup: chat.isGroup,
        participants: chat.participants
      });
    } else {
      let chat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [req.user._id, participantId] }
      }).populate('participants', 'username email avatar');
      
      if (!chat) {
        chat = await Chat.create({
          isGroup: false,
          participants: [req.user._id, participantId]
        });
        await chat.populate('participants', 'username email avatar');
      }
      
      const otherParticipants = chat.participants.filter(
        p => p._id.toString() !== req.user._id.toString()
      );
      
      res.status(201).json({
        id: chat._id,
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
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'username email avatar');
    
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }
    
    const isParticipant = chat.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Message, User, MessageRead } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/:chatId', protect, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { chatId: req.params.chatId },
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
        },
        {
          model: MessageRead,
          as: 'reads',
          include: [{ model: User, attributes: ['id', 'username'] }]
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { chatId, content, type, fileUrl, fileName, fileSize, replyToId } = req.body;
    
    const message = await Message.create({
      chatId,
      senderId: req.user.id,
      content,
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      replyToId
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
    
    res.status(201).json(fullMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    await MessageRead.findOrCreate({
      where: {
        messageId: req.params.id,
        userId: req.user.id
      }
    });
    
    const message = await Message.findByPk(req.params.id, {
      include: [{ model: MessageRead, as: 'reads' }]
    });
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

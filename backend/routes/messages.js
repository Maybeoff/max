const express = require('express');
const router = express.Router();
const { Message, User } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/:chatId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('senderId', 'username avatar')
      .populate('replyToId', 'content')
      .sort({ createdAt: 1 });
    
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
      senderId: req.user._id,
      content,
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      replyToId
    });
    
    const fullMessage = await Message.findById(message._id)
      .populate('senderId', 'username avatar');
    
    res.status(201).json(fullMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    
    const alreadyRead = message.readBy.some(
      r => r.userId.toString() === req.user._id.toString()
    );
    
    if (!alreadyRead) {
      message.readBy.push({ userId: req.user._id });
      await message.save();
    }
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

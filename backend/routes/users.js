const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

router.put('/me', protect, async (req, res) => {
  try {
    const { username, bio, phone, avatar } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username, bio, phone, avatar },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).select('-password').limit(20);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

router.put('/me', protect, async (req, res) => {
  try {
    const { username, bio, phone, avatar } = req.body;
    await req.user.update({ username, bio, phone, avatar });
    
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ],
        id: { [Op.ne]: req.user.id }
      },
      attributes: { exclude: ['password'] },
      limit: 20
    });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

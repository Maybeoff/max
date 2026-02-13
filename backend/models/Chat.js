const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
    },
    type: {
      type: String,
      enum: ['TOKEN_CALLED', 'TOKEN_COMPLETED', 'QUEUE_PAUSED', 'QUEUE_CLOSED', 'GENERAL'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', NotificationSchema);

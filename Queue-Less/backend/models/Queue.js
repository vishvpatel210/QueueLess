const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true, // YYYY-MM-DD
    },
    status: {
      type: String,
      enum: ['OPEN', 'PAUSED', 'CLOSED'],
      default: 'CLOSED',
      index: true,
    },
    currentTokenNumber: {
      type: String,
      default: null,
    },
    currentTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null,
    },
    totalTokensIssued: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

QueueSchema.index({ branchId: 1, serviceId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Queue', QueueSchema);

const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      index: true,
    },
    tokenNumber: {
      type: String,
      required: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    forPersonName: {
      type: String,
      default: 'Myself',
    },
    forPersonPhone: {
      type: String,
      default: '',
    },
    displayToken: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        'WAITING',
        'CALLED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'SKIPPED',
        'NO_SHOW',
      ],
      default: 'WAITING',
      index: true,
    },
    checkInLocation: {
      coordinates: [Number],
      isCheckedIn: { type: Boolean, default: false },
    },
    checkInAt: { type: Date },
    estimatedWaitTimeMinutes: {
      type: Number,
      default: 0,
    },
    joinedAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    skippedAt: { type: Date },
    noShowAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

TokenSchema.index({ queueId: 1, status: 1, sequenceNumber: 1 });

module.exports = mongoose.model('Token', TokenSchema);

const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide service name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    estimatedDurationMinutes: {
      type: Number,
      required: true,
      default: 15,
    },
    price: {
      type: Number,
      default: 0,
    },
    maxQueueCapacity: {
      type: Number,
      default: 100,
    },
    prefix: {
      type: String,
      default: 'A',
      uppercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', ServiceSchema);

const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide branch name'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide branch address'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    operatingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
    },
    phone: {
      type: String,
      default: '',
    },
    qrCodeUrl: {
      type: String,
      default: '',
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

BranchSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Branch', BranchSchema);

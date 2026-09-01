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
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    landmark: {
      type: String,
      default: '',
      trim: true,
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
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
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

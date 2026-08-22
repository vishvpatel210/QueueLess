const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide business name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Please select category'],
      enum: [
        'Healthcare',
        'Salon & Spa',
        'Bank & Finance',
        'Retail',
        'Dining & Cafe',
        'Government Services',
        'Service Center',
        'Other',
      ],
      index: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Business', BusinessSchema);

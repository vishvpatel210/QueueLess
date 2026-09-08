const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/constants');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'SHOP_ADMIN', 'customer', 'admin'],
      default: 'CUSTOMER',
    },
    pushToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving & normalize role
UserSchema.pre('save', async function (next) {
  if (this.role === 'admin') this.role = 'SHOP_ADMIN';
  if (this.role === 'customer') this.role = 'CUSTOMER';

  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function () {
  const normalizedRole =
    this.role === 'admin' ? 'SHOP_ADMIN' : this.role === 'customer' ? 'CUSTOMER' : this.role;
  return jwt.sign({ id: this._id, role: normalizedRole }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

module.exports = mongoose.model('User', UserSchema);

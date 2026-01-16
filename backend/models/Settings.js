/**
 * Settings Model
 * MongoDB Schema for User Settings
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD']
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY'
  },
  notifications: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt timestamp
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);


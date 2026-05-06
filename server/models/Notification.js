const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  therapyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapy', default: null },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['pre-care', 'reminder', 'post-care', 'feedback', 'system'], default: 'system' },
  channels: [{ type: String, enum: ['in-app', 'email', 'sms'] }],
  readAt: { type: Date, default: null, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

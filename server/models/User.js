const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['patient', 'practitioner', 'admin'],
    default: 'patient',
  },
  specialization: [{ type: String }],
  notificationPreferences: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  phone: { type: String, default: '' },
  refreshTokenHash: { type: String, select: false },
  dosha: {
    type: String,
    enum: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha', null],
    default: null,
  },
  doshaScores: {
    vata: { type: Number, default: 0 },
    pitta: { type: Number, default: 0 },
    kapha: { type: Number, default: 0 },
  },
  lastTestDate: {
    type: Date,
    default: null,
  },
  healthGoals: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return user data without sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

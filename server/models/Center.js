const mongoose = require('mongoose');

const centerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  hours: { type: String, required: true },
  specialties: [{ type: String }],
  rating: { type: Number, min: 0, max: 5, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  therapiesOffered: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Center', centerSchema);

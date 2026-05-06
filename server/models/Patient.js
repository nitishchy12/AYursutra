const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, min: 0, max: 120, default: null },
  gender: { type: String, enum: ['Female', 'Male', 'Other', 'Prefer not to say', ''], default: '' },
  weight: { type: Number, min: 0, default: null },
  height: { type: Number, min: 0, default: null },
  prakriti: { type: String, enum: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridoshic', null], default: null },
  prakritiScores: {
    vata: { type: Number, default: 0 },
    pitta: { type: Number, default: 0 },
    kapha: { type: Number, default: 0 },
  },
  prakritiExplanation: { type: String, default: '' },
  medicalHistory: [{ type: String }],
  allergies: [{ type: String }],
  currentMedications: [{ type: String }],
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  milestones: [{ label: String, completedAt: Date }],
  aiHistory: [{
    question: String,
    answer: String,
    createdAt: { type: Date, default: Date.now },
  }],
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);

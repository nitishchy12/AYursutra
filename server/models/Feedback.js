const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapy', required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  overallRating: { type: Number, min: 1, max: 5, required: true },
  symptomImprovement: { type: Number, min: 1, max: 10, required: true },
  symptomSeverity: { type: Number, min: 1, max: 10, default: 5 },
  sideEffects: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

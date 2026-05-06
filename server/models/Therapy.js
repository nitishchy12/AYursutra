const mongoose = require('mongoose');

const therapyTypes = ['Abhyanga', 'Shirodhara', 'Basti', 'Nasya', 'Vamana', 'Virechana', 'Swedana', 'Udvartana'];

const therapySchema = new mongoose.Schema({
  therapyType: { type: String, enum: therapyTypes, required: true, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  practitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scheduledDate: { type: Date, required: true, index: true },
  duration: { type: Number, min: 15, max: 240, default: 60 },
  room: { type: String, default: 'Room 1' },
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled', index: true },
  preInstructions: [{ type: String }],
  postInstructions: [{ type: String }],
  sessionNotes: { type: String, default: '' },
  patientFeedback: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback', default: null },
  rating: { type: Number, min: 1, max: 5, default: null },
  mlRecommended: { type: Boolean, default: false },
  mlConfidenceScore: { type: Number, default: 0 },
  cancelReason: { type: String, default: '' },
  notificationFlags: {
    pre24h: { type: Boolean, default: false },
    pre2h: { type: Boolean, default: false },
    post1h: { type: Boolean, default: false },
    follow7d: { type: Boolean, default: false },
  },
}, { timestamps: true });

therapySchema.statics.types = therapyTypes;

module.exports = mongoose.model('Therapy', therapySchema);

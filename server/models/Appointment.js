const mongoose = require('mongoose');

const therapyTypes = ['Shirodhara', 'Panchakarma', 'Abhyanga', 'Nasya', 'Basti', 'Udvartana', 'Swedana', 'Vamana', 'Virechana'];

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  therapyType: { type: String, enum: therapyTypes, required: true },
  centerName: { type: String, default: '' },
  practitionerName: { type: String, default: 'AyurSutra Practitioner' },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  duration: { type: Number, default: 60 },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String, default: '' },
  preInstructions: [{ type: String }],
  postInstructions: [{ type: String }],
  reminderFlags: {
    pre24h: { type: Boolean, default: false },
    pre15m: { type: Boolean, default: false },
  },
}, { timestamps: true });

appointmentSchema.statics.therapyTypes = therapyTypes;

module.exports = mongoose.model('Appointment', appointmentSchema);

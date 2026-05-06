const Patient = require('../models/Patient');
const Therapy = require('../models/Therapy');
const Feedback = require('../models/Feedback');
const { askAdvisor } = require('../services/geminiService');

exports.ask = async (req, res) => {
  const patient = req.user.role === 'patient' ? await Patient.findOne({ userId: req.user._id }) : await Patient.findById(req.body.patientId);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found', code: 404 });
  const therapies = await Therapy.find({ patientId: patient._id }).sort('-scheduledDate').limit(5);
  const feedback = await Feedback.find({ patientId: patient._id }).sort('-createdAt').limit(5);
  const answer = await askAdvisor({ patient, therapies, feedback, message: req.body.message });
  patient.aiHistory.push({ question: req.body.message, answer });
  await patient.save();
  res.json({ success: true, message: 'Advisor answered', data: { answer, history: patient.aiHistory.slice(-10) } });
};

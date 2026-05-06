const Feedback = require('../models/Feedback');
const Therapy = require('../models/Therapy');

exports.createFeedback = async (req, res) => {
  const therapy = await Therapy.findById(req.body.sessionId);
  if (!therapy) return res.status(404).json({ success: false, message: 'Session not found', code: 404 });
  const feedback = await Feedback.create({ ...req.body, patientId: therapy.patientId });
  therapy.patientFeedback = feedback._id;
  therapy.rating = feedback.overallRating;
  therapy.status = 'completed';
  await therapy.save();
  res.status(201).json({ success: true, message: 'Feedback submitted', data: feedback });
};

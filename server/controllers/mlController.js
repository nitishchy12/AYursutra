const Patient = require('../models/Patient');
const Therapy = require('../models/Therapy');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { classifyPrakriti } = require('../ml/prakriti');
const { recommendTherapy } = require('../ml/recommendation');
const { predictProgress } = require('../ml/progress');
const { scoreSlots } = require('../ml/scheduling');
const { findAnomalies } = require('../ml/anomaly');
const { patientAnalytics } = require('../ml/analytics');

exports.prakriti = async (req, res) => {
  const result = await classifyPrakriti(req.body.answers || req.body);
  if (req.user?.role === 'patient') {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (patient) {
      patient.prakriti = result.prakriti;
      patient.prakritiScores = result.scores;
      patient.prakritiExplanation = result.explanation;
      await patient.save();
    }
  }
  res.json({ success: true, message: 'Prakriti classified', data: result });
};

exports.recommendTherapy = async (req, res) => {
  let profile = req.body;
  if (req.user?.role === 'patient') {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (patient) profile = { prakriti: patient.prakriti, medicalConditions: patient.medicalHistory, age: patient.age, gender: patient.gender, ...req.body };
  }
  res.json({ success: true, message: 'Therapies recommended', data: await recommendTherapy(profile) });
};

exports.predictProgress = async (req, res) => {
  const patientId = req.body.patientId || req.params.patientId;
  const feedback = await Feedback.find({ patientId }).sort('createdAt');
  const points = feedback.map((f, index) => ({ sessionNumber: index + 1, feedbackScore: f.symptomImprovement, symptomSeverity: f.symptomSeverity }));
  res.json({ success: true, message: 'Progress predicted', data: { points, prediction: await predictProgress(points) } });
};

exports.patientAnalytics = async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user._id });
  const [appointments, feedback] = await Promise.all([
    Appointment.find({ patient: req.user._id }).sort({ scheduledDate: 1 }).lean(),
    patient ? Feedback.find({ patientId: patient._id }).sort('createdAt').lean() : [],
  ]);
  const points = feedback.map((f, index) => ({ sessionNumber: index + 1, feedbackScore: f.symptomImprovement, symptomSeverity: f.symptomSeverity }));
  const profile = { prakriti: patient?.prakriti, medicalConditions: patient?.medicalHistory || [] };
  const recommendations = await recommendTherapy(profile);
  const analytics = await patientAnalytics({
    scores: patient?.prakritiScores || req.user.doshaScores || {},
    appointments,
    points,
    recommendations,
  });
  res.json({ success: true, message: 'Patient analytics loaded', data: analytics });
};

exports.optimalSlots = async (req, res) => {
  const practitioners = await User.find({ role: 'practitioner' }).select('name specialization');
  const day = req.body.date ? new Date(req.body.date) : new Date();
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(day); end.setHours(23, 59, 59, 999);
  const booked = await Therapy.find({ scheduledDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } });
  res.json({ success: true, message: 'Optimal slots ranked', data: await scoreSlots({ ...req.body, practitioners, booked }) });
};

exports.anomalies = async (req, res) => {
  const therapies = await Therapy.find({ patientId: req.params.patientId }).populate('patientFeedback');
  const rows = therapies.filter((t) => t.patientFeedback).map((t) => ({
    therapyId: t._id,
    therapyType: t.therapyType,
    symptomImprovement: t.patientFeedback.symptomImprovement,
    overallRating: t.patientFeedback.overallRating,
  }));
  res.json({ success: true, message: 'Anomalies loaded', data: await findAnomalies(rows) });
};

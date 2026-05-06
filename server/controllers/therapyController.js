const Therapy = require('../models/Therapy');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');

const defaults = {
  Abhyanga: { pre: ['Avoid heavy meals 2 hours before therapy'], post: ['Rest and drink warm water'] },
  Shirodhara: { pre: ['Wash hair before the visit if advised'], post: ['Avoid screens and strenuous work for 2 hours'] },
  Basti: { pre: ['Follow the diet plan shared by your practitioner'], post: ['Report cramping or discomfort promptly'] },
};

exports.listTherapies = async (req, res) => {
  const filter = {};
  if (req.query.patientId) filter.patientId = req.query.patientId;
  if (req.query.practitionerId) filter.practitionerId = req.query.practitionerId;
  if (req.user.role === 'practitioner') filter.practitionerId = req.user._id;
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ userId: req.user._id });
    filter.patientId = patient?._id || null;
  }
  if (req.query.from || req.query.to) filter.scheduledDate = { ...(req.query.from && { $gte: new Date(req.query.from) }), ...(req.query.to && { $lte: new Date(req.query.to) }) };
  const items = await Therapy.find(filter).populate('patientId', 'name prakriti').populate('practitionerId', 'name email').sort('scheduledDate');
  res.json({ success: true, message: 'Therapies loaded', data: items });
};

exports.createTherapy = async (req, res) => {
  const payload = { ...req.body, scheduledDate: new Date(req.body.scheduledDate) };
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ userId: req.user._id });
    payload.patientId = patient?._id;
  }
  const end = new Date(payload.scheduledDate.getTime() + (payload.duration || 60) * 60000);
  const conflict = await Therapy.findOne({
    practitionerId: payload.practitionerId,
    status: { $ne: 'cancelled' },
    scheduledDate: { $lt: end, $gte: new Date(payload.scheduledDate.getTime() - 240 * 60000) },
  });
  if (conflict) return res.status(409).json({ success: false, message: 'Practitioner is already booked near this time', code: 409 });
  const instruction = defaults[payload.therapyType] || { pre: ['Arrive 10 minutes early'], post: ['Follow practitioner care advice'] };
  const therapy = await Therapy.create({ ...payload, preInstructions: payload.preInstructions || instruction.pre, postInstructions: payload.postInstructions || instruction.post });
  const patient = await Patient.findById(therapy.patientId);
  if (patient) await sendNotification({ userId: patient.userId, therapyId: therapy._id, title: 'Therapy scheduled', message: `${therapy.therapyType} is booked for ${therapy.scheduledDate.toLocaleString()}.`, type: 'system', channels: ['in-app'] });
  res.status(201).json({ success: true, message: 'Therapy scheduled', data: therapy });
};

exports.updateTherapy = async (req, res) => {
  const therapy = await Therapy.findById(req.params.id);
  if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found', code: 404 });
  Object.assign(therapy, req.body, req.body.scheduledDate ? { scheduledDate: new Date(req.body.scheduledDate) } : {});
  await therapy.save();
  res.json({ success: true, message: 'Therapy updated', data: therapy });
};

exports.cancelTherapy = async (req, res) => {
  const therapy = await Therapy.findById(req.params.id);
  if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found', code: 404 });
  therapy.status = 'cancelled';
  therapy.cancelReason = req.body?.reason || 'Cancelled by user';
  await therapy.save();
  res.json({ success: true, message: 'Therapy cancelled', data: therapy });
};

exports.availability = async (req, res) => {
  const { practitionerId, date } = req.query;
  const day = date ? new Date(date) : new Date();
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(day); end.setHours(23, 59, 59, 999);
  const booked = await Therapy.find({ practitionerId, scheduledDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } });
  const occupied = new Set(booked.map((t) => t.scheduledDate.toISOString().slice(11, 16)));
  const slots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'].filter((slot) => !occupied.has(slot));
  res.json({ success: true, message: 'Availability loaded', data: slots });
};

exports.practitioners = async (req, res) => {
  const items = await User.find({ role: 'practitioner' }).select('name email specialization');
  res.json({ success: true, message: 'Practitioners loaded', data: items });
};

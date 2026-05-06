const Patient = require('../models/Patient');
const Therapy = require('../models/Therapy');
const Appointment = require('../models/Appointment');
const { getPatientForUser, getOrCreatePatientForUser } = require('../services/patientProfileService');

function normalizeGender(gender) {
  const value = String(gender || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'male') return 'Male';
  if (value === 'female') return 'Female';
  if (value === 'other') return 'Other';
  if (value === 'prefer not to say') return 'Prefer not to say';
  return gender;
}

function normalizePatientPayload(body) {
  const payload = { ...body };
  if (payload.gender !== undefined) payload.gender = normalizeGender(payload.gender);
  ['age', 'weight', 'height'].forEach((field) => {
    if (payload[field] === '') payload[field] = null;
    if (payload[field] !== undefined && payload[field] !== null) payload[field] = Number(payload[field]);
  });
  delete payload.userId;
  delete payload.deletedAt;
  return payload;
}

exports.listPatients = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const filter = { deletedAt: null };
  const [items, total] = await Promise.all([
    Patient.find(filter).skip((page - 1) * limit).limit(limit).sort('-createdAt'),
    Patient.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'Patients loaded', data: { items, total, page, pages: Math.ceil(total / limit) } });
};

exports.myProfile = async (req, res) => {
  const profile = req.user.role === 'patient' ? await getOrCreatePatientForUser(req.user) : null;
  res.json({ success: true, message: 'Patient profile loaded', data: profile });
};

exports.createPatient = async (req, res) => {
  const userId = req.user.role === 'patient' ? req.user._id : req.body.userId;
  const existing = await getPatientForUser(userId);
  if (existing) return res.status(409).json({ success: false, message: 'Patient profile already exists', code: 409 });
  const profile = await Patient.create({ ...req.body, userId });
  res.status(201).json({ success: true, message: 'Patient created', data: profile });
};

exports.getPatient = async (req, res) => {
  const profile = await Patient.findOne({ _id: req.params.id, deletedAt: null });
  if (!profile) return res.status(404).json({ success: false, message: 'Patient not found', code: 404 });
  if (req.user.role === 'patient' && String(profile.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Forbidden', code: 403 });
  const [therapies, appointments] = await Promise.all([
    Therapy.find({ patientId: profile._id }).populate('practitionerId', 'name email').sort('-scheduledDate'),
    Appointment.find({ patient: profile.userId }).sort('-scheduledDate'),
  ]);
  res.json({ success: true, message: 'Patient loaded', data: { profile, therapies, appointments } });
};

exports.updatePatient = async (req, res) => {
  const isMyProfile = req.params.id === 'me' || req.path === '/me' || !req.params.id;
  const profile = isMyProfile ? await getOrCreatePatientForUser(req.user) : await Patient.findById(req.params.id);
  if (!profile) return res.status(404).json({ success: false, message: 'Patient not found', code: 404 });
  if (req.user.role === 'patient' && String(profile.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Forbidden', code: 403 });
  Object.assign(profile, normalizePatientPayload(req.body));
  await profile.save();
  res.json({ success: true, message: 'Patient updated', data: profile });
};

exports.deletePatient = async (req, res) => {
  const profile = await Patient.findById(req.params.id);
  if (!profile) return res.status(404).json({ success: false, message: 'Patient not found', code: 404 });
  profile.deletedAt = new Date();
  await profile.save();
  res.json({ success: true, message: 'Patient deleted', data: null });
};

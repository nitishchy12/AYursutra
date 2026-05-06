const express = require('express');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyAppointmentBooked, notifyAppointmentCancelled } = require('../services/notificationService');

const router = express.Router();

const instructionMap = {
  Shirodhara: { pre: ['Avoid heavy meals 2 hours before', 'Come with clean, dry hair'], post: ['Rest for 1 hour after', 'Avoid cold water on head for 24 hours'] },
  Panchakarma: { pre: ['Follow the light diet advised by your practitioner', 'Avoid alcohol and late nights before therapy'], post: ['Rest and avoid strenuous work', 'Follow the prescribed post-cleanse diet'] },
  Abhyanga: { pre: ['Wear old comfortable clothes', 'Avoid eating 1 hour before'], post: ['Shower with warm water only', 'Avoid AC for 4 hours'] },
  Nasya: { pre: ['Avoid heavy meals before the session', 'Inform practitioner about sinus infection or fever'], post: ['Avoid cold drinks for 24 hours', 'Do not expose yourself to dust or smoke'] },
  Basti: { pre: ['Follow the preparation diet carefully', 'Arrive after bowel movement if possible'], post: ['Eat only when hungry', 'Report severe cramping immediately'] },
  Udvartana: { pre: ['Avoid applying lotion before therapy', 'Wear loose clothes'], post: ['Hydrate with warm water', 'Avoid cold shower immediately after'] },
  Swedana: { pre: ['Hydrate well before the session', 'Avoid heavy meals'], post: ['Rest until body temperature settles', 'Avoid cold exposure'] },
  Vamana: { pre: ['Follow practitioner-supervised preparation only', 'Avoid self-medication'], post: ['Follow samsarjana krama diet', 'Rest fully for the day'] },
  Virechana: { pre: ['Follow oleation and diet instructions', 'Keep the day free for rest'], post: ['Use light warm meals as advised', 'Avoid travel and exertion'] },
};

router.get('/my', protect, asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id }).sort({ scheduledDate: 1, scheduledTime: 1 });
  res.json({ success: true, data: appointments, appointments });
}));

router.get('/', protect, authorize('practitioner', 'admin'), asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const appointments = await Appointment.find(filter)
    .populate('patient', 'name email phone')
    .sort({ scheduledDate: 1, scheduledTime: 1 });
  res.json({ success: true, data: appointments, appointments });
}));

router.post('/', protect, authorize('patient'), asyncHandler(async (req, res) => {
  const { therapyType, centerName = '', scheduledDate, scheduledTime, notes = '' } = req.body;
  if (!Appointment.therapyTypes.includes(therapyType)) return res.status(400).json({ success: false, message: 'Invalid therapy type' });
  if (!scheduledDate || !scheduledTime) return res.status(400).json({ success: false, message: 'Date and time are required' });
  const instructions = instructionMap[therapyType] || instructionMap.Panchakarma;
  const appointment = await Appointment.create({
    patient: req.user._id,
    therapyType,
    centerName,
    scheduledDate: new Date(scheduledDate),
    scheduledTime,
    notes,
    duration: therapyType === 'Panchakarma' ? 120 : 60,
    preInstructions: instructions.pre,
    postInstructions: instructions.post,
  });
  await notifyAppointmentBooked({ userId: req.user._id, appointment });
  res.status(201).json({ success: true, data: appointment, appointment });
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  res.json({ success: true, data: appointment, appointment });
}));

router.put('/:id/cancel', protect, asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === 'patient') filter.patient = req.user._id;
  if (!['patient', 'practitioner', 'admin'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
  const appointment = await Appointment.findOne(filter);
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  appointment.status = 'cancelled';
  await appointment.save();
  await notifyAppointmentCancelled({ userId: appointment.patient, appointment });
  res.json({ success: true, data: appointment, appointment });
}));

router.put('/:id/approve', protect, authorize('practitioner', 'admin'), asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  if (appointment.status === 'cancelled') return res.status(400).json({ success: false, message: 'Cancelled appointment cannot be approved' });
  appointment.status = 'confirmed';
  appointment.practitionerName = req.user.name || appointment.practitionerName;
  await appointment.save();
  res.json({ success: true, message: 'Appointment approved', data: appointment, appointment });
}));

module.exports = router;

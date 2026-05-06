const User = require('../models/User');
const Patient = require('../models/Patient');
const Therapy = require('../models/Therapy');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { adminAnalytics } = require('../ml/analytics');

exports.overview = async (req, res) => {
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const [patients, practitioners, sessionsThisMonth, notifications, therapies, appointments] = await Promise.all([
    Patient.countDocuments({ deletedAt: null }),
    User.countDocuments({ role: 'practitioner' }),
    Appointment.countDocuments({ scheduledDate: { $gte: monthStart }, status: { $ne: 'cancelled' } }),
    Notification.find().sort('-createdAt').limit(20),
    Therapy.find({ scheduledDate: { $gte: monthStart } }),
    Appointment.find().sort('scheduledDate').lean(),
  ]);
  const revenue = therapies.reduce((map, t) => {
    map[t.therapyType] = (map[t.therapyType] || 0) + 1800;
    return map;
  }, {});
  const analytics = await adminAnalytics({ appointments, therapies });
  res.json({ success: true, message: 'Admin overview loaded', data: { patients, practitioners, sessionsThisMonth, notifications, revenue, analytics } });
};

exports.users = async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.json({ success: true, message: 'Users loaded', data: users });
};

exports.updateUserRole = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  res.json({ success: true, message: 'Role updated', data: user });
};

const Notification = require('../models/Notification');

exports.listNotifications = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 50);
  const filter = { userId: req.user._id };
  if (req.query.filter === 'unread') filter.readAt = null;
  if (req.query.filter === 'read') filter.readAt = { $ne: null };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ readAt: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, readAt: null }),
  ]);
  res.json({ success: true, message: 'Notifications loaded', data: { items, total, unread } });
};

exports.markRead = async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { readAt: new Date() }, { new: true });
  res.json({ success: true, message: 'Notification marked read', data: item });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, readAt: null }, { readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked read', data: null });
};

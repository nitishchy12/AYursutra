const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const allowedDoshas = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha'];

router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toJSON(), user: req.user.toJSON() });
}));

router.put('/dosha', protect, asyncHandler(async (req, res) => {
  const { dosha, doshaScores } = req.body;
  if (!allowedDoshas.includes(dosha)) {
    return res.status(400).json({ success: false, message: 'Invalid dosha value' });
  }
  if (!doshaScores || ['vata', 'pitta', 'kapha'].some((key) => Number.isNaN(Number(doshaScores[key])))) {
    return res.status(400).json({ success: false, message: 'doshaScores must include vata, pitta, and kapha numbers' });
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        dosha,
        doshaScores: {
          vata: Number(doshaScores.vata),
          pitta: Number(doshaScores.pitta),
          kapha: Number(doshaScores.kapha),
        },
        lastTestDate: new Date(),
      },
    },
    { new: true, runValidators: true },
  );
  res.json({ success: true, data: updatedUser.toJSON(), user: updatedUser.toJSON() });
}));

router.put('/profile', protect, asyncHandler(async (req, res) => {
  const allowed = ['name', 'age', 'gender', 'phone', 'healthGoals'];
  const update = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) update[field] = field === 'age' && req.body[field] !== '' ? Number(req.body[field]) : req.body[field];
  });
  const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true, runValidators: true });
  res.json({ success: true, data: updatedUser.toJSON(), user: updatedUser.toJSON() });
}));

module.exports = router;

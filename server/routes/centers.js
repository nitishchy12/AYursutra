const express = require('express');
const Center = require('../models/Center');
const { seedCenters } = require('../scripts/seedCenters');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.city) filter.city = new RegExp(`^${String(req.query.city)}$`, 'i');
  if (req.query.specialty) filter.specialties = new RegExp(String(req.query.specialty), 'i');
  const centers = await Center.find(filter).sort('city name').lean();
  res.json({ success: true, data: centers, centers });
}));

router.post('/seed', authorize('admin'), asyncHandler(async (req, res) => {
  const result = await seedCenters();
  const centers = await Center.find().sort('city name').lean();
  res.status(201).json({ success: true, message: `Seeded ${result.count} centers`, data: centers, centers });
}));

module.exports = router;

const express = require('express');
const Herb = require('../models/Herb');
const { seedHerbs } = require('../scripts/seedHerbs');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
  const filter = {};
  if (req.query.search) {
    const search = new RegExp(String(req.query.search).trim(), 'i');
    filter.$or = [{ name: search }, { scientificName: search }, { description: search }, { benefits: search }, { tags: search }];
  }
  if (req.query.dosha && ['Vata', 'Pitta', 'Kapha'].includes(req.query.dosha)) {
    filter[`doshaBalance.${req.query.dosha.toLowerCase()}`] = true;
  }
  if (req.query.category) filter.category = new RegExp(String(req.query.category), 'i');
  const [herbs, total] = await Promise.all([
    Herb.find(filter).sort('name').skip((page - 1) * limit).limit(limit).lean(),
    Herb.countDocuments(filter),
  ]);
  const data = herbs.map((herb) => ({
    ...herb,
    id: String(herb._id),
    image: herb.image || herb.imageUrl,
    usageMethod: herb.usageMethod || herb.usage,
    recommendedFor: herb.recommendedFor?.length ? herb.recommendedFor : ['Vata', 'Pitta', 'Kapha'].filter((dosha) => herb.doshaBalance?.[dosha.toLowerCase()]),
  }));
  res.json({ success: true, data, herbs: data, total, page, limit });
}));

router.post('/seed', authorize('admin'), asyncHandler(async (req, res) => {
  const result = await seedHerbs();
  const herbs = await Herb.find().sort('name').lean();
  res.status(201).json({ success: true, message: `Seeded ${result.count} herbs`, data: herbs, herbs, total: herbs.length });
}));

module.exports = router;

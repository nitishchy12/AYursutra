const express = require('express');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const controller = require('../controllers/mlController');

const router = express.Router();
router.use(auth);
router.post('/prakriti', asyncHandler(controller.prakriti));
router.get('/patient-analytics', asyncHandler(controller.patientAnalytics));
router.post('/recommend-therapy', asyncHandler(controller.recommendTherapy));
router.post('/predict-progress', asyncHandler(controller.predictProgress));
router.post('/optimal-slots', asyncHandler(controller.optimalSlots));
router.get('/anomalies/:patientId', asyncHandler(controller.anomalies));

module.exports = router;

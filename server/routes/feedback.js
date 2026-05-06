const express = require('express');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const controller = require('../controllers/feedbackController');

const router = express.Router();
router.use(auth);
router.post('/', asyncHandler(controller.createFeedback));

module.exports = router;

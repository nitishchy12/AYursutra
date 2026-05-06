const express = require('express');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const controller = require('../controllers/advisorController');

const router = express.Router();
router.use(auth);
router.post('/chat', asyncHandler(controller.ask));

module.exports = router;

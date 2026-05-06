const express = require('express');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const controller = require('../controllers/notificationController');

const router = express.Router();
router.use(auth);
router.get('/', asyncHandler(controller.listNotifications));
router.put('/read-all', asyncHandler(controller.markAllRead));
router.put('/:id/read', asyncHandler(controller.markRead));

module.exports = router;

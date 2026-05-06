const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const controller = require('../controllers/adminController');

const router = express.Router();
router.use(auth, authorize('admin'));
router.get('/overview', asyncHandler(controller.overview));
router.get('/users', asyncHandler(controller.users));
router.put('/users/:id/role', asyncHandler(controller.updateUserRole));

module.exports = router;

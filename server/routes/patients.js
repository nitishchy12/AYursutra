const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const controller = require('../controllers/patientController');

const router = express.Router();
router.use(auth);
router.get('/me', asyncHandler(controller.myProfile));
router.put('/me', asyncHandler(controller.updatePatient));
router.get('/', authorize('admin', 'practitioner'), asyncHandler(controller.listPatients));
router.post('/', asyncHandler(controller.createPatient));
router.get('/:id', asyncHandler(controller.getPatient));
router.put('/:id', asyncHandler(controller.updatePatient));
router.delete('/:id', authorize('admin'), asyncHandler(controller.deletePatient));

module.exports = router;

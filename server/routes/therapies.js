const express = require('express');
const { auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const controller = require('../controllers/therapyController');

const router = express.Router();
router.use(auth);
router.get('/practitioners', asyncHandler(controller.practitioners));
router.get('/availability', asyncHandler(controller.availability));
router.get('/', asyncHandler(controller.listTherapies));
router.post('/', asyncHandler(controller.createTherapy));
router.put('/:id', asyncHandler(controller.updateTherapy));
router.delete('/:id', asyncHandler(controller.cancelTherapy));

module.exports = router;

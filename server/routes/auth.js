const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const roles = ['patient', 'practitioner', 'admin'];

router.post('/register', validate(Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...roles).default('patient'),
  phone: Joi.string().allow('').optional(),
  specialization: Joi.array().items(Joi.string()).optional(),
})), asyncHandler(controller.register));
router.post('/login', validate(Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() })), asyncHandler(controller.login));
router.post('/refresh', asyncHandler(controller.refresh));
router.post('/logout', asyncHandler(controller.logout));
router.get('/me', auth, asyncHandler(controller.me));

module.exports = router;

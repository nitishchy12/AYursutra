const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { signAccessToken, signRefreshToken } = require('../middleware/auth');

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

async function persistRefresh(user, refreshToken) {
  user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save();
}

function authPayload(user, accessToken) {
  return { success: true, message: 'Authenticated', data: { accessToken, user: user.toJSON() }, accessToken, user: user.toJSON() };
}

exports.register = async (req, res) => {
  const { name, email, password, role = 'patient', phone = '', specialization = [] } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ success: false, message: 'An account with this email already exists', code: 409 });
  const user = await User.create({ name, email, password, role, phone, specialization });
  if (role === 'patient') await Patient.create({ userId: user._id, name, age: user.age, gender: user.gender });
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefresh(user, refreshToken);
  res.cookie('refreshToken', refreshToken, cookieOptions()).status(201).json(authPayload(user, accessToken));
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshTokenHash');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password', code: 401 });
  }
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefresh(user, refreshToken);
  res.cookie('refreshToken', refreshToken, cookieOptions()).json(authPayload(user, accessToken));
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token missing', code: 401 });
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
  const user = await User.findById(decoded.id).select('+refreshTokenHash');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  if (!user || user.refreshTokenHash !== hash) return res.status(401).json({ success: false, message: 'Refresh token invalid', code: 401 });
  const accessToken = signAccessToken(user);
  res.json(authPayload(user, accessToken));
};

exports.logout = async (req, res) => {
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    await req.user.save();
  }
  res.clearCookie('refreshToken', cookieOptions()).json({ success: true, message: 'Logged out', data: null });
};

exports.me = async (req, res) => {
  res.json({ success: true, message: 'Profile loaded', data: { user: req.user.toJSON() }, user: req.user.toJSON() });
};

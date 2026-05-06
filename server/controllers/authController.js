const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { signAccessToken, signRefreshToken } = require('../middleware/auth');

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function authPayload(user, accessToken) {
  return {
    success: true,
    message: 'Authenticated successfully',
    data: {
      user: user.toJSON(),
      accessToken,
    },
  };
}

async function persistRefresh(user, refreshToken) {
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await user.save({ validateBeforeSave: false });
}

exports.register = async (req, res) => {
  let { name, email, password, role = 'patient', phone = '', specialization = [] } = req.body;

  const validRoles = ['patient', 'practitioner', 'admin'];
  if (!validRoles.includes(role)) {
    role = 'patient';
  }

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
    return res.status(401).json({ success: false, message: 'Invalid email or password', code: 401, data: null });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefresh(user, refreshToken);

  res.cookie('refreshToken', refreshToken, cookieOptions()).json(authPayload(user, accessToken));
};

exports.refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required', code: 401, data: null });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', code: 401, data: null });
  }

  const user = await User.findById(decoded.id).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token', code: 401, data: null });
  }

  const accessToken = signAccessToken(user);
  const nextRefreshToken = signRefreshToken(user);
  await persistRefresh(user, nextRefreshToken);

  res.cookie('refreshToken', nextRefreshToken, cookieOptions()).json(authPayload(user, accessToken));
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
      await User.findByIdAndUpdate(decoded.id, { $unset: { refreshTokenHash: 1 } });
    } catch {
      // Clearing the browser cookie is enough if the token is already invalid.
    }
  }

  res.clearCookie('refreshToken', cookieOptions()).json({ success: true, message: 'Logged out successfully', data: null });
};

exports.me = async (req, res) => {
  res.json({
    success: true,
    message: 'Current user fetched successfully',
    data: {
      user: req.user.toJSON(),
    },
  });
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev-access-secret', { expiresIn: ACCESS_EXPIRES });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id, tokenVersion: user.updatedAt?.getTime?.() || Date.now() }, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret', { expiresIn: REFRESH_EXPIRES });
}

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required', code: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-access-secret');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists', code: 401 });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 401 });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-access-secret');
    req.user = await User.findById(decoded.id);
  } catch {}
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission for this action', code: 403 });
    }
    next();
  };
}

module.exports = { auth, protect: auth, optionalAuth, authorize, signAccessToken, signRefreshToken };

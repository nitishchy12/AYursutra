function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function errorHandler(err, req, res, next) {
  const code = err.status || err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const message = err.message || 'Internal server error';
  if (code >= 500) console.error('API error:', err);
  res.status(code).json({ success: false, message, code, data: null });
}

module.exports = { asyncHandler, errorHandler };

const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Map PostgreSQL constraint error codes cleanly
  if (err && err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'A record with these unique details already exists.',
    });
  }
  if (err && err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist or is in use.',
    });
  }
  if (err && err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Input violates database validation rules.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error. Please try again later.'
      : err.message || 'An unexpected error occurred.';

  if (statusCode >= 500) {
    console.error('[Wash n\' Dash API Error]:', err);
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

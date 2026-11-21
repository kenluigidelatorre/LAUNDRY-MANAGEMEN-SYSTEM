const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { query } = require('../config/db');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next(new AppError('Authentication token missing.', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch {
      return next(new AppError('Session expired or invalid token. Please log in again.', 401));
    }

    const { rows } = await query(
      `SELECT u.id, u.full_name, u.email, u.contact_number, u.role, u.customer_id, u.status, u.shift, u.date_registered,
              c.address AS customer_address
       FROM staff_users u
       LEFT JOIN customers c ON c.id = u.customer_id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return next(new AppError('User account no longer exists.', 401));
    }

    const userRow = rows[0];
    if (userRow.status !== 'Active') {
      return next(new AppError('Account is deactivated. Contact an administrator.', 403));
    }

    req.user = {
      id: userRow.id,
      name: userRow.full_name,
      email: userRow.email,
      contactNumber: userRow.contact_number,
      role: userRow.role,
      customerId: userRow.customer_id || null,
      address: userRow.customer_address || '',
      status: userRow.status,
      shift: userRow.shift,
      dateRegistered: userRow.date_registered,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('Access denied. You do not have permission for this resource.', 403)
      );
    }
    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};

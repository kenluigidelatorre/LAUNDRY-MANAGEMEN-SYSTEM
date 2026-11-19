const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const authRepository = require('../repositories/authRepository');
const { getInitials } = require('../utils/laundryRules');

function formatAuthUser(row) {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    contactNumber: row.contact_number,
    avatarInitials: getInitials(row.full_name),
    status: row.status,
    shift: row.shift,
    dateRegistered:
      row.date_registered instanceof Date
        ? row.date_registered.toISOString().slice(0, 10)
        : String(row.date_registered).slice(0, 10),
  };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const matched = await authRepository.findByEmail(email);

    if (!matched) {
      return next(
        new AppError("No Wash n' Dash account found with that email address.", 401)
      );
    }
    if (matched.status !== 'Active') {
      return next(
        new AppError(
          'This account is currently deactivated. Contact an administrator.',
          403
        )
      );
    }

    const validPassword = await bcrypt.compare(password, matched.password_hash);
    if (!validPassword) {
      return next(new AppError('Incorrect password. Please try again.', 401));
    }

    const user = formatAuthUser(matched);
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const createdRow = await authRepository.registerStaffUser({
      fullName: req.body.fullName,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      password: req.body.password,
      shift: req.body.shift,
    });

    const user = formatAuthUser(createdRow);
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const row = await authRepository.findByEmail(req.user.email);
    if (!row) {
      return next(new AppError('Authenticated user not found.', 404));
    }
    return res.json({
      success: true,
      user: formatAuthUser(row),
    });
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const updated = await authRepository.updateCurrentProfile(req.user.id, {
      fullName: req.body.fullName,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      shift: req.body.shift,
    });
    if (!updated) {
      return next(new AppError('Unable to update profile.', 404));
    }
    return res.json({
      success: true,
      user: formatAuthUser(updated),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  login,
  register,
  me,
  updateProfile,
};

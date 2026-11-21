
const AppError = require('../utils/AppError');

function requireFields(body, fields) {
  for (const field of fields) {
    const val = body[field];
    if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
      throw new AppError(`Missing required field: ${field}`, 400);
    }
  }
}

function validateLogin(req, res, next) {
  try {
    requireFields(req.body, ['email', 'password']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email).trim())) {
      throw new AppError('Please provide a valid email address.', 400);
    }
    next();
  } catch (err) {
    next(err);
  }
}

function validateRegister(req, res, next) {
  try {
    requireFields(req.body, ['fullName', 'email', 'password']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email).trim())) {
      throw new AppError('Please provide a valid Gmail or email address.', 400);
    }
    if (String(req.body.password).length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }
    next();
  } catch (err) {
    next(err);
  }
}

function validateCreateOrder(req, res, next) {
  try {
    const required =
      req.user && req.user.role === 'CUSTOMER'
        ? ['expectedCompletionDate']
        : ['customerId', 'expectedCompletionDate'];
    requireFields(req.body, required);

    const { services, initialPayment, additionalCharges, discount, paymentMethod } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      throw new AppError('At least one laundry service must be selected.', 400);
    }

    for (const item of services) {
      if (
        !item.serviceId ||
        !Number.isFinite(Number(item.weightKg)) ||
        Number(item.weightKg) <= 0
      ) {
        throw new AppError(
          'Each selected service must include a valid serviceId and weightKg > 0.',
          400
        );
      }
    }

    const numericValues = [additionalCharges, discount, initialPayment];

    if (
      numericValues.some(
        value => !Number.isFinite(Number(value ?? 0)) || Number(value ?? 0) < 0
      )
    ) {
      throw new AppError(
        'Charges, discount, and initial payment must be valid non-negative numbers.',
        400
      );
    }

    if (paymentMethod && !['Cash', 'GCash', 'Maya'].includes(paymentMethod)) {
      throw new AppError('Payment method must be Cash, GCash, or Maya.', 400);
    }

    next();
  } catch (err) {
    next(err);
  }
}

function validateUpdateOrder(req, res, next) {
  try {
    requireFields(req.body, ['assignedStaffId', 'expectedCompletionDate']);

    const { services, additionalCharges, discount } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      throw new AppError('At least one laundry service must be selected.', 400);
    }

    for (const item of services) {
      if (
        !item.serviceId ||
        !Number.isFinite(Number(item.weightKg)) ||
        Number(item.weightKg) <= 0
      ) {
        throw new AppError(
          'Each selected service must include a valid serviceId and weightKg > 0.',
          400
        );
      }
    }

    const numericValues = [additionalCharges, discount];

    if (
      numericValues.some(
        value => !Number.isFinite(Number(value ?? 0)) || Number(value ?? 0) < 0
      )
    ) {
      throw new AppError(
        'Charges and discount must be valid non-negative numbers.',
        400
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

function validateCustomer(req, res, next) {
  try {
    requireFields(req.body, ['fullName', 'contactNumber', 'address']);
    next();
  } catch (err) {
    next(err);
  }
}

function validateService(req, res, next) {
  try {
    requireFields(req.body, ['name', 'description', 'estimatedTime']);

    const price = Number(req.body.pricePerKg);

    if (!Number.isFinite(price) || price <= 0) {
      throw new AppError('Price per kilogram must be greater than ₱0.00.', 400);
    }

    next();
  } catch (err) {
    next(err);
  }
}

function validateStaff(req, res, next) {
  try {
    requireFields(req.body, ['fullName', 'email', 'contactNumber']);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email).trim())) {
      throw new AppError('Please provide a valid email address.', 400);
    }

    next();
  } catch (err) {
    next(err);
  }
}

function validatePayment(req, res, next) {
  try {
    requireFields(req.body, ['orderId', 'method']);

    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError('Payment amount must be greater than ₱0.00.', 400);
    }

    if (!['Cash', 'GCash', 'Maya'].includes(req.body.method)) {
      throw new AppError('Payment method must be Cash, GCash, or Maya.', 400);
    }

    next();
  } catch (err) {
    next(err);
  }
}

function validateInventory(req, res, next) {
  try {
    requireFields(req.body, ['name', 'category', 'unit']);

    const quantity = Number(req.body.quantity);
    const minThreshold = Number(req.body.minThreshold);

    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new AppError('Quantity must be a valid non-negative number.', 400);
    }

    if (!Number.isFinite(minThreshold) || minThreshold < 1) {
      throw new AppError('Minimum threshold must be a valid number of at least 1.', 400);
    }

    next();
  } catch (err) {
    next(err);
  }
}

function validateChangePassword(req, res, next) {
  try {
    requireFields(req.body, ['currentPassword', 'newPassword']);
    if (String(req.body.newPassword).length < 6) {
      throw new AppError('New password must be at least 6 characters long.', 400);
    }
    if (req.body.currentPassword === req.body.newPassword) {
      throw new AppError('New password must be different from your current password.', 400);
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateLogin,
  validateRegister,
  validateChangePassword,
  validateCreateOrder,
  validateUpdateOrder,
  validateCustomer,
  validateService,
  validateStaff,
  validatePayment,
  validateInventory,
};

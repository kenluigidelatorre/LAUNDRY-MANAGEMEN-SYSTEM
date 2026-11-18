
import { describe, it, expect } from 'vitest';

const {
  validateLogin,
  validateService,
} = require('../src/validators/requestValidators');

function runValidator(validator, body) {
  const req = { body };
  const res = {};
  let receivedError;

  validator(req, res, (err) => {
    receivedError = err;
  });

  return receivedError;
}

describe('Backend Request Validator Tests', () => {
  it('B-T1: should accept valid login information', () => {
    const error = runValidator(validateLogin, {
      email: 'admin@gmail.com',
      password: 'admin123',
    });

    expect(error).toBeUndefined();
  });

  it('B-T2: should reject an invalid email address', () => {
    const error = runValidator(validateLogin, {
      email: 'invalid-email',
      password: 'admin123',
    });

    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });

  it('B-T4: should accept valid laundry service information', () => {
    const error = runValidator(validateService, {
      name: 'Wash and Dry',
      description: 'Regular laundry service',
      estimatedTime: '24 hours',
      pricePerKg: 35,
    });

    expect(error).toBeUndefined();
  });

  it('B-T5: should reject a service with zero price', () => {
    const error = runValidator(validateService, {
      name: 'Wash and Dry',
      description: 'Regular laundry service',
      estimatedTime: '24 hours',
      pricePerKg: 0,
    });

    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });
});

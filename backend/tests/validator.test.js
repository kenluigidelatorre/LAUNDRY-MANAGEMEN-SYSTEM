
import { describe, it, expect } from 'vitest';

const {
  validateLogin,
  validateService,
  validateCreateOrder,
  validateUpdateOrder,
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

  it('B-T6: should accept valid order information', () => {
    const error = runValidator(validateCreateOrder, {
      customerId: 'CUS-001',
      expectedCompletionDate: '2026-11-20',
      services: [
        {
          serviceId: 'SRV-001',
          weightKg: 5,
        },
      ],
      additionalCharges: 10,
      discount: 5,
      initialPayment: 50,
    });

    expect(error).toBeUndefined();
  });

  it('B-T7: should reject non-numeric additional charges', () => {
    const error = runValidator(validateCreateOrder, {
      customerId: 'CUS-001',
      expectedCompletionDate: '2026-11-20',
      services: [
        {
          serviceId: 'SRV-001',
          weightKg: 5,
        },
      ],
      additionalCharges: 'invalid',
      discount: 0,
      initialPayment: 0,
    });

    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });

  it('B-T8: should reject non-numeric initial payment', () => {
    const error = runValidator(validateCreateOrder, {
      customerId: 'CUS-001',
      expectedCompletionDate: '2026-11-20',
      services: [
        {
          serviceId: 'SRV-001',
          weightKg: 5,
        },
      ],
      additionalCharges: 0,
      discount: 0,
      initialPayment: 'invalid',
    });

    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });

  it('B-T9: should reject non-numeric discount when updating an order', () => {
    const error = runValidator(validateUpdateOrder, {
      assignedStaffId: 'STF-001',
      expectedCompletionDate: '2026-11-20',
      services: [
        {
          serviceId: 'SRV-001',
          weightKg: 5,
        },
      ],
      additionalCharges: 0,
      discount: 'invalid',
    });

    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });
});

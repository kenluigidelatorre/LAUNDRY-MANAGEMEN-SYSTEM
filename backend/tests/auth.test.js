
import { describe, it, expect, vi, beforeEach } from 'vitest';

const bcrypt = require('bcryptjs');
const authRepository = require('../src/repositories/authRepository');
const authController = require('../src/controllers/authController');

describe('Authentication Controller', () => {
  let user;
  let req;
  let res;
  let next;
  let findByEmailSpy;

  beforeEach(async () => {
    vi.restoreAllMocks();

    findByEmailSpy = vi.spyOn(authRepository, 'findByEmail');

    user = {
      id: 'STF-001',
      full_name: 'Test Staff',
      email: 'staff@example.com',
      password_hash: await bcrypt.hash('password123', 10),
      contact_number: '09123456789',
      role: 'STAFF',
      status: 'Active',
      shift: 'Morning Shift (7:00 AM – 3:00 PM)',
      date_registered: new Date('2026-01-01'),
    };

    req = {
      body: {},
      user: {
        id: 'STF-001',
        email: 'staff@example.com',
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  it('logs in an active user with a correct password', async () => {
    req.body = {
      email: 'staff@example.com',
      password: 'password123',
    };

    findByEmailSpy.mockResolvedValue(user);

    await authController.login(req, res, next);

    expect(findByEmailSpy).toHaveBeenCalledWith('staff@example.com');

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        token: expect.any(String),
        user: expect.objectContaining({
          id: 'STF-001',
          email: 'staff@example.com',
          role: 'STAFF',
        }),
      })
    );

    expect(next).not.toHaveBeenCalled();
  });

  it('rejects login when the account does not exist', async () => {
    req.body = {
      email: 'unknown@example.com',
      password: 'password123',
    };

    findByEmailSpy.mockResolvedValue(null);

    await authController.login(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('rejects login when the password is incorrect', async () => {
    req.body = {
      email: 'staff@example.com',
      password: 'wrongpassword',
    };

    findByEmailSpy.mockResolvedValue(user);

    await authController.login(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('rejects login when the account is inactive', async () => {
    req.body = {
      email: 'staff@example.com',
      password: 'password123',
    };

    findByEmailSpy.mockResolvedValue({
      ...user,
      status: 'Inactive',
    });

    await authController.login(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('returns the authenticated user profile', async () => {
    findByEmailSpy.mockResolvedValue(user);

    await authController.me(req, res, next);

    expect(findByEmailSpy).toHaveBeenCalledWith('staff@example.com');

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: expect.objectContaining({
        id: 'STF-001',
        email: 'staff@example.com',
        role: 'STAFF',
      }),
    });

    expect(next).not.toHaveBeenCalled();
  });
});

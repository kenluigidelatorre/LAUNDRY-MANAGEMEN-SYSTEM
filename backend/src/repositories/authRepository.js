const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');

async function findByEmail(email) {
  const { rows } = await query(
    `SELECT id, full_name, email, password_hash, contact_number, role, status, shift, date_registered
     FROM staff_users
     WHERE LOWER(email) = LOWER($1)`,
    [email.trim()]
  );
  return rows[0] || null;
}

async function registerStaffUser(data) {
  return withTransaction(async (client) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await client.query(
      `SELECT id FROM staff_users WHERE LOWER(email) = LOWER($1)`,
      [cleanEmail]
    );
    if (existing.rows.length > 0) {
      throw new AppError(
        'An account with that email address already exists. Please sign in instead.',
        409
      );
    }

    const { rows: maxRows } = await client.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 6) AS max_num FROM staff_users`
    );
    const nextId = `STF-${String(Number(maxRows[0].max_num) + 1).padStart(3, '0')}`;
    const passwordHash = await bcrypt.hash(data.password, 10);
    const fullName = data.fullName.trim();
    const contactNumber = (data.contactNumber || '').trim() || 'Not provided';
    const shift = data.shift?.trim() || 'Morning Shift (7:00 AM - 3:00 PM)';

    const { rows } = await client.query(
      `INSERT INTO staff_users (id, full_name, email, password_hash, contact_number, role, status, shift)
       VALUES ($1, $2, $3, $4, $5, 'STAFF', 'Active', $6)
       RETURNING id, full_name, email, contact_number, role, status, shift, date_registered`,
      [nextId, fullName, cleanEmail, passwordHash, contactNumber, shift]
    );

    return rows[0];
  });
}

async function updateCurrentProfile(userId, patch) {
  return withTransaction(async (client) => {
    const cleanEmail = patch.email?.trim().toLowerCase() || null;

    if (cleanEmail) {
      const existing = await client.query(
        `SELECT id FROM staff_users
         WHERE LOWER(email) = LOWER($1) AND id <> $2`,
        [cleanEmail, userId]
      );

      if (existing.rows.length > 0) {
        throw new AppError('This email address is already being used.', 409);
      }
    }

    const { rows } = await client.query(
      `UPDATE staff_users
       SET full_name = COALESCE($2, full_name),
           email = COALESCE($3, email),
           contact_number = COALESCE($4, contact_number),
           shift = COALESCE($5, shift),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, contact_number, role, status, shift, date_registered`,
      [
        userId,
        patch.fullName?.trim() || null,
        cleanEmail,
        patch.contactNumber?.trim() || null,
        patch.shift?.trim() || null,
      ]
    );

    return rows[0] || null;
  });
}

module.exports = {
  findByEmail,
  registerStaffUser,
  updateCurrentProfile,
};

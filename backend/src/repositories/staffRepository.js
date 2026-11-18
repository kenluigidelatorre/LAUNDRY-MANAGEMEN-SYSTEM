const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');

function mapStaff(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    contactNumber: row.contact_number,
    role: row.role,
    status: row.status,
    dateRegistered:
      row.date_registered instanceof Date
        ? row.date_registered.toISOString().slice(0, 10)
        : String(row.date_registered).slice(0, 10),
    shift: row.shift,
  };
}

async function listStaff() {
  const { rows } = await query(
    `SELECT id, full_name, email, contact_number, role, status, date_registered, shift
     FROM staff_users
     ORDER BY id ASC`
  );
  return rows.map(mapStaff);
}

async function createStaff(data) {
  const { rows: maxRows } = await query(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 5) AS max_num FROM staff_users`
  );
  const nextId = `STF-${String(Number(maxRows[0].max_num) + 1).padStart(3, '0')}`;
  const rawPassword = data.password && data.password.trim().length >= 4 ? data.password.trim() : 'staff123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const { rows } = await query(
    `INSERT INTO staff_users (id, full_name, email, password_hash, contact_number, role, status, shift)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, full_name, email, contact_number, role, status, date_registered, shift`,
    [
      nextId,
      data.fullName.trim(),
      data.email.trim().toLowerCase(),
      passwordHash,
      data.contactNumber.trim(),
      data.role || 'STAFF',
      data.status || 'Active',
      data.shift ? data.shift.trim() : 'Morning Shift (7:00 AM – 3:00 PM)',
    ]
  );
  return mapStaff(rows[0]);
}

async function updateStaff(id, data) {
  const { rows } = await query(
    `UPDATE staff_users
     SET full_name = $2,
         email = $3,
         contact_number = $4,
         role = $5,
         status = $6,
         shift = $7,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, full_name, email, contact_number, role, status, date_registered, shift`,
    [
      id,
      data.fullName.trim(),
      data.email.trim().toLowerCase(),
      data.contactNumber.trim(),
      data.role || 'STAFF',
      data.status || 'Active',
      data.shift ? data.shift.trim() : 'Morning Shift (7:00 AM – 3:00 PM)',
    ]
  );
  if (rows.length === 0) throw new AppError(`Staff member ${id} not found.`, 404);
  return mapStaff(rows[0]);
}

async function toggleStaffStatus(id) {
  const { rows } = await query(
    `UPDATE staff_users
     SET status = CASE WHEN status = 'Active' THEN 'Inactive' ELSE 'Active' END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, full_name, email, contact_number, role, status, date_registered, shift`,
    [id]
  );
  if (rows.length === 0) throw new AppError(`Staff member ${id} not found.`, 404);
  return mapStaff(rows[0]);
}

async function deleteStaff(id) {
  const { rowCount } = await query(`DELETE FROM staff_users WHERE id = $1`, [id]);
  if (rowCount === 0) throw new AppError(`Staff member ${id} not found.`, 404);
  return { id };
}

module.exports = {
  listStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
};

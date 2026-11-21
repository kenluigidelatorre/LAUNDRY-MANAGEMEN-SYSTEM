const { query } = require('../config/db');
const AppError = require('../utils/AppError');

function mapCustomer(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    contactNumber: row.contact_number,
    address: row.address,
    email: row.email || undefined,
    registrationDate:
      row.registration_date instanceof Date
        ? row.registration_date.toISOString().slice(0, 10)
        : String(row.registration_date).slice(0, 10),
    status: row.status,
  };
}

async function getCustomerById(id) {
  if (!id) return null;
  const { rows } = await query(`SELECT * FROM customers WHERE id = $1`, [id]);
  return rows[0] ? mapCustomer(rows[0]) : null;
}

async function listCustomers() {
  const { rows } = await query(
    `SELECT * FROM customers ORDER BY registration_date DESC, id DESC`
  );
  return rows.map(mapCustomer);
}

async function createCustomer(data) {
  const { rows: maxRows } = await query(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 8) AS max_num FROM customers`
  );
  const nextId = `CUS-${String(Number(maxRows[0].max_num) + 1).padStart(3, '0')}`;
  const { rows } = await query(
    `INSERT INTO customers (id, full_name, contact_number, address, email, status)
     VALUES ($1, $2, $3, $4, $5, 'Active')
     RETURNING *`,
    [
      nextId,
      data.fullName.trim(),
      data.contactNumber.trim(),
      data.address.trim(),
      data.email ? data.email.trim() : null,
    ]
  );
  return mapCustomer(rows[0]);
}

async function updateCustomer(id, data) {
  const { rows } = await query(
    `UPDATE customers
     SET full_name = $2,
         contact_number = $3,
         address = $4,
         email = $5,
         status = $6,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.fullName.trim(),
      data.contactNumber.trim(),
      data.address.trim(),
      data.email ? data.email.trim() : null,
      data.status || 'Active',
    ]
  );
  if (rows.length === 0) throw new AppError(`Customer ${id} not found.`, 404);
  return mapCustomer(rows[0]);
}

async function deleteCustomer(id) {
  const { rowCount } = await query(`DELETE FROM customers WHERE id = $1`, [id]);
  if (rowCount === 0) throw new AppError(`Customer ${id} not found.`, 404);
  return { id };
}

module.exports = {
  getCustomerById,
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};

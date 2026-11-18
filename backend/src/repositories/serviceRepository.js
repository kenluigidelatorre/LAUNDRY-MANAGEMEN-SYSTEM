const { query } = require('../config/db');
const AppError = require('../utils/AppError');

function mapService(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    pricePerKg: Number(row.price_per_kg),
    estimatedTime: row.estimated_time,
    available: Boolean(row.available),
    iconKey: row.icon_key,
    colorVariant: row.color_variant,
  };
}

async function listServices() {
  const { rows } = await query(`SELECT * FROM laundry_services ORDER BY id ASC`);
  return rows.map(mapService);
}

async function createService(data) {
  const { rows: maxRows } = await query(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 6) AS max_num FROM laundry_services`
  );
  const nextId = `SRV-${String(Number(maxRows[0].max_num) + 1).padStart(3, '0')}`;

  const { rows } = await query(
    `INSERT INTO laundry_services (id, name, description, price_per_kg, estimated_time, available, icon_key, color_variant)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      nextId,
      data.name.trim(),
      data.description.trim(),
      Number(data.pricePerKg),
      data.estimatedTime.trim(),
      data.available !== undefined ? Boolean(data.available) : true,
      data.iconKey || 'shirt',
      data.colorVariant || 'blue',
    ]
  );
  return mapService(rows[0]);
}

async function updateService(id, data) {
  const { rows } = await query(
    `UPDATE laundry_services
     SET name = $2,
         description = $3,
         price_per_kg = $4,
         estimated_time = $5,
         available = $6,
         icon_key = $7,
         color_variant = $8,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.name.trim(),
      data.description.trim(),
      Number(data.pricePerKg),
      data.estimatedTime.trim(),
      Boolean(data.available),
      data.iconKey || 'shirt',
      data.colorVariant || 'blue',
    ]
  );
  if (rows.length === 0) throw new AppError(`Service ${id} not found.`, 404);
  return mapService(rows[0]);
}

async function toggleServiceStatus(id) {
  const { rows } = await query(
    `UPDATE laundry_services
     SET available = NOT available, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  if (rows.length === 0) throw new AppError(`Service ${id} not found.`, 404);
  return mapService(rows[0]);
}

async function deleteService(id) {
  const { rowCount } = await query(`DELETE FROM laundry_services WHERE id = $1`, [id]);
  if (rowCount === 0) throw new AppError(`Service ${id} not found.`, 404);
  return { id };
}

module.exports = {
  listServices,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService,
};

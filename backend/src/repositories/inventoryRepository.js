const { query } = require('../config/db');
const AppError = require('../utils/AppError');

function mapItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: Number(row.quantity),
    minThreshold: Number(row.min_threshold),
    unit: row.unit,
    lastUpdated: row.last_updated,
    archived: Boolean(row.archived),
  };
}

async function listInventory() {
  const { rows } = await query(
    `SELECT * FROM inventory_items ORDER BY last_updated DESC, id ASC`
  );
  return rows.map(mapItem);
}

async function createInventoryItem(data) {
  const { rows: maxRows } = await query(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 7) AS max_num FROM inventory_items`
  );
  const nextId = `INV-${String(Number(maxRows[0].max_num) + 1).padStart(3, '0')}`;

  const { rows } = await query(
    `INSERT INTO inventory_items (id, name, category, quantity, min_threshold, unit, archived, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())
     RETURNING *`,
    [
      nextId,
      data.name.trim(),
      data.category,
      Math.max(0, parseInt(data.quantity, 10) || 0),
      Math.max(1, parseInt(data.minThreshold, 10) || 1),
      data.unit.trim(),
    ]
  );
  return mapItem(rows[0]);
}

async function updateInventoryItem(id, data) {
  const { rows } = await query(
    `UPDATE inventory_items
     SET name = $2,
         category = $3,
         quantity = $4,
         min_threshold = $5,
         unit = $6,
         last_updated = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.name.trim(),
      data.category,
      Math.max(0, parseInt(data.quantity, 10) || 0),
      Math.max(1, parseInt(data.minThreshold, 10) || 1),
      data.unit.trim(),
    ]
  );
  if (rows.length === 0) throw new AppError(`Inventory item ${id} not found.`, 404);
  return mapItem(rows[0]);
}

async function updateStock(id, deltaOrExact, mode = 'delta') {
  const { rows } =
    mode === 'set'
      ? await query(
          `UPDATE inventory_items
           SET quantity = GREATEST(0, $2::int), last_updated = NOW()
           WHERE id = $1
           RETURNING *`,
          [id, parseInt(deltaOrExact, 10) || 0]
        )
      : await query(
          `UPDATE inventory_items
           SET quantity = GREATEST(0, quantity + $2::int), last_updated = NOW()
           WHERE id = $1
           RETURNING *`,
          [id, parseInt(deltaOrExact, 10) || 0]
        );

  if (rows.length === 0) throw new AppError(`Inventory item ${id} not found.`, 404);
  return mapItem(rows[0]);
}

async function archiveInventoryItem(id) {
  const { rows } = await query(
    `UPDATE inventory_items
     SET archived = TRUE, last_updated = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  if (rows.length === 0) throw new AppError(`Inventory item ${id} not found.`, 404);
  return mapItem(rows[0]);
}

module.exports = {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  archiveInventoryItem,
};

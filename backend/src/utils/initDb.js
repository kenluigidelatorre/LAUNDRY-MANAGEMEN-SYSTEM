const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function initDatabase() {
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('Applying PostgreSQL schema...');
    await client.query(schemaSql);

    console.log('Applying initial Wash n\' Dash seed records...');
    await client.query(seedSql);

    // Ensure seeded accounts have valid bcrypt password hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);

    await client.query(
      `UPDATE staff_users
       SET password_hash = $1
       WHERE role = 'ADMIN' AND password_hash LIKE '$2a$10$pending%'`,
      [adminHash]
    );
    await client.query(
      `UPDATE staff_users
       SET password_hash = $1
       WHERE role = 'STAFF' AND password_hash LIKE '$2a$10$pending%'`,
      [staffHash]
    );

    console.log('Wash n\' Dash PostgreSQL database initialized successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

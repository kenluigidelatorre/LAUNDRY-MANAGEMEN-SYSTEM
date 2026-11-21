const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../config/db");
const AppError = require("../utils/AppError");

const DEFAULT_PREFERENCES = {
  orderUpdates: true,
  readyForPickup: true,
  paymentUpdates: true,
  promotions: false,
  autoRefreshSeconds: 15,
};

function mergePreferences(raw) {
  return {
    ...DEFAULT_PREFERENCES,
    ...(raw && typeof raw === "object" ? raw : {}),
  };
}

async function findByEmail(email) {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, u.password_hash, u.contact_number, u.role, u.customer_id,
            u.status, u.shift, u.notification_preferences, u.date_registered, c.address AS customer_address
     FROM staff_users u
     LEFT JOIN customers c ON c.id = u.customer_id
     WHERE LOWER(u.email) = LOWER($1)`,
    [email.trim()],
  );
  return rows[0] || null;
}

async function registerCustomerUser(data) {
  return withTransaction(async (client) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await client.query(
      `SELECT id FROM staff_users WHERE LOWER(email) = LOWER($1)`,
      [cleanEmail],
    );
    if (existing.rows.length > 0) {
      throw new AppError(
        "An account with that email address already exists. Please sign in instead.",
        409,
      );
    }

    const fullName = data.fullName.trim();
    const contactNumber = (data.contactNumber || "").trim() || "Not provided";
    const address = (data.address || "").trim() || "Self-registered customer";

    const existingCustomerRes = await client.query(
      `SELECT id FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [cleanEmail],
    );

    if (existingCustomerRes.rows.length > 0) {
      throw new AppError(
        "A customer record with this email already exists. Please contact the shop to verify and link your account.",
        409,
      );
    }

    const { rows: maxCustRows } = await client.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '[^0-9]', '', 'g'), '')::int), 8) AS max_num FROM customers`,
    );
    const customerId = `CUS-${String(Number(maxCustRows[0].max_num) + 1).padStart(3, "0")}`;

    await client.query(
      `INSERT INTO customers (id, full_name, contact_number, address, email, status)
       VALUES ($1, $2, $3, $4, $5, 'Active')`,
      [customerId, fullName, contactNumber, address, cleanEmail],
    );

    const resolvedAddress = address;

    const { rows: maxUserRows } = await client.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '[^0-9]', '', 'g'), '')::int), 10) AS max_num
 FROM staff_users
 WHERE id LIKE 'CUS-ACC-%'`,
    );
    const nextUserId = `CUS-ACC-${String(Number(maxUserRows[0].max_num) + 1).padStart(3, "0")}`;
    const passwordHash = await bcrypt.hash(data.password, 10);

    const { rows } = await client.query(
      `INSERT INTO staff_users (id, full_name, email, password_hash, contact_number, role, customer_id, status, shift, notification_preferences)
       VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', $6, 'Active', 'Customer Account', $7::jsonb)
       RETURNING id, full_name, email, contact_number, role, customer_id, status, shift, notification_preferences, date_registered`,
      [
        nextUserId,
        fullName,
        cleanEmail,
        passwordHash,
        contactNumber,
        customerId,
        JSON.stringify(DEFAULT_PREFERENCES),
      ],
    );

    return { ...rows[0], customer_address: resolvedAddress };
  });
}

async function registerStaffUser(data) {
  return withTransaction(async (client) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await client.query(
      `SELECT id FROM staff_users WHERE LOWER(email) = LOWER($1)`,
      [cleanEmail],
    );
    if (existing.rows.length > 0) {
      throw new AppError(
        "An account with that email address already exists. Please sign in instead.",
        409,
      );
    }

    const { rows: maxRows } = await client.query(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '\\D', '', 'g'), '')::int), 6) AS max_num
       FROM staff_users
       WHERE id LIKE 'STF-%'`,
    );
    const nextId = `STF-${String(Number(maxRows[0].max_num) + 1).padStart(3, "0")}`;
    const passwordHash = await bcrypt.hash(data.password, 10);
    const fullName = data.fullName.trim();
    const contactNumber = (data.contactNumber || "").trim() || "Not provided";
    const shift = data.shift?.trim() || "Morning Shift (7:00 AM - 3:00 PM)";

    const { rows } = await client.query(
      `INSERT INTO staff_users (id, full_name, email, password_hash, contact_number, role, customer_id, status, shift)
       VALUES ($1, $2, $3, $4, $5, 'STAFF', NULL, 'Active', $6)
       RETURNING id, full_name, email, contact_number, role, customer_id, status, shift, notification_preferences, date_registered`,
      [nextId, fullName, cleanEmail, passwordHash, contactNumber, shift],
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
        [cleanEmail, userId],
      );
      if (existing.rows.length > 0) {
        throw new AppError("This email address is already being used.", 409);
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
       RETURNING id, full_name, email, contact_number, role, customer_id, status, shift, notification_preferences, date_registered`,
      [
        userId,
        patch.fullName?.trim() || null,
        cleanEmail,
        patch.contactNumber?.trim() || null,
        patch.shift?.trim() || null,
      ],
    );
    const updatedUser = rows[0] || null;
    if (!updatedUser) return null;

    let customerAddress = "";
    if (updatedUser.customer_id) {
      const custRes = await client.query(
        `UPDATE customers
         SET full_name = COALESCE($2, full_name),
             email = COALESCE($3, email),
             contact_number = COALESCE($4, contact_number),
             address = COALESCE($5, address),
             updated_at = NOW()
         WHERE id = $1
         RETURNING address`,
        [
          updatedUser.customer_id,
          patch.fullName?.trim() || null,
          cleanEmail,
          patch.contactNumber?.trim() || null,
          patch.address?.trim() || null,
        ],
      );
      customerAddress = custRes.rows[0]?.address || "";
    }

    return { ...updatedUser, customer_address: customerAddress };
  });
}

async function changePassword(userId, currentPassword, newPassword) {
  const { rows } = await query(
    `SELECT id, password_hash FROM staff_users WHERE id = $1`,
    [userId],
  );
  if (rows.length === 0) {
    throw new AppError("Account not found.", 404);
  }
  const matched = rows[0];
  const isValid = await bcrypt.compare(currentPassword, matched.password_hash);
  if (!isValid) {
    throw new AppError("Current password is incorrect.", 400);
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  await query(
    `UPDATE staff_users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
    [userId, newHash],
  );
  return true;
}

async function updateNotificationPreferences(userId, patch) {
  const currentRes = await query(
    `SELECT notification_preferences FROM staff_users WHERE id = $1`,
    [userId],
  );
  if (currentRes.rows.length === 0) {
    throw new AppError("Account not found.", 404);
  }
  const merged = mergePreferences({
    ...mergePreferences(currentRes.rows[0].notification_preferences),
    ...(patch && typeof patch === "object" ? patch : {}),
  });
  const allowedIntervals = [0, 10, 15, 30, 60];
  if (!allowedIntervals.includes(Number(merged.autoRefreshSeconds))) {
    merged.autoRefreshSeconds = 15;
  } else {
    merged.autoRefreshSeconds = Number(merged.autoRefreshSeconds);
  }

  const { rows } = await query(
    `UPDATE staff_users u
     SET notification_preferences = $2::jsonb, updated_at = NOW()
     WHERE u.id = $1
     RETURNING u.id, u.full_name, u.email, u.contact_number, u.role, u.customer_id,
               u.status, u.shift, u.notification_preferences, u.date_registered`,
    [userId, JSON.stringify(merged)],
  );
  const updated = rows[0];
  let customerAddress = "";
  if (updated.customer_id) {
    const custRes = await query(`SELECT address FROM customers WHERE id = $1`, [
      updated.customer_id,
    ]);
    customerAddress = custRes.rows[0]?.address || "";
  }
  return { ...updated, customer_address: customerAddress };
}

module.exports = {
  DEFAULT_PREFERENCES,
  mergePreferences,
  findByEmail,
  registerCustomerUser,
  registerStaffUser,
  updateCurrentProfile,
  changePassword,
  updateNotificationPreferences,
};

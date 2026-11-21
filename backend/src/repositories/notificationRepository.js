const { query } = require('../config/db');

function formatRelativeTime(dateVal) {
  const diffMs = Date.now() - new Date(dateVal).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

async function listNotifications(userOrRole) {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  const customerId = typeof userOrRole === 'object' ? userOrRole?.customerId : null;

  let rows;
  if (role === 'CUSTOMER') {
    const res = await query(
      `SELECT * FROM notifications
       WHERE target_role = 'CUSTOMER' AND (customer_id = $1 OR customer_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 30`,
      [customerId || '__NONE__']
    );
    rows = res.rows;
  } else {
    const res = await query(
      `SELECT * FROM notifications
       WHERE customer_id IS NULL AND (target_role = 'ALL' OR target_role = $1)
       ORDER BY created_at DESC
       LIMIT 30`,
      [role]
    );
    rows = res.rows;
  }

  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    time: formatRelativeTime(n.created_at),
    read: Boolean(n.is_read),
    type: n.type,
    targetRole: n.target_role,
    customerId: n.customer_id || null,
  }));
}

async function markRead(id, userOrRole) {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  const customerId = typeof userOrRole === 'object' ? userOrRole?.customerId : null;

  if (role === 'CUSTOMER') {
    await query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND target_role = 'CUSTOMER' AND (customer_id = $2 OR customer_id IS NULL)`,
      [id, customerId || '__NONE__']
    );
    return;
  }
  await query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND customer_id IS NULL AND (target_role = 'ALL' OR target_role = $2)`,
    [id, role]
  );
}

async function markAllRead(userOrRole) {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  const customerId = typeof userOrRole === 'object' ? userOrRole?.customerId : null;

  if (role === 'CUSTOMER') {
    await query(
      `UPDATE notifications SET is_read = TRUE
       WHERE target_role = 'CUSTOMER' AND (customer_id = $1 OR customer_id IS NULL)`,
      [customerId || '__NONE__']
    );
    return;
  }
  await query(
    `UPDATE notifications SET is_read = TRUE
     WHERE customer_id IS NULL AND (target_role = 'ALL' OR target_role = $1)`,
    [role]
  );
}

module.exports = {
  listNotifications,
  markRead,
  markAllRead,
};

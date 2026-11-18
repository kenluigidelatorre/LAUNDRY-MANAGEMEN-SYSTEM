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

async function listNotifications(role) {
  const { rows } = await query(
    `SELECT * FROM notifications
     WHERE target_role = 'ALL' OR target_role = $1
     ORDER BY created_at DESC
     LIMIT 30`,
    [role]
  );
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    time: formatRelativeTime(n.created_at),
    read: Boolean(n.is_read),
    type: n.type,
    targetRole: n.target_role,
  }));
}

async function markRead(id) {
  await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1`, [id]);
}

async function markAllRead(role) {
  await query(
    `UPDATE notifications SET is_read = TRUE WHERE target_role = 'ALL' OR target_role = $1`,
    [role]
  );
}

module.exports = {
  listNotifications,
  markRead,
  markAllRead,
};

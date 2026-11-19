
const db = require('../config/db');

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, title, message, type, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, message, type, read, created_at`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE user_id = $1 AND read = FALSE`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

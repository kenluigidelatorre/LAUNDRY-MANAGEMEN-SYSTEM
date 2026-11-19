const settingsRepository = require('../repositories/settingsRepository');
const notificationRepository = require('../repositories/notificationRepository');

async function getSettings(req, res, next) {
  try {
    const data = await settingsRepository.getSettings();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const data = await settingsRepository.updateSettings(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listNotifications(req, res, next) {
  try {
    const data = await notificationRepository.listNotifications(req.user.role);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    await notificationRepository.markRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    await notificationRepository.markAllRead(req.user.role);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

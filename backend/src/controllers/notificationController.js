const notificationRepository = require('../repositories/notificationRepository');

async function getNotifications(req, res, next) {
  try {
    const notifications = await notificationRepository.listNotifications(req.user);
    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    await notificationRepository.markRead(id, req.user);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    next(error);
  }
}

async function markAllNotificationsRead(req, res, next) {
  try {
    await notificationRepository.markAllRead(req.user);
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

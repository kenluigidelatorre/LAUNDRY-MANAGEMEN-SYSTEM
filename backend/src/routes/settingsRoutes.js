const express = require('express');
const settingsController = require('../controllers/settingsController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/settings', settingsController.getSettings);
router.put('/settings', requireRole('ADMIN'), settingsController.updateSettings);

router.get('/notifications', settingsController.listNotifications);
router.patch('/notifications/read-all', settingsController.markAllNotificationsRead);
router.patch('/notifications/:id/read', settingsController.markNotificationRead);

module.exports = router;

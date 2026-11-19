const express = require('express');
const staffController = require('../controllers/staffController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { validateStaff } = require('../validators/requestValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', staffController.listStaff);
router.post('/', requireRole('ADMIN'), validateStaff, staffController.createStaff);
router.put('/:id', requireRole('ADMIN'), validateStaff, staffController.updateStaff);
router.patch('/:id/toggle', requireRole('ADMIN'), staffController.toggleStaffStatus);
router.delete('/:id', requireRole('ADMIN'), staffController.deleteStaff);

module.exports = router;

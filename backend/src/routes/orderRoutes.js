const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const {
  validateCreateOrder,
  validateUpdateOrder,
} = require('../validators/requestValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', orderController.listOrders);
router.get('/:id', orderController.getOrder);
router.post('/', validateCreateOrder, orderController.createOrder);

// Staff & Admin order processing
router.put('/:id', requireRole('ADMIN', 'STAFF'), validateUpdateOrder, orderController.updateOrder);
router.patch('/:id/status', requireRole('ADMIN', 'STAFF'), orderController.updateStatus);

// Admin & Customer (pre-wash own orders only) cancellation
router.post('/:id/cancel', requireRole('ADMIN', 'CUSTOMER'), orderController.cancelOrder);

// Admin-only order administration
router.patch('/:id/assign', requireRole('ADMIN'), orderController.assignStaff);
router.patch('/:id/expected-date', requireRole('ADMIN'), orderController.updateExpectedDate);
router.delete('/:id', requireRole('ADMIN'), orderController.deleteOrder);

module.exports = router;

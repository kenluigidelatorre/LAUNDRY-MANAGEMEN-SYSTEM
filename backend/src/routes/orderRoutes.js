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
router.put('/:id', validateUpdateOrder, orderController.updateOrder);
router.patch('/:id/status', orderController.updateStatus);

// Admin-only order administration
router.patch('/:id/assign', requireRole('ADMIN'), orderController.assignStaff);
router.patch('/:id/expected-date', requireRole('ADMIN'), orderController.updateExpectedDate);
router.post('/:id/cancel', requireRole('ADMIN'), orderController.cancelOrder);
router.delete('/:id', requireRole('ADMIN'), orderController.deleteOrder);

module.exports = router;

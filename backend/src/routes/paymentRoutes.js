const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { validatePayment } = require('../validators/requestValidators');

const router = express.Router();

router.use(authenticate);
router.get('/', paymentController.listTransactions);
router.post('/', requireRole('ADMIN', 'STAFF'), validatePayment, paymentController.recordPayment);
router.put('/:id', requireRole('ADMIN', 'STAFF'), paymentController.updateTransaction);

module.exports = router;

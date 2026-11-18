const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');
const { validatePayment } = require('../validators/requestValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', paymentController.listTransactions);
router.post('/', validatePayment, paymentController.recordPayment);
router.put('/:id', paymentController.updateTransaction);

module.exports = router;

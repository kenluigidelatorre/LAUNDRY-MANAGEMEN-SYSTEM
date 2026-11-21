const express = require('express');
const customerController = require('../controllers/customerController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { validateCustomer } = require('../validators/requestValidators');

const router = express.Router();

router.use(authenticate);
router.get('/', customerController.listCustomers);
router.post('/', requireRole('ADMIN', 'STAFF'), validateCustomer, customerController.createCustomer);
router.put('/:id', validateCustomer, customerController.updateCustomer);
router.delete('/:id', requireRole('ADMIN'), customerController.deleteCustomer);

module.exports = router;

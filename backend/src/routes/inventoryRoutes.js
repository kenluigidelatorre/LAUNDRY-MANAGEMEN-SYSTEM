const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { validateInventory } = require('../validators/requestValidators');

const router = express.Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/', inventoryController.listInventory);
router.post('/', validateInventory, inventoryController.createInventoryItem);
router.put('/:id', validateInventory, inventoryController.updateInventoryItem);
router.patch('/:id/stock', inventoryController.updateStock);
router.delete('/:id', inventoryController.archiveInventoryItem);

module.exports = router;

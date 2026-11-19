const express = require('express');
const serviceController = require('../controllers/serviceController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { validateService } = require('../validators/requestValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', serviceController.listServices);
router.post('/', requireRole('ADMIN'), validateService, serviceController.createService);
router.put('/:id', requireRole('ADMIN'), validateService, serviceController.updateService);
router.patch('/:id/toggle', requireRole('ADMIN'), serviceController.toggleServiceStatus);
router.delete('/:id', requireRole('ADMIN'), serviceController.deleteService);

module.exports = router;

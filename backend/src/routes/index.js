
const express = require('express');
const authRoutes = require('./authRoutes');
const orderRoutes = require('./orderRoutes');
const customerRoutes = require('./customerRoutes');
const serviceRoutes = require('./serviceRoutes');
const staffRoutes = require('./staffRoutes');
const paymentRoutes = require('./paymentRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const settingsRoutes = require('./settingsRoutes');
const bootstrapController = require('../controllers/bootstrapController');
const { authenticate } = require('../middleware/authMiddleware');
const notificationRoutes = require('./notificationRoutes');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

router.use('/auth', authRoutes);
router.get('/bootstrap', authenticate, bootstrapController.getBootstrapData);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/services', serviceRoutes);
router.use('/staff', staffRoutes);
router.use('/payments', paymentRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/', settingsRoutes);
router.use('/notifications', authenticate, notificationRoutes);

module.exports = router;

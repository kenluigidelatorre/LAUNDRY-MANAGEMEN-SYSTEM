const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateChangePassword,
  validateLogin,
  validateRegister,
} = require('../validators/requestValidators');

const router = express.Router();

router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/password', authenticate, validateChangePassword, authController.changePassword);
router.put('/preferences', authenticate, authController.updatePreferences);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, requestPasswordReset, resetPassword } = require('../controllers/authController');
const { validateRegistration, validateLogin, validatePasswordReset, validateNewPassword } = require('../middleware/validation');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validateRegistration, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/request-password-reset', passwordResetLimiter, validatePasswordReset, requestPasswordReset);
router.post('/reset-password', validateNewPassword, resetPassword);

module.exports = router;
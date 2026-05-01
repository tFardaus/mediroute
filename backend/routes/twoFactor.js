const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');
const {
  generateSecret,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  getTwoFactorStatus
} = require('../controllers/twoFactorController');

router.post('/generate', protect, generateSecret);
router.post('/enable', protect, auditMiddleware('ENABLE_2FA', 'two_factor_auth'), enableTwoFactor);
router.post('/disable', protect, auditMiddleware('DISABLE_2FA', 'two_factor_auth'), disableTwoFactor);
router.post('/verify', verifyTwoFactor);
router.get('/status', protect, getTwoFactorStatus);

module.exports = router;

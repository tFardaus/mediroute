const express = require('express');
const router = express.Router();
const { protect, roleGuard } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');
const {
  createBilling,
  getBillingByAppointment,
  getPatientBillings,
  updateBillingStatus,
  getAllBillings,
  getBillingStats
} = require('../controllers/billingController');

router.post('/', protect, roleGuard(['receptionist', 'admin']), auditMiddleware('CREATE_BILLING', 'billing'), createBilling);
router.get('/appointment/:appointmentId', protect, getBillingByAppointment);
router.get('/patient/:patientId', protect, roleGuard(['patient', 'receptionist', 'admin']), getPatientBillings);
router.patch('/:id', protect, roleGuard(['receptionist', 'admin']), auditMiddleware('UPDATE_BILLING_STATUS', 'billing'), updateBillingStatus);
router.get('/all/list', protect, roleGuard(['receptionist', 'admin']), getAllBillings);
router.get('/stats/summary', protect, roleGuard(['admin']), getBillingStats);

module.exports = router;

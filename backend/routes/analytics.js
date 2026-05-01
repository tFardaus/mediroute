const express = require('express');
const router = express.Router();
const { protect, roleGuard } = require('../middleware/auth');
const {
  getDashboardStats,
  getAppointmentTrends,
  getRevenueTrends,
  getDoctorPerformance,
  getSpecializationStats,
  getPatientStats,
  recordMetric,
  getMetrics
} = require('../controllers/analyticsController');

router.get('/dashboard', protect, roleGuard(['admin', 'receptionist']), getDashboardStats);
router.get('/appointments/trends', protect, roleGuard(['admin', 'receptionist']), getAppointmentTrends);
router.get('/revenue/trends', protect, roleGuard(['admin']), getRevenueTrends);
router.get('/doctors/performance', protect, roleGuard(['admin']), getDoctorPerformance);
router.get('/specializations/stats', protect, roleGuard(['admin']), getSpecializationStats);
router.get('/patients/stats', protect, roleGuard(['admin']), getPatientStats);

router.post('/metrics', protect, roleGuard(['admin']), recordMetric);
router.get('/metrics', protect, roleGuard(['admin']), getMetrics);

module.exports = router;

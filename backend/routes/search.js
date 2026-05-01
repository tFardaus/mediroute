const express = require('express');
const router = express.Router();
const { protect, roleGuard } = require('../middleware/auth');
const { validateSearchQuery } = require('../middleware/validation');
const { searchPatients, searchDoctors, searchAppointments, getAuditLogs } = require('../controllers/searchController');

router.get('/patients', protect, roleGuard(['admin', 'receptionist', 'doctor']), validateSearchQuery, searchPatients);
router.get('/doctors', protect, validateSearchQuery, searchDoctors);
router.get('/appointments', protect, roleGuard(['admin', 'receptionist', 'doctor']), validateSearchQuery, searchAppointments);
router.get('/audit-logs', protect, roleGuard(['admin']), validateSearchQuery, getAuditLogs);

module.exports = router;

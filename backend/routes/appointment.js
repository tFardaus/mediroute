const express = require('express');
const router = express.Router();
const {
  createAppointment, cancelAppointment,
  getPendingAppointments, updateAppointmentStatus,
  getDoctorAppointments, getPatientAppointments
} = require('../controllers/appointmentController');
const { protect, roleGuard } = require('../middleware/auth');

// Patient routes
router.post('/', protect, roleGuard('patient'), createAppointment);
router.delete('/:id', protect, roleGuard('patient'), cancelAppointment);
router.get('/my', protect, roleGuard('patient'), getPatientAppointments);

// Receptionist routes
router.get('/pending', protect, roleGuard('receptionist'), getPendingAppointments);
router.patch('/:id', protect, roleGuard('receptionist'), updateAppointmentStatus);

// Doctor routes
router.get('/doctor', protect, roleGuard('doctor'), getDoctorAppointments);

module.exports = router;
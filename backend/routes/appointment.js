const express = require('express');
const router = express.Router();
const {
  createAppointment, cancelAppointment,
  getPendingAppointments, updateAppointmentStatus,
  getDoctorAppointments, getPatientAppointments,
  getDoctorsList, getDoctorAppointmentHistory, getApprovedAppointments
} = require('../controllers/appointmentController');
const { protect, roleGuard } = require('../middleware/auth');

// Patient routes
router.post('/', protect, roleGuard('patient'), createAppointment);
router.delete('/:id', protect, roleGuard('patient'), cancelAppointment);
router.get('/my', protect, roleGuard('patient'), getPatientAppointments);
router.get('/doctors', protect, getDoctorsList);

// Receptionist routes
router.get('/pending', protect, roleGuard('receptionist'), getPendingAppointments);
router.patch('/:id', protect, roleGuard('receptionist'), updateAppointmentStatus);

// Receptionist routes (additional)
router.get('/approved', protect, roleGuard('receptionist'), getApprovedAppointments);

// Doctor routes
router.get('/doctor', protect, roleGuard('doctor'), getDoctorAppointments);
router.get('/doctor/history', protect, roleGuard('doctor'), getDoctorAppointmentHistory);

module.exports = router;
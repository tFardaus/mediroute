const express = require('express');
const router = express.Router();
const {
  createAppointment, cancelAppointment,
  getPendingAppointments, updateAppointmentStatus,
  getDoctorAppointments, getPatientAppointments
} = require('../controllers/appointmentController');
const { protect, roleGuard } = require('../middleware/auth');
const { validateAppointment, validateAppointmentStatus, validateId } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

router.post('/', protect, roleGuard('patient'), validateAppointment, auditMiddleware('CREATE_APPOINTMENT', 'appointment'), createAppointment);
router.delete('/:id', protect, roleGuard('patient'), validateId, auditMiddleware('CANCEL_APPOINTMENT', 'appointment'), cancelAppointment);
router.get('/my', protect, roleGuard('patient'), getPatientAppointments);

router.get('/pending', protect, roleGuard('receptionist'), getPendingAppointments);
router.patch('/:id', protect, roleGuard('receptionist'), validateId, validateAppointmentStatus, auditMiddleware('UPDATE_APPOINTMENT_STATUS', 'appointment'), updateAppointmentStatus);

router.get('/doctor', protect, roleGuard('doctor'), getDoctorAppointments);

module.exports = router;
const express = require('express');
const router = express.Router();
const { addNote, issuePrescription, getPatientPrescriptions, getAppointmentNotes } = require('../controllers/doctorController');
const { protect, roleGuard } = require('../middleware/auth');
const { validateDoctorNote, validatePrescription, validateId } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

router.post('/notes', protect, roleGuard('doctor'), validateDoctorNote, auditMiddleware('ADD_NOTE', 'doctor_note'), addNote);
router.post('/prescriptions', protect, roleGuard('doctor'), validatePrescription, auditMiddleware('ISSUE_PRESCRIPTION', 'prescription'), issuePrescription);
router.get('/prescriptions/my', protect, roleGuard('patient'), getPatientPrescriptions);
router.get('/notes/:appointmentId', protect, validateId, getAppointmentNotes);

module.exports = router;
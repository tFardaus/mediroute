const express = require('express');
const router = express.Router();
const { addNote, issuePrescription, getPatientPrescriptions, getAppointmentNotes, getDoctorPrescriptions, getDoctorPatients, getMyConsultationNotes } = require('../controllers/doctorController');
const { protect, roleGuard } = require('../middleware/auth');

router.post('/notes', protect, roleGuard('doctor'), addNote);
router.post('/prescriptions', protect, roleGuard('doctor'), issuePrescription);
router.get('/prescriptions/my', protect, roleGuard('patient'), getPatientPrescriptions);
router.get('/notes/:appointmentId', protect, getAppointmentNotes);
router.get('/prescriptions/mine', protect, roleGuard('doctor'), getDoctorPrescriptions);
router.get('/patients', protect, roleGuard('doctor'), getDoctorPatients);
router.get('/consultation-notes/mine', protect, roleGuard('patient'), getMyConsultationNotes);

module.exports = router;
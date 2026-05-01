const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, roleGuard } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');
const {
  uploadMedicalRecord,
  getPatientMedicalRecords,
  deleteMedicalRecord,
  addMedicalHistory,
  getPatientMedicalHistory,
  updateMedicalHistory,
  addAllergy,
  getPatientAllergies,
  deleteAllergy
} = require('../controllers/medicalRecordsController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/medical-records/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

router.post('/upload', protect, roleGuard(['doctor', 'receptionist']), upload.single('file'), auditMiddleware('UPLOAD_MEDICAL_RECORD', 'medical_record'), uploadMedicalRecord);
router.get('/patient/:patientId', protect, roleGuard(['doctor', 'patient']), getPatientMedicalRecords);
router.delete('/:id', protect, roleGuard(['doctor', 'admin']), auditMiddleware('DELETE_MEDICAL_RECORD', 'medical_record'), deleteMedicalRecord);

router.post('/history', protect, roleGuard('doctor'), auditMiddleware('ADD_MEDICAL_HISTORY', 'medical_history'), addMedicalHistory);
router.get('/history/:patientId', protect, roleGuard(['doctor', 'patient']), getPatientMedicalHistory);
router.put('/history/:id', protect, roleGuard('doctor'), auditMiddleware('UPDATE_MEDICAL_HISTORY', 'medical_history'), updateMedicalHistory);

router.post('/allergies', protect, roleGuard('doctor'), auditMiddleware('ADD_ALLERGY', 'allergy'), addAllergy);
router.get('/allergies/:patientId', protect, roleGuard(['doctor', 'patient']), getPatientAllergies);
router.delete('/allergies/:id', protect, roleGuard('doctor'), auditMiddleware('DELETE_ALLERGY', 'allergy'), deleteAllergy);

module.exports = router;

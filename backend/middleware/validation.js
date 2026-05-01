const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateRegistration = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number'),
  body('dateOfBirth').optional().isDate().withMessage('Invalid date format'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['patient', 'doctor', 'receptionist', 'admin']).withMessage('Invalid role'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').isIn(['patient', 'doctor', 'receptionist', 'admin']).withMessage('Invalid role'),
  handleValidationErrors
];

const validateNewPassword = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateSymptoms = [
  body('symptomsText').trim().notEmpty().withMessage('Symptoms description is required').isLength({ min: 10, max: 2000 }),
  handleValidationErrors
];

const validateAppointment = [
  body('doctorId').isInt({ min: 1 }).withMessage('Valid doctor ID is required'),
  body('submissionId').isInt({ min: 1 }).withMessage('Valid submission ID is required'),
  body('scheduledDate').optional().isDate().withMessage('Invalid date format'),
  body('scheduledTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  handleValidationErrors
];

const validateAppointmentStatus = [
  body('status').isIn(['approved', 'rejected', 'completed']).withMessage('Invalid status'),
  body('scheduledDate').optional().isDate().withMessage('Invalid date format'),
  body('scheduledTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  handleValidationErrors
];

const validateDoctorNote = [
  body('appointmentId').isInt({ min: 1 }).withMessage('Valid appointment ID is required'),
  body('content').trim().notEmpty().withMessage('Note content is required').isLength({ max: 5000 }),
  handleValidationErrors
];

const validatePrescription = [
  body('appointmentId').isInt({ min: 1 }).withMessage('Valid appointment ID is required'),
  body('medication').trim().notEmpty().withMessage('Medication is required').isLength({ max: 200 }),
  body('dosage').trim().notEmpty().withMessage('Dosage is required').isLength({ max: 100 }),
  body('instructions').optional().isLength({ max: 1000 }),
  handleValidationErrors
];

const validateAddDoctor = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required').isLength({ max: 100 }),
  body('phone').optional().matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number'),
  handleValidationErrors
];

const validateAddReceptionist = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number'),
  handleValidationErrors
];

const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID is required'),
  handleValidationErrors
];

const validateSearchQuery = [
  query('q').optional().trim().isLength({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword,
  validateSymptoms,
  validateAppointment,
  validateAppointmentStatus,
  validateDoctorNote,
  validatePrescription,
  validateAddDoctor,
  validateAddReceptionist,
  validateId,
  validateSearchQuery,
  handleValidationErrors
};

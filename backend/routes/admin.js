const express = require('express');
const router = express.Router();
const { addDoctor, removeDoctor, addReceptionist, getAllDoctors, getStats } = require('../controllers/adminController');
const { protect, roleGuard } = require('../middleware/auth');
const { validateAddDoctor, validateAddReceptionist, validateId } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

router.use(protect, roleGuard('admin'));

router.post('/doctors', validateAddDoctor, auditMiddleware('ADD_DOCTOR', 'doctor'), addDoctor);
router.delete('/doctors/:id', validateId, auditMiddleware('REMOVE_DOCTOR', 'doctor'), removeDoctor);
router.post('/receptionists', validateAddReceptionist, auditMiddleware('ADD_RECEPTIONIST', 'receptionist'), addReceptionist);
router.get('/doctors', getAllDoctors);
router.get('/stats', getStats);

module.exports = router;
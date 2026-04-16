const express = require('express');
const router = express.Router();
const { addDoctor, removeDoctor, addReceptionist, getAllDoctors, getAllReceptionists, removeReceptionist, getStats, getAnalytics, getAllPatients, getAllAppointments } = require('../controllers/adminController');
const { protect, roleGuard } = require('../middleware/auth');

router.use(protect, roleGuard('admin')); // All admin routes require admin role

router.post('/doctors', addDoctor);
router.delete('/doctors/:id', removeDoctor);
router.get('/doctors', getAllDoctors);
router.post('/receptionists', addReceptionist);
router.get('/receptionists', getAllReceptionists);
router.delete('/receptionists/:id', removeReceptionist);
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/patients', getAllPatients);
router.get('/appointments', getAllAppointments);

module.exports = router;
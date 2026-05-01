const express = require('express');
const router = express.Router();
const { protect, roleGuard } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');
const {
  setAvailability,
  getAvailability,
  deleteAvailability,
  addTimeOff,
  getTimeOff,
  deleteTimeOff,
  checkAvailability
} = require('../controllers/availabilityController');

router.post('/', protect, roleGuard('doctor'), auditMiddleware('SET_AVAILABILITY', 'availability'), setAvailability);
router.get('/:doctorId', protect, getAvailability);
router.delete('/:id', protect, roleGuard('doctor'), auditMiddleware('DELETE_AVAILABILITY', 'availability'), deleteAvailability);

router.post('/time-off', protect, roleGuard('doctor'), auditMiddleware('ADD_TIME_OFF', 'time_off'), addTimeOff);
router.get('/time-off/:doctorId', protect, getTimeOff);
router.delete('/time-off/:id', protect, roleGuard('doctor'), auditMiddleware('DELETE_TIME_OFF', 'time_off'), deleteTimeOff);

router.get('/check/availability', protect, checkAvailability);

module.exports = router;

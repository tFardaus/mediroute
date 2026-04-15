const express = require('express');
const router = express.Router();
const { submitSymptoms, getSubmission } = require('../controllers/symptomController');
const { protect, roleGuard } = require('../middleware/auth');

router.post('/', protect, roleGuard('patient'), submitSymptoms);
router.get('/:id', protect, roleGuard('patient'), getSubmission);

module.exports = router;
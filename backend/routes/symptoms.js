const express = require('express');
const router = express.Router();
const { submitSymptoms, getSubmission } = require('../controllers/symptomController');
const { protect, roleGuard } = require('../middleware/auth');
const { validateSymptoms, validateId } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

router.post('/', protect, roleGuard('patient'), validateSymptoms, auditMiddleware('SUBMIT_SYMPTOMS', 'symptom'), submitSymptoms);
router.get('/:id', protect, roleGuard('patient'), validateId, getSubmission);

module.exports = router;
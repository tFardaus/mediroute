const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Quick safety check - remove after confirming it works
console.log('register type:', typeof register);
console.log('login type:', typeof login);

router.post('/register', register);
router.post('/login', login);

module.exports = router;
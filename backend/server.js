const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import DB to test connection on startup
require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.static(require('path').join(__dirname, 'public')));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/symptoms', require('./routes/symptoms'));
app.use('/api/appointments', require('./routes/appointment'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🏥 MediRoute API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const roleConfig = {
  patient:      { table: 'patients',      idCol: 'patient_id' },
  doctor:       { table: 'doctors',       idCol: 'doctor_id' },
  receptionist: { table: 'receptionists', idCol: 'receptionist_id' },
  admin:        { table: 'admins',        idCol: 'admin_id' },
};

const register = async (req, res) => {
  const { name, email, password, phone, address, dateOfBirth } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const existing = await pool.query(
      'SELECT patient_id FROM patients WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO patients (name, email, password_hash, phone, address, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING patient_id, name, email`,
      [name, email, passwordHash, phone || null, address || null, dateOfBirth || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.patient_id, role: 'patient', email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: user.patient_id, name: user.name, email: user.email, role: 'patient' }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  const config = roleConfig[role];
  if (!config) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  try {
    const result = await pool.query(
      `SELECT *, ${config.idCol} as user_id FROM ${config.table} WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.user_id, role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.user_id, name: user.name, email: user.email, role }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

module.exports = { register, login };
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ADMIN: Add a new doctor
const addDoctor = async (req, res) => {
  const { name, email, password, specialization, phone } = req.body;

  if (!name || !email || !password || !specialization) {
    return res.status(400).json({ error: 'Name, email, password, and specialization are required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO doctors (name, email, password_hash, specialization, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING doctor_id, name, email, specialization`,
      [name, email, passwordHash, specialization, phone || null]
    );
    res.status(201).json({ message: 'Doctor added successfully.', doctor: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use.' });
    }
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN: Remove a doctor
const removeDoctor = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM doctors WHERE doctor_id = $1', [id]);
    res.json({ message: 'Doctor removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN: Add a receptionist
const addReceptionist = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO receptionists (name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4) RETURNING receptionist_id, name, email`,
      [name, email, passwordHash, phone || null]
    );
    res.status(201).json({ message: 'Receptionist added.', receptionist: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN: Get all doctors list
const getAllDoctors = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT doctor_id, name, email, specialization, phone FROM doctors ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN: Get system stats
const getStats = async (req, res) => {
  try {
    const patients = await pool.query('SELECT COUNT(*) FROM patients');
    const doctors = await pool.query('SELECT COUNT(*) FROM doctors');
    const pending = await pool.query(`SELECT COUNT(*) FROM appointments WHERE status='pending'`);
    const approved = await pool.query(`SELECT COUNT(*) FROM appointments WHERE status='approved'`);

    res.json({
      totalPatients: parseInt(patients.rows[0].count),
      totalDoctors: parseInt(doctors.rows[0].count),
      pendingAppointments: parseInt(pending.rows[0].count),
      approvedAppointments: parseInt(approved.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { addDoctor, removeDoctor, addReceptionist, getAllDoctors, getStats };
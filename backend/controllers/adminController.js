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

// ADMIN: Get analytics (bar chart + donut chart data)
const getAnalytics = async (req, res) => {
  try {
    // Appointments per day for last 7 days
    const dailyResult = await pool.query(`
      SELECT
        TO_CHAR(day, 'Dy') AS label,
        COALESCE(COUNT(a.appointment_id), 0)::int AS count
      FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS day
      LEFT JOIN appointments a
        ON DATE(a.requested_at) = day::date
      GROUP BY day
      ORDER BY day ASC
    `);

    // Appointments by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*)::int AS count FROM appointments GROUP BY status
    `);

    const statusMap = { pending: 0, approved: 0, rejected: 0 };
    statusResult.rows.forEach(r => { statusMap[r.status] = r.count; });
    const total = statusMap.pending + statusMap.approved + statusMap.rejected;

    res.json({
      daily: dailyResult.rows,
      status: {
        total,
        completed: statusMap.approved,
        scheduled: statusMap.pending,
        cancelled: statusMap.rejected,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN: Get system stats
const getStats = async (req, res) => {
  try {
    const [patients, doctors, pending, approved, aiRecs] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM patients'),
      pool.query('SELECT COUNT(*) FROM doctors'),
      pool.query(`SELECT COUNT(*) FROM appointments WHERE status='pending'`),
      pool.query(`SELECT COUNT(*) FROM appointments WHERE status='approved'`),
      pool.query('SELECT COUNT(*) FROM ai_recommendations'),
    ]);

    const uptimeSeconds = Math.floor(process.uptime());
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    res.json({
      totalPatients: parseInt(patients.rows[0].count),
      totalDoctors: parseInt(doctors.rows[0].count),
      pendingAppointments: parseInt(pending.rows[0].count),
      approvedAppointments: parseInt(approved.rows[0].count),
      aiRecommendations: parseInt(aiRecs.rows[0].count),
      systemUptime: uptime,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN: Get all receptionists
const getAllReceptionists = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT receptionist_id, name, email, phone FROM receptionists ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN: Remove a receptionist
const removeReceptionist = async ({ params: { id } }, res) => {
  try {
    await pool.query('DELETE FROM receptionists WHERE receptionist_id = $1', [id]);
    res.json({ message: 'Receptionist removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN: Get all patients
const getAllPatients = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT patient_id, name, email, phone, date_of_birth,
              EXTRACT(YEAR FROM AGE(date_of_birth))::int AS age,
              created_at
       FROM patients ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ADMIN / RECEPTIONIST: Get all appointments
const getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.appointment_id, a.status, a.scheduled_date, a.scheduled_time, a.requested_at,
              p.name AS patient_name,
              d.name AS doctor_name, d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       ORDER BY a.requested_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { addDoctor, removeDoctor, addReceptionist, getAllDoctors, getAllReceptionists, removeReceptionist, getStats, getAnalytics, getAllPatients, getAllAppointments };
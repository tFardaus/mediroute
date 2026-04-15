const pool = require('../config/db');

// PATIENT: Request a new appointment
const createAppointment = async (req, res) => {
  const { doctorId, submissionId, scheduledDate, scheduledTime } = req.body;
  const patientId = req.user.id;

  if (!doctorId) {
    return res.status(400).json({ error: 'Doctor is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, submission_id, scheduled_date, scheduled_time)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patientId, doctorId, submissionId || null, scheduledDate || null, scheduledTime || null]
    );
    res.status(201).json({ message: 'Appointment requested.', appointment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// PATIENT: Cancel their own pending appointment
const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;

  try {
    const check = await pool.query(
      `SELECT * FROM appointments WHERE appointment_id = $1 AND patient_id = $2`,
      [id, patientId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (check.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending appointments can be cancelled.' });
    }

    await pool.query(
      `UPDATE appointments SET status = 'rejected' WHERE appointment_id = $1`,
      [id]
    );

    res.json({ message: 'Appointment cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// RECEPTIONIST: View all pending appointments
const getPendingAppointments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, 
        p.name as patient_name, p.email as patient_email,
        d.name as doctor_name, d.specialization,
        ss.symptoms_text,
        ar.suggested_specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       LEFT JOIN symptom_submissions ss ON a.submission_id = ss.submission_id
       LEFT JOIN ai_recommendations ar ON ss.submission_id = ar.submission_id
       WHERE a.status = 'pending'
       ORDER BY a.requested_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// RECEPTIONIST: Approve or reject an appointment
const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, scheduledDate, scheduledTime } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }

  try {
    const result = await pool.query(
      `UPDATE appointments
       SET status = $1,
           scheduled_date = COALESCE($2::date, scheduled_date),
           scheduled_time = COALESCE($3::time, scheduled_time)
       WHERE appointment_id = $4 RETURNING *`,
      [status, scheduledDate || null, scheduledTime || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    res.json({ message: `Appointment ${status}.`, appointment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// DOCTOR: View today's approved appointments with patient info
const getDoctorAppointments = async (req, res) => {
  const doctorId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT a.*,
        p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
        EXTRACT(YEAR FROM AGE(p.date_of_birth))::int AS age,
        ss.symptoms_text,
        ar.suggested_specialization, ar.reasoning,
        (SELECT MAX(scheduled_date)
           FROM appointments
           WHERE patient_id = p.patient_id
             AND status IN ('approved','completed')
             AND scheduled_date < CURRENT_DATE) AS last_visit
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       LEFT JOIN symptom_submissions ss ON a.submission_id = ss.submission_id
       LEFT JOIN ai_recommendations ar ON ss.submission_id = ar.submission_id
       WHERE a.doctor_id = $1
         AND a.status = 'approved'
         AND a.scheduled_date = CURRENT_DATE
       ORDER BY a.scheduled_time ASC NULLS LAST`,
      [doctorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// PATIENT: View their own appointments
const getPatientAppointments = async (req, res) => {
  const patientId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT a.*, d.name as doctor_name, d.specialization
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.patient_id = $1
       ORDER BY a.requested_at DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// PATIENT: Get list of all doctors for booking
const getDoctorsList = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT doctor_id, name, specialization FROM doctors ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  createAppointment, cancelAppointment,
  getPendingAppointments, updateAppointmentStatus,
  getDoctorAppointments, getPatientAppointments,
  getDoctorsList
};
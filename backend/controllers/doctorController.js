const pool = require('../config/db');

// DOCTOR: Add consultation note
const addNote = async (req, res) => {
  const { appointmentId, content } = req.body;
  const doctorId = req.user.id;

  if (!appointmentId || !content) {
    return res.status(400).json({ error: 'Appointment ID and note content are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO doctor_notes (content, appointment_id, doctor_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [content, appointmentId, doctorId]
    );
    res.status(201).json({ message: 'Note saved.', note: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// DOCTOR: Issue prescription
const issuePrescription = async (req, res) => {
  const { appointmentId, medication, dosage, instructions } = req.body;
  const doctorId = req.user.id;

  if (!appointmentId || !medication) {
    return res.status(400).json({ error: 'Appointment ID and medication are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO prescriptions (medication, dosage, instructions, appointment_id, doctor_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [medication, dosage || null, instructions || null, appointmentId, doctorId]
    );
    res.status(201).json({ message: 'Prescription issued.', prescription: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// PATIENT: View all their prescriptions
const getPatientPrescriptions = async (req, res) => {
  const patientId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT pr.*, d.name as doctor_name, a.scheduled_date
       FROM prescriptions pr
       JOIN appointments a ON pr.appointment_id = a.appointment_id
       JOIN doctors d ON pr.doctor_id = d.doctor_id
       WHERE a.patient_id = $1
       ORDER BY pr.issued_at DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// PATIENT/DOCTOR: Get notes for an appointment
const getAppointmentNotes = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT dn.*, d.name as doctor_name
       FROM doctor_notes dn
       JOIN doctors d ON dn.doctor_id = d.doctor_id
       WHERE dn.appointment_id = $1
       ORDER BY dn.created_at DESC`,
      [appointmentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { addNote, issuePrescription, getPatientPrescriptions, getAppointmentNotes };
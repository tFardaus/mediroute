const pool = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

const uploadMedicalRecord = async (req, res) => {
  const { patientId, recordType, title, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'File is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO medical_records (patient_id, record_type, title, description, file_path, file_type, file_size, uploaded_by_role, uploaded_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [patientId, recordType, title, description, file.path, file.mimetype, file.size, req.user.role, req.user.id]
    );

    res.status(201).json({ message: 'Medical record uploaded.', record: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getPatientMedicalRecords = async (req, res) => {
  const { patientId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY created_at DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const deleteMedicalRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await pool.query(
      `SELECT * FROM medical_records WHERE record_id = $1`,
      [id]
    );

    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    if (record.rows[0].file_path) {
      await fs.unlink(record.rows[0].file_path).catch(err => console.error('File delete error:', err));
    }

    await pool.query(`DELETE FROM medical_records WHERE record_id = $1`, [id]);

    res.json({ message: 'Medical record deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const addMedicalHistory = async (req, res) => {
  const { patientId, conditionName, diagnosedDate, status, notes } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO patient_medical_history (patient_id, condition_name, diagnosed_date, status, notes, added_by_doctor_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patientId, conditionName, diagnosedDate, status, notes, req.user.id]
    );

    res.status(201).json({ message: 'Medical history added.', history: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getPatientMedicalHistory = async (req, res) => {
  const { patientId } = req.params;

  try {
    const result = await pool.query(
      `SELECT h.*, d.name as doctor_name 
       FROM patient_medical_history h
       LEFT JOIN doctors d ON h.added_by_doctor_id = d.doctor_id
       WHERE h.patient_id = $1 ORDER BY h.created_at DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const updateMedicalHistory = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE patient_medical_history SET status = $1, notes = $2, updated_at = NOW()
       WHERE history_id = $3 RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'History record not found.' });
    }

    res.json({ message: 'Medical history updated.', history: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const addAllergy = async (req, res) => {
  const { patientId, allergen, reaction, severity } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO allergies (patient_id, allergen, reaction, severity, added_by_doctor_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patientId, allergen, reaction, severity, req.user.id]
    );

    res.status(201).json({ message: 'Allergy added.', allergy: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getPatientAllergies = async (req, res) => {
  const { patientId } = req.params;

  try {
    const result = await pool.query(
      `SELECT a.*, d.name as doctor_name 
       FROM allergies a
       LEFT JOIN doctors d ON a.added_by_doctor_id = d.doctor_id
       WHERE a.patient_id = $1 ORDER BY a.created_at DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const deleteAllergy = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM allergies WHERE allergy_id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Allergy not found.' });
    }

    res.json({ message: 'Allergy deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  uploadMedicalRecord,
  getPatientMedicalRecords,
  deleteMedicalRecord,
  addMedicalHistory,
  getPatientMedicalHistory,
  updateMedicalHistory,
  addAllergy,
  getPatientAllergies,
  deleteAllergy
};

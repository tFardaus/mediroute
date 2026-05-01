const pool = require('../config/db');

const searchPatients = async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT patient_id, name, email, phone, date_of_birth, created_at
      FROM patients
    `;
    let countQuery = `SELECT COUNT(*) FROM patients`;
    const params = [];

    if (q) {
      query += ` WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`;
      countQuery += ` WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`;
      params.push(`%${q}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [results, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, q ? [`%${q}%`] : [])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: results.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const searchDoctors = async (req, res) => {
  const { q, specialization, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT doctor_id, name, email, specialization, phone, created_at
      FROM doctors
    `;
    let countQuery = `SELECT COUNT(*) FROM doctors`;
    const params = [];
    const conditions = [];

    if (q) {
      conditions.push(`(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${q}%`);
    }

    if (specialization) {
      conditions.push(`specialization ILIKE $${params.length + 1}`);
      params.push(`%${specialization}%`);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const [results, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: results.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const searchAppointments = async (req, res) => {
  const { status, doctorId, patientId, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT a.*, 
        p.name as patient_name, p.email as patient_email,
        d.name as doctor_name, d.specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
    `;
    let countQuery = `
      SELECT COUNT(*) FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`a.status = $${params.length + 1}`);
      params.push(status);
    }

    if (doctorId) {
      conditions.push(`a.doctor_id = $${params.length + 1}`);
      params.push(doctorId);
    }

    if (patientId) {
      conditions.push(`a.patient_id = $${params.length + 1}`);
      params.push(patientId);
    }

    if (dateFrom) {
      conditions.push(`a.scheduled_date >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`a.scheduled_date <= $${params.length + 1}`);
      params.push(dateTo);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY a.scheduled_date DESC, a.scheduled_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const [results, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: results.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getAuditLogs = async (req, res) => {
  const { userId, userRole, action, resourceType, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `SELECT * FROM audit_logs`;
    let countQuery = `SELECT COUNT(*) FROM audit_logs`;
    const params = [];
    const conditions = [];

    if (userId) {
      conditions.push(`user_id = $${params.length + 1}`);
      params.push(userId);
    }

    if (userRole) {
      conditions.push(`user_role = $${params.length + 1}`);
      params.push(userRole);
    }

    if (action) {
      conditions.push(`action ILIKE $${params.length + 1}`);
      params.push(`%${action}%`);
    }

    if (resourceType) {
      conditions.push(`resource_type = $${params.length + 1}`);
      params.push(resourceType);
    }

    if (dateFrom) {
      conditions.push(`created_at >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`created_at <= $${params.length + 1}`);
      params.push(dateTo);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const [results, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: results.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  searchPatients,
  searchDoctors,
  searchAppointments,
  getAuditLogs
};

const pool = require('../config/db');

const createBilling = async (req, res) => {
  const { appointmentId, patientId, amount, items } = req.body;

  try {
    const billingResult = await pool.query(
      `INSERT INTO billing (appointment_id, patient_id, amount)
       VALUES ($1, $2, $3) RETURNING *`,
      [appointmentId, patientId, amount]
    );

    const billingId = billingResult.rows[0].billing_id;

    if (items && items.length > 0) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO billing_items (billing_id, description, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [billingId, item.description, item.quantity, item.unitPrice, item.totalPrice]
        );
      }
    }

    const fullBilling = await pool.query(
      `SELECT b.*, 
        json_agg(json_build_object('description', bi.description, 'quantity', bi.quantity, 'unitPrice', bi.unit_price, 'totalPrice', bi.total_price)) as items
       FROM billing b
       LEFT JOIN billing_items bi ON b.billing_id = bi.billing_id
       WHERE b.billing_id = $1
       GROUP BY b.billing_id`,
      [billingId]
    );

    res.status(201).json({ message: 'Billing created.', billing: fullBilling.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getBillingByAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT b.*, 
        json_agg(json_build_object('description', bi.description, 'quantity', bi.quantity, 'unitPrice', bi.unit_price, 'totalPrice', bi.total_price)) as items
       FROM billing b
       LEFT JOIN billing_items bi ON b.billing_id = bi.billing_id
       WHERE b.appointment_id = $1
       GROUP BY b.billing_id`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getPatientBillings = async (req, res) => {
  const { patientId } = req.params;

  try {
    const result = await pool.query(
      `SELECT b.*, a.scheduled_date, a.scheduled_time, d.name as doctor_name
       FROM billing b
       JOIN appointments a ON b.appointment_id = a.appointment_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE b.patient_id = $1
       ORDER BY b.created_at DESC`,
      [patientId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const updateBillingStatus = async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod, transactionId } = req.body;

  try {
    const paidAt = status === 'paid' ? new Date() : null;

    const result = await pool.query(
      `UPDATE billing SET status = $1, payment_method = $2, transaction_id = $3, paid_at = $4
       WHERE billing_id = $5 RETURNING *`,
      [status, paymentMethod, transactionId, paidAt, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing not found.' });
    }

    res.json({ message: 'Billing status updated.', billing: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getAllBillings = async (req, res) => {
  const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT b.*, p.name as patient_name, a.scheduled_date, d.name as doctor_name
      FROM billing b
      JOIN patients p ON b.patient_id = p.patient_id
      JOIN appointments a ON b.appointment_id = a.appointment_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
    `;
    let countQuery = `SELECT COUNT(*) FROM billing b`;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`b.status = $${params.length + 1}`);
      params.push(status);
    }

    if (dateFrom) {
      conditions.push(`b.created_at >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`b.created_at <= $${params.length + 1}`);
      params.push(dateTo);
    }

    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

const getBillingStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_billings,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM billing
    `);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  createBilling,
  getBillingByAppointment,
  getPatientBillings,
  updateBillingStatus,
  getAllBillings,
  getBillingStats
};

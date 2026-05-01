const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM patients) as total_patients,
        (SELECT COUNT(*) FROM doctors) as total_doctors,
        (SELECT COUNT(*) FROM appointments WHERE status = 'pending') as pending_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'approved') as approved_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed') as completed_appointments,
        (SELECT COUNT(*) FROM appointments WHERE scheduled_date = CURRENT_DATE) as today_appointments,
        (SELECT SUM(amount) FROM billing WHERE status = 'paid') as total_revenue,
        (SELECT SUM(amount) FROM billing WHERE status = 'pending') as pending_revenue
    `);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getAppointmentTrends = async (req, res) => {
  const { days = 30 } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        DATE(scheduled_date) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM appointments
      WHERE scheduled_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(scheduled_date)
      ORDER BY date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getRevenueTrends = async (req, res) => {
  const { months = 12 } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as total_revenue,
        COUNT(*) as billing_count,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_revenue,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue
      FROM billing
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getDoctorPerformance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.doctor_id,
        d.name,
        d.specialization,
        COUNT(a.appointment_id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COALESCE(SUM(b.amount), 0) as total_revenue
      FROM doctors d
      LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
      LEFT JOIN billing b ON a.appointment_id = b.appointment_id AND b.status = 'paid'
      GROUP BY d.doctor_id, d.name, d.specialization
      ORDER BY total_appointments DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getSpecializationStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.specialization,
        COUNT(a.appointment_id) as appointment_count,
        COUNT(DISTINCT d.doctor_id) as doctor_count,
        AVG(b.amount) as avg_billing
      FROM doctors d
      LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
      LEFT JOIN billing b ON a.appointment_id = b.appointment_id
      WHERE d.specialization IS NOT NULL
      GROUP BY d.specialization
      ORDER BY appointment_count DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getPatientStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_patients_30d,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_patients_7d
      FROM patients
    `);

    const ageDistribution = await pool.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 18 THEN 'Under 18'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 18 AND 30 THEN '18-30'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 31 AND 50 THEN '31-50'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 51 AND 70 THEN '51-70'
          ELSE 'Over 70'
        END as age_group,
        COUNT(*) as count
      FROM patients
      WHERE date_of_birth IS NOT NULL
      GROUP BY age_group
      ORDER BY age_group
    `);

    res.json({
      ...result.rows[0],
      ageDistribution: ageDistribution.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const recordMetric = async (req, res) => {
  const { metricName, metricValue, metricData } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO system_metrics (metric_name, metric_value, metric_data)
       VALUES ($1, $2, $3) RETURNING *`,
      [metricName, metricValue, JSON.stringify(metricData)]
    );

    res.status(201).json({ message: 'Metric recorded.', metric: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getMetrics = async (req, res) => {
  const { metricName, dateFrom, dateTo } = req.query;

  try {
    let query = `SELECT * FROM system_metrics WHERE 1=1`;
    const params = [];

    if (metricName) {
      params.push(metricName);
      query += ` AND metric_name = $${params.length}`;
    }

    if (dateFrom) {
      params.push(dateFrom);
      query += ` AND recorded_at >= $${params.length}`;
    }

    if (dateTo) {
      params.push(dateTo);
      query += ` AND recorded_at <= $${params.length}`;
    }

    query += ` ORDER BY recorded_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  getDashboardStats,
  getAppointmentTrends,
  getRevenueTrends,
  getDoctorPerformance,
  getSpecializationStats,
  getPatientStats,
  recordMetric,
  getMetrics
};

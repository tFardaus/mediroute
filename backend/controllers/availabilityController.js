const pool = require('../config/db');

const setAvailability = async (req, res) => {
  const { dayOfWeek, startTime, endTime } = req.body;
  const doctorId = req.user.id;

  try {
    const existing = await pool.query(
      `SELECT * FROM doctor_availability WHERE doctor_id = $1 AND day_of_week = $2`,
      [doctorId, dayOfWeek]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE doctor_availability SET start_time = $1, end_time = $2, is_available = TRUE
         WHERE doctor_id = $3 AND day_of_week = $4 RETURNING *`,
        [startTime, endTime, doctorId, dayOfWeek]
      );
    } else {
      result = await pool.query(
        `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [doctorId, dayOfWeek, startTime, endTime]
      );
    }

    res.json({ message: 'Availability set.', availability: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getAvailability = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM doctor_availability WHERE doctor_id = $1 ORDER BY day_of_week, start_time`,
      [doctorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const deleteAvailability = async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM doctor_availability WHERE availability_id = $1 AND doctor_id = $2 RETURNING *`,
      [id, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability not found.' });
    }

    res.json({ message: 'Availability deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const addTimeOff = async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  const doctorId = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO doctor_time_off (doctor_id, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [doctorId, startDate, endDate, reason]
    );

    res.status(201).json({ message: 'Time off added.', timeOff: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getTimeOff = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM doctor_time_off WHERE doctor_id = $1 ORDER BY start_date DESC`,
      [doctorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const deleteTimeOff = async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM doctor_time_off WHERE time_off_id = $1 AND doctor_id = $2 RETURNING *`,
      [id, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time off not found.' });
    }

    res.json({ message: 'Time off deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const checkAvailability = async (req, res) => {
  const { doctorId, date } = req.query;

  try {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    const availability = await pool.query(
      `SELECT * FROM doctor_availability 
       WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = TRUE`,
      [doctorId, dayOfWeek]
    );

    const timeOff = await pool.query(
      `SELECT * FROM doctor_time_off 
       WHERE doctor_id = $1 AND $2 BETWEEN start_date AND end_date`,
      [doctorId, date]
    );

    const appointments = await pool.query(
      `SELECT scheduled_time FROM appointments 
       WHERE doctor_id = $1 AND scheduled_date = $2 AND status = 'approved'`,
      [doctorId, date]
    );

    const isAvailable = availability.rows.length > 0 && timeOff.rows.length === 0;
    const bookedSlots = appointments.rows.map(a => a.scheduled_time);

    res.json({
      isAvailable,
      availability: availability.rows[0] || null,
      bookedSlots,
      timeOff: timeOff.rows[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  setAvailability,
  getAvailability,
  deleteAvailability,
  addTimeOff,
  getTimeOff,
  deleteTimeOff,
  checkAvailability
};

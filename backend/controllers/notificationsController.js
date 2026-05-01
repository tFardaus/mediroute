const pool = require('../config/db');

const createNotification = async (userId, userRole, type, title, message, link = null) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, user_role, notification_type, title, message, link)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, userRole, type, title, message, link]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Notification creation error:', err);
    return null;
  }
};

const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { unreadOnly = false, limit = 50 } = req.query;

  try {
    let query = `SELECT * FROM notifications WHERE user_id = $1 AND user_role = $2`;
    
    if (unreadOnly === 'true') {
      query += ` AND is_read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT $3`;

    const result = await pool.query(query, [userId, userRole, limit]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE 
       WHERE notification_id = $1 AND user_id = $2 AND user_role = $3 RETURNING *`,
      [id, userId, userRole]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.json({ message: 'Notification marked as read.', notification: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE 
       WHERE user_id = $1 AND user_role = $2 AND is_read = FALSE`,
      [userId, userRole]
    );

    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE notification_id = $1 AND user_id = $2 AND user_role = $3 RETURNING *`,
      [id, userId, userRole]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getUnreadCount = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) as unread_count FROM notifications 
       WHERE user_id = $1 AND user_role = $2 AND is_read = FALSE`,
      [userId, userRole]
    );

    res.json({ unreadCount: parseInt(result.rows[0].unread_count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};

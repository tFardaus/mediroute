const pool = require('../config/db');

const sendMessage = async (req, res) => {
  const { receiverId, receiverRole, messageText } = req.body;
  const senderId = req.user.id;
  const senderRole = req.user.role;

  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, sender_role, receiver_id, receiver_role, message_text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [senderId, senderRole, receiverId, receiverRole, messageText]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`${receiverRole}_${receiverId}`).emit('new_message', result.rows[0]);
    }

    res.status(201).json({ message: 'Message sent.', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getConversation = async (req, res) => {
  const { userId, userRole } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND sender_role = $2 AND receiver_id = $3 AND receiver_role = $4)
          OR (sender_id = $3 AND sender_role = $4 AND receiver_id = $1 AND receiver_role = $2)
       ORDER BY created_at ASC`,
      [currentUserId, currentUserRole, userId, userRole]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getConversations = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id, other_user_role)
        CASE 
          WHEN sender_id = $1 AND sender_role = $2 THEN receiver_id
          ELSE sender_id
        END as other_user_id,
        CASE 
          WHEN sender_id = $1 AND sender_role = $2 THEN receiver_role
          ELSE sender_role
        END as other_user_role,
        message_text as last_message,
        created_at as last_message_time,
        is_read
       FROM messages
       WHERE (sender_id = $1 AND sender_role = $2) OR (receiver_id = $1 AND receiver_role = $2)
       ORDER BY other_user_id, other_user_role, created_at DESC`,
      [userId, userRole]
    );

    const conversations = await Promise.all(result.rows.map(async (conv) => {
      const userTable = conv.other_user_role === 'patient' ? 'patients' : 
                        conv.other_user_role === 'doctor' ? 'doctors' :
                        conv.other_user_role === 'receptionist' ? 'receptionists' : 'admins';
      const userIdCol = conv.other_user_role === 'patient' ? 'patient_id' :
                        conv.other_user_role === 'doctor' ? 'doctor_id' :
                        conv.other_user_role === 'receptionist' ? 'receptionist_id' : 'admin_id';

      const userInfo = await pool.query(
        `SELECT ${userIdCol} as id, name, email FROM ${userTable} WHERE ${userIdCol} = $1`,
        [conv.other_user_id]
      );

      return {
        ...conv,
        user: userInfo.rows[0]
      };
    }));

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const markAsRead = async (req, res) => {
  const { userId, userRole } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    await pool.query(
      `UPDATE messages SET is_read = TRUE 
       WHERE sender_id = $1 AND sender_role = $2 AND receiver_id = $3 AND receiver_role = $4 AND is_read = FALSE`,
      [userId, userRole, currentUserId, currentUserRole]
    );

    res.json({ message: 'Messages marked as read.' });
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
      `SELECT COUNT(*) as unread_count FROM messages 
       WHERE receiver_id = $1 AND receiver_role = $2 AND is_read = FALSE`,
      [userId, userRole]
    );

    res.json({ unreadCount: parseInt(result.rows[0].unread_count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount
};

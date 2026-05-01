const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLogger');
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount
} = require('../controllers/messagingController');

router.post('/', protect, auditMiddleware('SEND_MESSAGE', 'message'), sendMessage);
router.get('/conversation/:userId/:userRole', protect, getConversation);
router.get('/conversations', protect, getConversations);
router.patch('/read/:userId/:userRole', protect, markAsRead);
router.get('/unread-count', protect, getUnreadCount);

module.exports = router;

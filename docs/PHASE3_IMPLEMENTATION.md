# Phase 3 Implementation - Professional Polish

## Overview
Phase 3 adds professional features including real-time messaging, notifications, two-factor authentication, comprehensive error handling, and API documentation.

## Features Implemented

### 1. Real-time Messaging System
**Purpose:** Enable secure communication between patients and doctors

**Technology:** Socket.IO for WebSocket connections

**Database Table:**
- `messages` - Store all messages with sender/receiver info

**Features:**
- Real-time message delivery
- Conversation history
- Unread message tracking
- Message read receipts
- User presence (online/offline)

**API Endpoints:**
```
POST /api/messaging - Send message
GET /api/messaging/conversation/:userId/:userRole - Get conversation
GET /api/messaging/conversations - Get all conversations
PATCH /api/messaging/read/:userId/:userRole - Mark messages as read
GET /api/messaging/unread-count - Get unread message count
```

**Socket.IO Events:**
```javascript
// Client connects
socket.emit('join', { userId, role });

// Server sends new message
socket.on('new_message', (message) => {
  // Handle new message
});
```

**Message Format:**
```json
{
  "message_id": 1,
  "sender_id": 5,
  "sender_role": "patient",
  "receiver_id": 3,
  "receiver_role": "doctor",
  "message_text": "Hello doctor",
  "is_read": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 2. In-App Notifications System
**Purpose:** Keep users informed of important events

**Database Table:**
- `notifications` - Store all notifications

**Features:**
- Real-time notifications
- Notification types (appointment, message, billing, etc.)
- Read/unread status
- Notification links
- Bulk mark as read
- Delete notifications

**API Endpoints:**
```
GET /api/notifications - Get notifications
PATCH /api/notifications/:id/read - Mark as read
PATCH /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id - Delete notification
GET /api/notifications/unread-count - Get unread count
```

**Notification Types:**
- `new_appointment` - New appointment request
- `appointment_approved` - Appointment approved
- `appointment_rejected` - Appointment rejected
- `new_message` - New message received
- `billing_created` - New bill created
- `prescription_issued` - New prescription

**Notification Format:**
```json
{
  "notification_id": 1,
  "user_id": 5,
  "user_role": "patient",
  "notification_type": "appointment_approved",
  "title": "Appointment Approved",
  "message": "Your appointment with Dr. Smith has been approved",
  "is_read": false,
  "link": "/appointments/123",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 3. Two-Factor Authentication (2FA)
**Purpose:** Enhanced security for user accounts

**Technology:** Speakeasy (TOTP) + QRCode

**Database Table:**
- `two_factor_auth` - Store 2FA secrets and backup codes

**Features:**
- TOTP-based authentication
- QR code generation for authenticator apps
- 10 backup codes per user
- Enable/disable 2FA
- Backup code usage tracking

**API Endpoints:**
```
POST /api/two-factor/generate - Generate 2FA secret
POST /api/two-factor/enable - Enable 2FA
POST /api/two-factor/disable - Disable 2FA
POST /api/two-factor/verify - Verify 2FA token
GET /api/two-factor/status - Get 2FA status
```

**Setup Flow:**
1. User requests 2FA setup
2. Server generates secret and QR code
3. User scans QR code with authenticator app
4. User enters verification code
5. Server validates and enables 2FA
6. Server provides 10 backup codes

**Login Flow with 2FA:**
1. User enters email/password
2. If 2FA enabled, prompt for token
3. User enters 6-digit code or backup code
4. Server verifies token
5. Grant access if valid

**Supported Authenticator Apps:**
- Google Authenticator
- Microsoft Authenticator
- Authy
- Any TOTP-compatible app

---

### 4. Enhanced Error Handling
**Purpose:** Consistent error responses and better debugging

**Implementation:** Centralized error handling middleware

**Features:**
- Custom error classes
- Operational vs programming errors
- Development vs production error responses
- Stack traces in development
- 404 handler for unknown routes
- Async error wrapper

**Error Response Format:**
```json
{
  "status": "error",
  "message": "Resource not found",
  "stack": "Error stack (development only)"
}
```

**Usage:**
```javascript
const { AppError, asyncHandler } = require('./middleware/errorHandler');

// Throw operational error
throw new AppError('User not found', 404);

// Wrap async functions
router.get('/', asyncHandler(async (req, res) => {
  // Errors automatically caught
}));
```

---

### 5. API Documentation
**Purpose:** Interactive API documentation for developers

**Technology:** Swagger/OpenAPI 3.0

**Features:**
- Interactive API explorer
- Request/response examples
- Authentication testing
- Schema definitions
- Endpoint grouping by tags

**Access:** `http://localhost:5000/api-docs`

**Documentation Includes:**
- All 100+ endpoints
- Request parameters
- Response schemas
- Authentication requirements
- Error responses
- Example requests

**Tags:**
- Authentication
- Symptoms
- Appointments
- Doctor
- Admin
- Search
- Medical Records
- Availability
- Billing
- Analytics
- Reports
- Messaging
- Notifications
- Two-Factor Auth

---

## Database Schema Updates

Run this SQL to add Phase 3 tables:

```sql
-- Messaging
CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  receiver_id INT NOT NULL,
  receiver_role VARCHAR(50) NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON messages(sender_id, sender_role);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, receiver_role);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Notifications
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, user_role);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Two-Factor Authentication
CREATE TABLE two_factor_auth (
  tfa_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, user_role)
);

CREATE INDEX idx_tfa_user ON two_factor_auth(user_id, user_role);
```

---

## Installation

1. **Install new dependencies:**
```bash
cd backend
npm install socket.io speakeasy qrcode swagger-jsdoc swagger-ui-express
```

2. **Update database schema:**
```bash
psql -U postgres -d mediroute_db -f database/schema.sql
```

3. **Restart server:**
```bash
npm run dev
```

4. **Access API documentation:**
```
http://localhost:5000/api-docs
```

---

## Socket.IO Integration

### Server Setup:
```javascript
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    socket.join(`${data.role}_${data.userId}`);
  });
});
```

### Client Setup (React):
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.emit('join', { userId, role });

socket.on('new_message', (message) => {
  // Handle new message
});
```

---

## Security Enhancements

### 1. Two-Factor Authentication
- TOTP-based (Time-based One-Time Password)
- 30-second token validity
- 2-step verification window
- Backup codes for account recovery

### 2. Message Security
- Role-based access control
- Users can only view their own conversations
- Messages encrypted in transit (HTTPS)
- Audit logging for all messages

### 3. Notification Security
- Users can only view their own notifications
- Notification links validated
- XSS prevention in notification content

### 4. Error Handling
- No sensitive data in error messages
- Stack traces only in development
- Consistent error format

---

## Testing

### Test Messaging:
```bash
# Send message
curl -X POST http://localhost:5000/api/messaging \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": 3,
    "receiverRole": "doctor",
    "messageText": "Hello doctor"
  }'

# Get conversations
curl -X GET http://localhost:5000/api/messaging/conversations \
  -H "Authorization: Bearer PATIENT_TOKEN"
```

### Test Notifications:
```bash
# Get notifications
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer PATIENT_TOKEN"

# Mark as read
curl -X PATCH http://localhost:5000/api/notifications/1/read \
  -H "Authorization: Bearer PATIENT_TOKEN"
```

### Test 2FA:
```bash
# Generate secret
curl -X POST http://localhost:5000/api/two-factor/generate \
  -H "Authorization: Bearer PATIENT_TOKEN"

# Enable 2FA
curl -X POST http://localhost:5000/api/two-factor/enable \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'

# Verify token
curl -X POST http://localhost:5000/api/two-factor/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "userRole": "patient",
    "token": "123456"
  }'
```

---

## Performance Considerations

### Socket.IO Optimization
- Room-based message delivery
- Connection pooling
- Automatic reconnection
- Heartbeat mechanism

### Notification Optimization
- Indexed queries
- Pagination support
- Bulk operations
- Cleanup old notifications

### 2FA Optimization
- Token caching
- Rate limiting on verification
- Backup code validation

---

## API Documentation Features

### Interactive Testing
- Try endpoints directly from browser
- Authentication token input
- Request body editor
- Response viewer

### Schema Definitions
- Request/response models
- Data types
- Required fields
- Validation rules

### Examples
- Sample requests
- Sample responses
- Error examples
- Authentication examples

---

## Troubleshooting

**Socket.IO connection fails:**
- Check CORS configuration
- Verify server is running
- Check firewall settings
- Ensure client library version matches

**2FA QR code not scanning:**
- Ensure QR code is displayed correctly
- Try manual entry of secret
- Check authenticator app compatibility
- Verify time sync on device

**Notifications not appearing:**
- Check notification creation logic
- Verify user_id and user_role
- Check database indexes
- Ensure real-time updates working

**API docs not loading:**
- Verify swagger packages installed
- Check swagger configuration
- Ensure route is registered
- Check for JavaScript errors

---

## Best Practices

### Messaging
- Keep messages under 2000 characters
- Implement message pagination
- Add typing indicators
- Implement message search

### Notifications
- Limit notification retention (30-90 days)
- Batch notifications when possible
- Allow users to configure preferences
- Implement notification categories

### 2FA
- Enforce 2FA for admin accounts
- Provide clear setup instructions
- Store backup codes securely
- Allow 2FA reset via email

### Error Handling
- Log all errors
- Monitor error rates
- Provide helpful error messages
- Implement error recovery

---

## Future Enhancements

### Messaging
- File attachments
- Voice messages
- Video calls
- Message reactions
- Message editing/deletion

### Notifications
- Push notifications (mobile)
- Email digest
- SMS notifications
- Notification scheduling

### 2FA
- Biometric authentication
- Hardware key support
- SMS-based 2FA
- Email-based 2FA

### Documentation
- Code examples in multiple languages
- Postman collection
- GraphQL support
- Webhook documentation

---

## API Summary

### New Endpoints (Phase 3):

**Messaging:** 5 endpoints
**Notifications:** 5 endpoints
**Two-Factor Auth:** 5 endpoints

**Total New Endpoints:** 15

**Total Project Endpoints:** 95+

---

## Contributors
Document any team member contributions here.

# Phase 1 Implementation - Core Improvements

## Overview
Phase 1 adds critical security, compliance, and usability features to MediRoute.

## Features Implemented

### 1. Audit Logging System
**Purpose:** HIPAA compliance and security tracking

**Database Table:**
- `audit_logs` - Tracks all user actions with timestamps, IP addresses, and details
- Indexed for fast querying by user, resource, and date

**Implementation:**
- `middleware/auditLogger.js` - Automatic logging middleware
- Logs all CREATE, UPDATE, DELETE operations
- Captures user context, IP address, and request details

**Usage:**
```javascript
// Applied to routes automatically
router.post('/', auditMiddleware('CREATE_APPOINTMENT', 'appointment'), createAppointment);
```

**API Endpoint:**
- `GET /api/search/audit-logs` - Admin-only access to audit logs
- Supports filtering by user, role, action, resource type, and date range

---

### 2. Email Notification Service
**Purpose:** Keep users informed about appointment status changes

**Service:** `services/emailService.js`

**Email Types:**
1. **Appointment Confirmation** - Sent when receptionist approves appointment
2. **Appointment Rejection** - Sent when appointment is rejected
3. **Password Reset** - Secure password reset link
4. **Appointment Reminder** - Future implementation for scheduled reminders

**Configuration:**
Add to `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=MediRoute <noreply@mediroute.com>
FRONTEND_URL=http://localhost:5173
```

**Gmail Setup:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in EMAIL_PASSWORD

---

### 3. Password Reset Functionality
**Purpose:** Allow users to securely reset forgotten passwords

**Database Table:**
- `password_reset_tokens` - Stores secure reset tokens with expiration

**API Endpoints:**
- `POST /api/auth/request-password-reset` - Request reset link
  ```json
  {
    "email": "user@example.com",
    "role": "patient"
  }
  ```

- `POST /api/auth/reset-password` - Reset password with token
  ```json
  {
    "token": "secure_token_from_email",
    "newPassword": "newpassword123"
  }
  ```

**Security Features:**
- Tokens expire after 1 hour
- Tokens are single-use only
- Rate limited to 3 requests per hour
- Generic response to prevent email enumeration

---

### 4. Input Validation Middleware
**Purpose:** Prevent invalid data and security vulnerabilities

**Implementation:** `middleware/validation.js`

**Validations:**
- Email format validation
- Password strength requirements (min 6 characters)
- Phone number format validation
- Date and time format validation
- String length limits
- SQL injection prevention through parameterized queries

**Applied to all routes:**
- Registration, login, password reset
- Symptom submissions
- Appointment creation and updates
- Doctor notes and prescriptions
- Admin operations

---

### 5. Rate Limiting
**Purpose:** Prevent abuse and brute force attacks

**Implementation:** `middleware/rateLimiter.js`

**Limits:**
- **General API:** 100 requests per 15 minutes
- **Authentication:** 5 login attempts per 15 minutes
- **Password Reset:** 3 requests per hour

**Response when limit exceeded:**
```json
{
  "error": "Too many requests, please try again later."
}
```

---

### 6. Advanced Search and Filtering
**Purpose:** Efficient data retrieval for all roles

**API Endpoints:**

**Search Patients** (Admin, Receptionist, Doctor)
```
GET /api/search/patients?q=john&page=1&limit=20
```

**Search Doctors** (All authenticated users)
```
GET /api/search/doctors?q=smith&specialization=cardiology&page=1&limit=20
```

**Search Appointments** (Admin, Receptionist, Doctor)
```
GET /api/search/appointments?status=pending&doctorId=5&dateFrom=2024-01-01&dateTo=2024-12-31&page=1&limit=20
```

**View Audit Logs** (Admin only)
```
GET /api/search/audit-logs?userId=10&userRole=patient&action=CREATE&dateFrom=2024-01-01&page=1&limit=50
```

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Database Schema Updates

Run this SQL to add new tables:

```sql
-- Audit logging table
CREATE TABLE audit_logs (
  log_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, user_role);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  token_id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_email ON password_reset_tokens(email);
```

---

## Installation

1. **Install new dependencies:**
```bash
cd backend
npm install nodemailer express-validator express-rate-limit
```

2. **Update database schema:**
```bash
psql -U postgres -d mediroute -f database/schema.sql
```

3. **Update .env file:**
Add email configuration variables (see Email Notification Service section)

4. **Restart server:**
```bash
npm run dev
```

---

## Testing

### Test Password Reset:
```bash
# Request reset
curl -X POST http://localhost:5000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","role":"patient"}'

# Check email for token, then reset
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_EMAIL","newPassword":"newpass123"}'
```

### Test Search:
```bash
# Search doctors
curl -X GET "http://localhost:5000/api/search/doctors?specialization=cardiology" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Rate Limiting:
Try logging in 6 times with wrong password - should be blocked on 6th attempt

---

## Security Improvements

1. **Input Validation** - All user inputs are validated and sanitized
2. **Rate Limiting** - Prevents brute force attacks
3. **Audit Logging** - Complete trail of all actions for compliance
4. **Secure Password Reset** - Time-limited, single-use tokens
5. **Email Verification** - Confirms user identity for password resets
6. **SQL Injection Prevention** - Parameterized queries throughout
7. **XSS Prevention** - Input sanitization and validation

---

## API Changes Summary

### New Endpoints:
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `GET /api/search/patients`
- `GET /api/search/doctors`
- `GET /api/search/appointments`
- `GET /api/search/audit-logs`

### Modified Endpoints:
All existing endpoints now include:
- Input validation
- Rate limiting
- Audit logging (for write operations)
- Better error messages

---

## Next Steps (Phase 2)

Phase 2 will add:
1. Medical records management
2. Doctor availability scheduling
3. Analytics dashboard
4. PDF report generation
5. Billing system

---

## Troubleshooting

**Email not sending:**
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Verify Gmail app password is correct
- Check firewall allows port 587

**Rate limit too strict:**
- Adjust values in `middleware/rateLimiter.js`
- Increase `max` value for more requests

**Validation errors:**
- Check request body matches validation rules
- Ensure all required fields are present
- Verify data types match expectations

---

## Contributors
Document any team member contributions here.

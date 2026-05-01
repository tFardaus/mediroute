# MediRoute - Healthcare Appointment Management System

A comprehensive healthcare appointment management system with AI-powered medical triage, real-time messaging, billing, analytics, and complete medical records management.

## Current Version: 3.0.0 (All Phases Complete)

### Project Highlights
- AI-powered symptom analysis and specialist recommendations
- Complete appointment lifecycle management
- Medical records and patient history tracking
- Real-time messaging between patients and doctors
- Comprehensive billing system with PDF invoices
- Advanced analytics dashboard
- Two-factor authentication
- HIPAA-compliant audit logging
- Interactive API documentation

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Project](#running-the-project)
8. [Project Structure](#project-structure)
9. [API Documentation](#api-documentation)
10. [User Roles](#user-roles)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **PostgreSQL** - Database (with JSONB support)
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Groq AI API** - LLaMA 3 for symptom analysis
- **Nodemailer** - Email service
- **Express Validator** - Input validation
- **Express Rate Limit** - API protection
- **Multer** - File uploads
- **PDFKit** - PDF generation
- **Speakeasy** - Two-factor authentication
- **Swagger/OpenAPI** - API documentation
- **Bcrypt** - Password hashing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Context API** - State management
- **Socket.IO Client** - Real-time updates

---

## Features

### Phase 1: Core Improvements
- HIPAA-compliant audit logging
- Email notification system
- Password reset functionality
- Input validation and sanitization
- Rate limiting and API protection
- Advanced search and filtering with pagination

### Phase 2: Advanced Features
- Medical records management with file uploads
- Patient medical history tracking
- Allergy management
- Doctor availability scheduling
- Time off management
- Comprehensive billing system with itemized charges
- Analytics dashboard with trends
- PDF report generation (prescriptions, medical reports, invoices)

### Phase 3: Professional Polish
- Real-time messaging system
- In-app notifications
- Two-factor authentication (TOTP)
- Enhanced error handling
- Interactive API documentation (Swagger)
- Socket.IO integration

---

## Prerequisites

Before you begin, ensure you have the following installed:

### 1. Node.js (v18 or higher)
- Download from: https://nodejs.org
- Choose the **LTS** version
- After installing, verify:
  ```bash
  node -v
  npm -v
  ```

### 2. Git
- Download from: https://git-scm.com/downloads
- After installing, verify:
  ```bash
  git --version
  ```
- Configure Git (first time only):
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

### 3. PostgreSQL (v14 or higher)
- Download from: https://www.postgresql.org/download
- During installation:
  - Set a password for the `postgres` user (remember this!)
  - Keep the default port: `5432`
  - Install pgAdmin (comes with PostgreSQL)
- After installing, verify:
  ```bash
  psql --version
  ```

### 4. VS Code (Recommended)
- Download from: https://code.visualstudio.com
- Recommended extensions:
  - ESLint
  - Prettier
  - PostgreSQL (by Chris Kolkman)
  - REST Client

### 5. Gmail Account (for email features)
- You'll need a Gmail account to send emails
- You'll need to generate an App Password (instructions below)

---

## Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/tFardaus/mediroute.git
cd mediroute
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

This will install all required packages:
- express, cors, dotenv
- pg (PostgreSQL client)
- bcryptjs, jsonwebtoken
- nodemailer
- express-validator, express-rate-limit
- multer, pdfkit
- socket.io
- speakeasy, qrcode
- swagger-jsdoc, swagger-ui-express
- axios (for Groq AI)

### Step 3: Install Frontend Dependencies (Optional - if you have frontend)
```bash
cd ../frontend
npm install
```

---

## Database Setup

### Step 1: Create the Database

**Option A: Using Command Line**
```bash
# Open PostgreSQL command line
psql -U postgres

# Enter your postgres password when prompted
# Then run:
CREATE DATABASE mediroute_db;

# Verify database was created
\l

# Exit psql
\q
```

**Option B: Using pgAdmin**
1. Open pgAdmin
2. Connect to PostgreSQL server
3. Right-click on "Databases"
4. Select "Create" → "Database"
5. Name it: `mediroute_db`
6. Click "Save"

### Step 2: Run the Schema

Navigate to the project root directory and run:

```bash
psql -U postgres -d mediroute_db -f database/schema.sql
```

Enter your postgres password when prompted.

This creates all 23 tables:
- User tables (patients, doctors, receptionists, admins)
- Core tables (appointments, prescriptions, etc.)
- Phase 1 tables (audit_logs, password_reset_tokens)
- Phase 2 tables (medical_records, billing, analytics)
- Phase 3 tables (messages, notifications, two_factor_auth)

### Step 3: Seed Admin Account

```bash
psql -U postgres -d mediroute_db
```

Then run this SQL:
```sql
INSERT INTO admins (name, email, password_hash)
VALUES ('Admin', 'admin@mediroute.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
```

Exit psql:
```sql
\q
```

**Default Admin Credentials:**
- Email: `admin@mediroute.com`
- Password: `password`
- **IMPORTANT:** Change this password after first login!

### Step 4: Verify Database Setup

```bash
psql -U postgres -d mediroute_db -c "\dt"
```

You should see 23 tables listed.

---

## Environment Configuration

### Step 1: Create .env File

Navigate to the `backend/` folder and create a file named `.env`:

```bash
cd backend
```

Create the file (Windows):
```bash
type nul > .env
```

Or (Mac/Linux):
```bash
touch .env
```

### Step 2: Configure Environment Variables

Open `.env` in your text editor and add:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mediroute_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Secret (use a long random string)
JWT_SECRET=mediroute_super_secret_jwt_key_2024_change_this_in_production

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here
EMAIL_FROM=MediRoute <noreply@mediroute.com>

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 3: Get Groq API Key

1. Go to: https://console.groq.com
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in `GROQ_API_KEY`

### Step 4: Setup Gmail App Password

**Important:** You cannot use your regular Gmail password. You must create an App Password.

1. Go to your Google Account: https://myaccount.google.com
2. Click on "Security" in the left sidebar
3. Enable "2-Step Verification" if not already enabled
4. After enabling 2FA, go back to Security
5. Click on "App passwords" (you'll see this after enabling 2FA)
6. Select "Mail" and "Other (Custom name)"
7. Name it "MediRoute"
8. Click "Generate"
9. Copy the 16-character password (no spaces)
10. Paste it in `EMAIL_PASSWORD` in your .env file

### Step 5: Create Upload Directories

```bash
# Make sure you're in the backend directory
cd backend

# Windows
mkdir uploads
mkdir uploads\medical-records
mkdir uploads\prescriptions
mkdir uploads\reports
mkdir uploads\invoices

# Mac/Linux
mkdir -p uploads/medical-records
mkdir -p uploads/prescriptions
mkdir -p uploads/reports
mkdir -p uploads/invoices
```

---

## Running the Project

### Step 1: Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Server running on http://localhost:5000
API Documentation available at http://localhost:5000/api-docs
Connected to PostgreSQL database
```

### Step 2: Test the Server

Open your browser and go to:
```
http://localhost:5000
```

You should see:
```json
{
  "message": "MediRoute API is running!",
  "version": "3.0.0",
  "documentation": "/api-docs"
}
```

### Step 3: Access API Documentation

Go to:
```
http://localhost:5000/api-docs
```

You'll see the interactive Swagger documentation with all 95+ endpoints.

### Step 4: Start the Frontend (Optional)

If you have the frontend:

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## Project Structure

```
mediroute/
├── backend/
│   ├── config/
│   │   ├── db.js                          # PostgreSQL connection
│   │   └── swagger.js                     # API documentation config
│   ├── controllers/
│   │   ├── adminController.js             # Admin operations
│   │   ├── analyticsController.js         # Analytics & metrics
│   │   ├── appointmentController.js       # Appointment management
│   │   ├── authController.js              # Authentication & password reset
│   │   ├── availabilityController.js      # Doctor scheduling
│   │   ├── billingController.js           # Payment management
│   │   ├── doctorController.js            # Doctor operations
│   │   ├── medicalRecordsController.js    # Medical records
│   │   ├── messagingController.js         # Real-time messaging
│   │   ├── notificationsController.js     # In-app notifications
│   │   ├── searchController.js            # Advanced search
│   │   ├── symptomController.js           # AI symptom analysis
│   │   └── twoFactorController.js         # 2FA
│   ├── middleware/
│   │   ├── auth.js                        # JWT verification
│   │   ├── auditLogger.js                 # HIPAA audit logging
│   │   ├── errorHandler.js                # Error handling
│   │   ├── rateLimiter.js                 # Rate limiting
│   │   └── validation.js                  # Input validation
│   ├── routes/
│   │   ├── admin.js                       # Admin routes
│   │   ├── analytics.js                   # Analytics routes
│   │   ├── appointment.js                 # Appointment routes
│   │   ├── auth.js                        # Auth routes
│   │   ├── availability.js                # Scheduling routes
│   │   ├── billing.js                     # Billing routes
│   │   ├── doctor.js                      # Doctor routes
│   │   ├── medicalRecords.js              # Medical records routes
│   │   ├── messaging.js                   # Messaging routes
│   │   ├── notifications.js               # Notification routes
│   │   ├── reports.js                     # PDF generation routes
│   │   ├── search.js                      # Search routes
│   │   ├── symptoms.js                    # Symptom routes
│   │   └── twoFactor.js                   # 2FA routes
│   ├── services/
│   │   ├── emailService.js                # Email notifications
│   │   ├── groqService.js                 # AI integration
│   │   └── pdfService.js                  # PDF generation
│   ├── uploads/                           # File storage
│   │   ├── medical-records/
│   │   ├── prescriptions/
│   │   ├── reports/
│   │   └── invoices/
│   ├── .env                               # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js                          # Main server file
├── database/
│   └── schema.sql                         # Database schema (23 tables)
├── docs/
│   ├── PHASE1_IMPLEMENTATION.md           # Phase 1 documentation
│   ├── PHASE2_IMPLEMENTATION.md           # Phase 2 documentation
│   ├── PHASE3_IMPLEMENTATION.md           # Phase 3 documentation
│   └── PROJECT_STRUCTURE.md               # Complete project overview
├── frontend/                              # React frontend
├── .gitignore
└── README.md                              # This file
```

---

## API Documentation

### Access Interactive Documentation
```
http://localhost:5000/api-docs
```

### API Endpoint Summary

**Total Endpoints:** 95+

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Authentication | 4 | Register, Login, Password Reset |
| Symptoms | 2 | AI symptom analysis |
| Appointments | 6 | Full appointment lifecycle |
| Doctor | 4 | Notes, Prescriptions |
| Admin | 5 | User management, Stats |
| Search | 4 | Advanced filtering |
| Medical Records | 9 | Records, History, Allergies |
| Availability | 7 | Doctor scheduling |
| Billing | 6 | Payment management |
| Analytics | 8 | Dashboard, Trends |
| Reports | 3 | PDF generation |
| Messaging | 5 | Real-time chat |
| Notifications | 5 | In-app notifications |
| Two-Factor Auth | 5 | 2FA management |

### Quick API Test

```bash
# Register a patient
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "role": "patient"
  }'

# Submit symptoms (use token from login)
curl -X POST http://localhost:5000/api/symptoms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symptomsText": "I have a headache and fever for 2 days"
  }'
```

---

## User Roles

### 1. Patient
**Capabilities:**
- Register and login
- Submit symptoms for AI analysis
- Request appointments
- Cancel pending appointments
- View appointments and prescriptions
- View medical records and history
- View allergies
- Message doctors
- View notifications
- View billing
- Download reports
- Enable 2FA

**Default Test Account:** Create via registration

### 2. Doctor
**Capabilities:**
- Login
- View approved appointments
- Add consultation notes
- Issue prescriptions
- Upload medical records
- Add medical history
- Manage allergies
- Set availability schedule
- Manage time off
- Message patients
- View notifications
- Generate PDFs
- Enable 2FA

**Default Test Account:** Must be created by admin

### 3. Receptionist
**Capabilities:**
- Login
- View pending appointments
- Approve/reject appointments
- Search patients and appointments
- Upload medical records
- Create billing
- Update billing status
- View analytics dashboard
- Enable 2FA

**Default Test Account:** Must be created by admin

### 4. Admin
**Capabilities:**
- Full system access
- Add/remove doctors
- Add receptionists
- View all analytics
- Access audit logs
- System configuration
- Enable 2FA

**Default Account:**
- Email: `admin@mediroute.com`
- Password: `password`

---

## Database Schema

### Total Tables: 23

**User Tables (4):**
- `patients` - Patient accounts
- `doctors` - Doctor accounts
- `receptionists` - Receptionist accounts
- `admins` - Admin accounts

**Core Tables (5):**
- `symptom_submissions` - Patient symptoms
- `ai_recommendations` - AI analysis results
- `appointments` - Appointment records
- `doctor_notes` - Consultation notes
- `prescriptions` - Medication prescriptions

**Phase 1 Tables (2):**
- `audit_logs` - HIPAA compliance logging
- `password_reset_tokens` - Password reset tokens

**Phase 2 Tables (9):**
- `medical_records` - Uploaded documents
- `patient_medical_history` - Medical conditions
- `allergies` - Patient allergies
- `doctor_availability` - Weekly schedules
- `doctor_time_off` - Vacation periods
- `billing` - Payment records
- `billing_items` - Itemized charges
- `system_metrics` - Analytics data

**Phase 3 Tables (3):**
- `messages` - Real-time messaging
- `notifications` - In-app notifications
- `two_factor_auth` - 2FA secrets

---

## Testing

### 1. Test Database Connection
```bash
psql -U postgres -d mediroute_db -c "SELECT COUNT(*) FROM patients;"
```

### 2. Test Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mediroute.com",
    "password": "password",
    "role": "admin"
  }'
```

### 3. Test Patient Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "patient@test.com",
    "password": "test123",
    "phone": "1234567890",
    "dateOfBirth": "1990-01-01"
  }'
```

### 4. Test AI Symptom Analysis
First login as patient, then:
```bash
curl -X POST http://localhost:5000/api/symptoms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symptomsText": "I have chest pain and shortness of breath"
  }'
```

### 5. Test File Upload
```bash
curl -X POST http://localhost:5000/api/medical-records/upload \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -F "file=@test.pdf" \
  -F "patientId=1" \
  -F "recordType=lab_result" \
  -F "title=Blood Test Results"
```

### 6. Test Analytics Dashboard
```bash
curl -X GET http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 7. Test Real-time Messaging
Use the Swagger UI at `/api-docs` to test messaging endpoints interactively.

---

## Troubleshooting

### Database Issues

**Problem:** `psql: command not found`
**Solution:** Add PostgreSQL to your system PATH
- Windows: Add `C:\Program Files\PostgreSQL\16\bin` to PATH
- Mac: `brew install postgresql`
- Linux: `sudo apt-get install postgresql`

**Problem:** `password authentication failed for user "postgres"`
**Solution:** 
- Check your password in `.env` matches PostgreSQL password
- Reset postgres password if needed:
  ```bash
  psql -U postgres
  ALTER USER postgres PASSWORD 'newpassword';
  ```

**Problem:** `database "mediroute_db" does not exist`
**Solution:** Create the database:
  ```bash
  psql -U postgres -c "CREATE DATABASE mediroute_db;"
  ```

### Server Issues

**Problem:** `Port 5000 already in use`
**Solution:** 
- Change PORT in `.env` to 5001 or another port
- Or kill the process using port 5000:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -ti:5000 | xargs kill`

**Problem:** `Cannot find module 'express'`
**Solution:** Install dependencies:
  ```bash
  cd backend
  npm install
  ```

**Problem:** `Error: connect ECONNREFUSED`
**Solution:** PostgreSQL is not running
- Windows: Start PostgreSQL service from Services
- Mac: `brew services start postgresql`
- Linux: `sudo service postgresql start`

### Email Issues

**Problem:** Email not sending
**Solution:**
- Verify you're using Gmail App Password, not regular password
- Enable 2FA on Gmail account first
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`
- Test with a simple email first

**Problem:** `Invalid login: 535-5.7.8 Username and Password not accepted`
**Solution:**
- Generate new App Password from Google Account
- Make sure no spaces in the password
- Use the 16-character app password, not your Gmail password

### File Upload Issues

**Problem:** File upload fails
**Solution:**
- Check uploads directory exists: `ls backend/uploads`
- Create if missing: `mkdir -p backend/uploads/medical-records`
- Check file size is under 10MB
- Verify file type is allowed (jpg, png, pdf, doc, docx)

### AI/Groq Issues

**Problem:** `AI service unavailable`
**Solution:**
- Check GROQ_API_KEY in `.env`
- Verify API key is valid at https://console.groq.com
- Check internet connection
- Verify Groq service status

### Socket.IO Issues

**Problem:** Real-time messaging not working
**Solution:**
- Check CORS configuration in server.js
- Verify Socket.IO client version matches server
- Check browser console for connection errors
- Ensure server is running

### 2FA Issues

**Problem:** QR code not scanning
**Solution:**
- Try manual entry of the secret key
- Ensure authenticator app is TOTP-compatible
- Check device time is synced
- Try Google Authenticator or Microsoft Authenticator

---

## Performance Tips

### Database Optimization
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('mediroute_db'));

-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM;
```

### Clear Old Data
```sql
-- Delete old audit logs (older than 90 days)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old notifications (older than 30 days)
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Security Best Practices

1. **Change Default Passwords**
   - Change admin password immediately after first login
   - Use strong passwords (12+ characters)

2. **Enable 2FA**
   - Enable 2FA for all admin accounts
   - Encourage doctors to enable 2FA

3. **Secure .env File**
   - Never commit `.env` to Git
   - Use different secrets for production
   - Rotate JWT_SECRET periodically

4. **HTTPS in Production**
   - Use SSL/TLS certificates
   - Redirect HTTP to HTTPS
   - Use secure cookies

5. **Regular Backups**
   ```bash
   # Backup database
   pg_dump -U postgres mediroute_db > backup.sql
   
   # Restore database
   psql -U postgres mediroute_db < backup.sql
   ```

---

## Development Workflow

### Adding a New Feature
1. Create a new branch: `git checkout -b feature/feature-name`
2. Make changes
3. Test thoroughly
4. Commit: `git commit -m "feat: add feature description"`
5. Push: `git push origin feature/feature-name`
6. Create Pull Request

### Commit Convention
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code restructuring
- `test:` - Testing
- `chore:` - Maintenance

---

## Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_PASSWORD=strong_production_password
JWT_SECRET=very_long_random_string_for_production
FRONTEND_URL=https://your-domain.com
```

### Deployment Checklist
- [ ] Change all default passwords
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Enable rate limiting
- [ ] Review security settings

---

## Documentation

- [Phase 1 Implementation](docs/PHASE1_IMPLEMENTATION.md) - Audit logging, Email, Password reset
- [Phase 2 Implementation](docs/PHASE2_IMPLEMENTATION.md) - Medical records, Billing, Analytics
- [Phase 3 Implementation](docs/PHASE3_IMPLEMENTATION.md) - Messaging, Notifications, 2FA
- [Complete Project Structure](docs/PROJECT_STRUCTURE.md) - Full system overview

---

## Support

For issues or questions:
- Email: support@mediroute.com
- GitHub Issues: https://github.com/tFardaus/mediroute/issues
- Documentation: http://localhost:5000/api-docs

---

## License
[Specify license]

## Team
[Add team member names and roles]

---

## Version History

- **v3.0.0** (Current) - Phase 3 Complete
  - Real-time messaging
  - In-app notifications
  - Two-factor authentication
  - API documentation
  - Enhanced error handling

- **v2.0.0** - Phase 2 Complete
  - Medical records management
  - Billing system
  - Analytics dashboard
  - PDF generation

- **v1.0.0** - Phase 1 Complete
  - Audit logging
  - Email notifications
  - Password reset
  - Advanced search

- **v0.1.0** - Initial Release
  - Core appointment system
  - AI symptom analysis
  - Basic authentication

---

**Last Updated:** January 2024
**Total Endpoints:** 95+
**Total Tables:** 23
**Total Features:** 50+

**Project Status:** Production Ready ✅

For support, contact: support@mediroute.com

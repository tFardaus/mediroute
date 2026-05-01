# MediRoute - Complete Project Structure (After Phase 2)

## Project Overview
Healthcare appointment management system with AI-powered medical triage, medical records, billing, analytics, and comprehensive reporting. Supports 4 user roles: Patient, Doctor, Receptionist, and Admin.

---

## Technology Stack

### Backend
- Node.js + Express.js
- PostgreSQL (with JSONB support)
- JWT Authentication
- Groq AI API (LLaMA 3)
- Nodemailer (Email service)
- Express Validator (Input validation)
- Express Rate Limit (API protection)
- Multer (File uploads)
- PDFKit (PDF generation)

### Frontend
- React 18
- Vite
- React Router
- Context API (State management)

---

## Complete Directory Structure

```
mediroute/
├── backend/
│   ├── config/
│   │   └── db.js                          # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── adminController.js             # Admin operations
│   │   ├── analyticsController.js         # Phase 2: Analytics & metrics
│   │   ├── appointmentController.js       # Appointments + email notifications
│   │   ├── authController.js              # Register, login, password reset
│   │   ├── availabilityController.js      # Phase 2: Doctor scheduling
│   │   ├── billingController.js           # Phase 2: Payment management
│   │   ├── doctorController.js            # Notes, prescriptions
│   │   ├── medicalRecordsController.js    # Phase 2: Medical records
│   │   ├── searchController.js            # Advanced search & filtering
│   │   └── symptomController.js           # AI symptom analysis
│   ├── middleware/
│   │   ├── auth.js                        # JWT verification + role guards
│   │   ├── auditLogger.js                 # HIPAA compliance logging
│   │   ├── rateLimiter.js                 # API rate limiting
│   │   └── validation.js                  # Input validation rules
│   ├── routes/
│   │   ├── admin.js                       # Admin endpoints
│   │   ├── analytics.js                   # Phase 2: Analytics routes
│   │   ├── appointment.js                 # Appointment endpoints
│   │   ├── auth.js                        # Auth endpoints + password reset
│   │   ├── availability.js                # Phase 2: Scheduling routes
│   │   ├── billing.js                     # Phase 2: Billing routes
│   │   ├── doctor.js                      # Doctor endpoints
│   │   ├── medicalRecords.js              # Phase 2: Medical records routes
│   │   ├── reports.js                     # Phase 2: PDF generation routes
│   │   ├── search.js                      # Search endpoints
│   │   └── symptoms.js                    # Symptom submission endpoints
│   ├── services/
│   │   ├── emailService.js                # Email notifications
│   │   ├── groqService.js                 # AI recommendation service
│   │   └── pdfService.js                  # Phase 2: PDF generation
│   ├── uploads/                           # Phase 2: File storage
│   │   ├── medical-records/
│   │   ├── prescriptions/
│   │   ├── reports/
│   │   └── invoices/
│   ├── .env                               # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js                          # Express app entry point
├── database/
│   └── schema.sql                         # Complete database schema
├── docs/
│   ├── PHASE1_IMPLEMENTATION.md           # Phase 1 documentation
│   ├── PHASE2_IMPLEMENTATION.md           # Phase 2 documentation
│   └── PROJECT_STRUCTURE.md               # This file
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx         # Route protection by role
│   │   ├── context/
│   │   │   └── AuthContext.jsx            # Global auth state
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   │   └── Dashboard.jsx          # Admin dashboard
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx              # Login page
│   │   │   │   └── Register.jsx           # Patient registration
│   │   │   ├── Doctor/
│   │   │   │   └── Dashboard.jsx          # Doctor dashboard
│   │   │   ├── Patient/
│   │   │   │   └── Dashboard.jsx          # Patient dashboard
│   │   │   └── Receptionist/
│   │   │       └── Dashboard.jsx          # Receptionist dashboard
│   │   ├── services/
│   │   │   └── api.js                     # Axios API client
│   │   ├── App.jsx                        # Main app component
│   │   ├── index.css                      # Global styles
│   │   └── main.jsx                       # React entry point
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── .gitignore
└── README.md                              # Main project documentation
```

---

## Database Schema (20 Tables)

### User Tables
1. **patients** - Patient accounts and profiles
2. **doctors** - Doctor accounts with specializations
3. **receptionists** - Receptionist accounts
4. **admins** - Admin accounts

### Core Feature Tables
5. **symptom_submissions** - Patient symptom descriptions
6. **ai_recommendations** - AI-generated specialist suggestions
7. **appointments** - Appointment lifecycle management
8. **doctor_notes** - Consultation notes
9. **prescriptions** - Medication prescriptions

### Phase 1 Tables
10. **audit_logs** - HIPAA compliance tracking
11. **password_reset_tokens** - Secure password reset

### Phase 2 Tables
12. **medical_records** - Uploaded medical documents
13. **patient_medical_history** - Diagnoses and conditions
14. **allergies** - Patient allergies
15. **doctor_availability** - Weekly schedules
16. **doctor_time_off** - Vacation and unavailable dates
17. **billing** - Payment records
18. **billing_items** - Itemized charges
19. **system_metrics** - Analytics data

---

## API Endpoints (Complete List - 80+ Endpoints)

### Authentication (`/api/auth`) - 4 endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register as patient |
| POST | `/login` | Public | Login (all roles) |
| POST | `/request-password-reset` | Public | Request password reset |
| POST | `/reset-password` | Public | Reset password with token |

### Symptoms (`/api/symptoms`) - 2 endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Patient | Submit symptoms for AI analysis |
| GET | `/:id` | Patient | Get symptom submission + AI result |

### Appointments (`/api/appointments`) - 6 endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Patient | Request appointment |
| DELETE | `/:id` | Patient | Cancel appointment |
| GET | `/my` | Patient | View my appointments |
| GET | `/pending` | Receptionist | View pending appointments |
| PATCH | `/:id` | Receptionist | Approve/reject appointment |
| GET | `/doctor` | Doctor | View my approved appointments |

### Doctor (`/api/doctor`) - 4 endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/notes` | Doctor | Add consultation note |
| POST | `/prescriptions` | Doctor | Issue prescription |
| GET | `/prescriptions/my` | Patient | View my prescriptions |
| GET | `/notes/:appointmentId` | Doctor/Patient | View appointment notes |

### Admin (`/api/admin`) - 5 endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/doctors` | Admin | Add doctor |
| DELETE | `/doctors/:id` | Admin | Remove doctor |
| POST | `/receptionists` | Admin | Add receptionist |
| GET | `/doctors` | Admin | List all doctors |
| GET | `/stats` | Admin | System statistics |

### Search (`/api/search`) - 4 endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/patients` | Admin/Receptionist/Doctor | Search patients |
| GET | `/doctors` | All authenticated | Search doctors |
| GET | `/appointments` | Admin/Receptionist/Doctor | Filter appointments |
| GET | `/audit-logs` | Admin | View audit logs |

### Medical Records (`/api/medical-records`) - 9 endpoints (Phase 2)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/upload` | Doctor/Receptionist | Upload medical document |
| GET | `/patient/:patientId` | Doctor/Patient | Get patient records |
| DELETE | `/:id` | Doctor/Admin | Delete record |
| POST | `/history` | Doctor | Add medical history |
| GET | `/history/:patientId` | Doctor/Patient | Get medical history |
| PUT | `/history/:id` | Doctor | Update history |
| POST | `/allergies` | Doctor | Add allergy |
| GET | `/allergies/:patientId` | Doctor/Patient | Get allergies |
| DELETE | `/allergies/:id` | Doctor | Delete allergy |

### Availability (`/api/availability`) - 7 endpoints (Phase 2)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Doctor | Set availability |
| GET | `/:doctorId` | All authenticated | Get doctor schedule |
| DELETE | `/:id` | Doctor | Remove availability |
| POST | `/time-off` | Doctor | Add time off |
| GET | `/time-off/:doctorId` | All authenticated | Get time off |
| DELETE | `/time-off/:id` | Doctor | Remove time off |
| GET | `/check/availability` | All authenticated | Check availability |

### Billing (`/api/billing`) - 6 endpoints (Phase 2)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Receptionist/Admin | Create billing |
| GET | `/appointment/:appointmentId` | All authenticated | Get billing |
| GET | `/patient/:patientId` | Patient/Receptionist/Admin | Get patient billings |
| PATCH | `/:id` | Receptionist/Admin | Update billing status |
| GET | `/all/list` | Receptionist/Admin | Get all billings |
| GET | `/stats/summary` | Admin | Get billing stats |

### Analytics (`/api/analytics`) - 8 endpoints (Phase 2)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Admin/Receptionist | Dashboard stats |
| GET | `/appointments/trends` | Admin/Receptionist | Appointment trends |
| GET | `/revenue/trends` | Admin | Revenue trends |
| GET | `/doctors/performance` | Admin | Doctor performance |
| GET | `/specializations/stats` | Admin | Specialization stats |
| GET | `/patients/stats` | Admin | Patient demographics |
| POST | `/metrics` | Admin | Record custom metric |
| GET | `/metrics` | Admin | Get metrics |

### Reports (`/api/reports`) - 3 endpoints (Phase 2)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/prescription/:prescriptionId` | All authenticated | Download prescription PDF |
| GET | `/medical-report/:patientId` | Doctor/Patient | Download medical report PDF |
| GET | `/invoice/:billingId` | All authenticated | Download invoice PDF |

---

## Key Features

### Core Features
- Multi-role authentication system
- AI-powered symptom triage
- Appointment lifecycle management
- Doctor notes and prescriptions
- Admin dashboard with statistics

### Phase 1 Features
- HIPAA-compliant audit logging
- Email notification system
- Password reset functionality
- Input validation and sanitization
- Rate limiting and API protection
- Advanced search and filtering
- Pagination support

### Phase 2 Features (NEW)
- Medical records management with file uploads
- Patient medical history tracking
- Allergy management
- Doctor availability scheduling
- Time off management
- Comprehensive billing system
- Itemized billing
- Analytics dashboard
- Performance metrics
- PDF report generation (prescriptions, medical reports, invoices)

---

## User Roles & Permissions

### Patient
- Register and login
- Submit symptoms for AI analysis
- Request appointments
- Cancel pending appointments
- View own appointments
- View own prescriptions
- View appointment notes
- View own medical records (Phase 2)
- View own medical history (Phase 2)
- View own allergies (Phase 2)
- View own billing (Phase 2)
- Download own reports (Phase 2)

### Doctor
- Login
- View approved appointments
- Add consultation notes
- Issue prescriptions
- Search patients
- Upload medical records (Phase 2)
- Add medical history (Phase 2)
- Manage allergies (Phase 2)
- Set availability schedule (Phase 2)
- Manage time off (Phase 2)
- View patient medical data (Phase 2)
- Generate prescriptions PDF (Phase 2)

### Receptionist
- Login
- View pending appointments
- Approve/reject appointments
- Search patients and appointments
- Manage appointment scheduling
- Upload medical records (Phase 2)
- Create billing (Phase 2)
- Update billing status (Phase 2)
- View analytics dashboard (Phase 2)

### Admin
- Login
- Add/remove doctors
- Add receptionists
- View system statistics
- Search all data
- View audit logs
- Full system access
- Delete medical records (Phase 2)
- Manage billing (Phase 2)
- View all analytics (Phase 2)
- Access all reports (Phase 2)

---

## Environment Variables

```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mediroute_db
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_secret_key

# AI Service
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-8b-8192

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=MediRoute <noreply@mediroute.com>

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git
- Gmail account (for email service)

### Quick Start
```bash
# Clone repository
git clone https://github.com/tFardaus/mediroute.git
cd mediroute

# Setup database
psql -U postgres
CREATE DATABASE mediroute_db;
\q
psql -U postgres -d mediroute_db -f database/schema.sql

# Setup backend
cd backend
npm install
# Configure .env file
mkdir -p uploads/medical-records uploads/prescriptions uploads/reports uploads/invoices
npm run dev

# Setup frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Testing Checklist

### Phase 1 Testing
- [ ] User registration with validation
- [ ] Login with rate limiting
- [ ] Password reset flow
- [ ] Email notifications
- [ ] Search with pagination
- [ ] Audit logs

### Phase 2 Testing
- [ ] Upload medical records
- [ ] Add medical history
- [ ] Manage allergies
- [ ] Set doctor availability
- [ ] Create billing with items
- [ ] View analytics dashboard
- [ ] Generate prescription PDF
- [ ] Generate medical report PDF
- [ ] Generate invoice PDF

---

## Performance Considerations

### Database Indexes (19 indexes)
- All foreign keys indexed
- Composite indexes on frequently queried columns
- Date-based indexes for time-series queries
- JSONB indexes for metrics

### File Storage
- Organized directory structure
- 10MB file size limit
- Allowed types: images, PDFs, documents
- Consider cloud storage for production

### PDF Generation
- Generated on-demand
- Cached in uploads directory
- Consider background job processing for large reports

---

## Security Features

1. **Authentication & Authorization**
   - JWT tokens (7-day expiration)
   - Role-based access control
   - Protected routes

2. **Input Validation**
   - All inputs validated
   - File type and size validation
   - SQL injection prevention
   - XSS prevention

3. **Rate Limiting**
   - General API: 100 req/15min
   - Auth: 5 req/15min
   - Password reset: 3 req/hour

4. **Audit Logging**
   - All actions logged
   - HIPAA compliance
   - Admin-accessible trail

5. **File Security**
   - Type validation
   - Size limits
   - Secure storage
   - Access control

---

## Future Enhancements (Phase 3)

Phase 3 will add:
1. Real-time messaging between patients and doctors
2. Telemedicine video integration
3. Two-factor authentication
4. Advanced analytics with charts
5. Multi-language support
6. Mobile app support
7. SMS notifications
8. Appointment reminders automation
9. Insurance integration
10. Lab results integration

---

## Troubleshooting

### Common Issues
1. **Database connection fails**
   - Check PostgreSQL is running
   - Verify DB credentials in .env

2. **Email not sending**
   - Use Gmail app password
   - Enable 2FA on Gmail

3. **File upload fails**
   - Check uploads directory exists
   - Verify file size under 10MB
   - Check file type is allowed

4. **PDF generation fails**
   - Check uploads directory permissions
   - Verify pdfkit is installed
   - Check database records exist

5. **Analytics queries slow**
   - Ensure indexes are created
   - Use pagination
   - Consider caching

---

## Contributing

### Branch Strategy
- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Convention
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code restructuring
- `test:` - Testing

---

## License
[Specify license]

## Team
[Add team member names and roles]

---

Last Updated: Phase 2 Complete
Version: 2.0.0

# Phase 2 Implementation - Advanced Features

## Overview
Phase 2 adds advanced healthcare management features including medical records, scheduling, billing, analytics, and PDF reporting.

## Features Implemented

### 1. Medical Records Management
**Purpose:** Comprehensive patient medical data storage and retrieval

**Database Tables:**
- `medical_records` - Store uploaded files (lab results, imaging, documents)
- `patient_medical_history` - Track diagnoses and conditions
- `allergies` - Record patient allergies with severity levels

**Features:**
- File upload with validation (images, PDFs, documents)
- 10MB file size limit
- Medical history tracking with status (active, resolved, chronic)
- Allergy management with severity levels
- Doctor attribution for all entries

**API Endpoints:**

**Medical Records:**
```
POST /api/medical-records/upload - Upload medical document
GET /api/medical-records/patient/:patientId - Get all records for patient
DELETE /api/medical-records/:id - Delete medical record
```

**Medical History:**
```
POST /api/medical-records/history - Add medical history entry
GET /api/medical-records/history/:patientId - Get patient medical history
PUT /api/medical-records/history/:id - Update history entry
```

**Allergies:**
```
POST /api/medical-records/allergies - Add allergy
GET /api/medical-records/allergies/:patientId - Get patient allergies
DELETE /api/medical-records/allergies/:id - Delete allergy
```

---

### 2. Doctor Availability Scheduling
**Purpose:** Manage doctor schedules and time off

**Database Tables:**
- `doctor_availability` - Weekly schedule by day of week
- `doctor_time_off` - Vacation and unavailable dates

**Features:**
- Set weekly availability (day of week + time range)
- Manage time off periods
- Check availability for specific dates
- Conflict detection with existing appointments
- Booked slot tracking

**API Endpoints:**
```
POST /api/availability - Set availability for a day
GET /api/availability/:doctorId - Get doctor's weekly schedule
DELETE /api/availability/:id - Remove availability slot

POST /api/availability/time-off - Add time off period
GET /api/availability/time-off/:doctorId - Get doctor's time off
DELETE /api/availability/time-off/:id - Remove time off

GET /api/availability/check/availability?doctorId=X&date=YYYY-MM-DD - Check availability
```

**Response Format:**
```json
{
  "isAvailable": true,
  "availability": {
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "17:00"
  },
  "bookedSlots": ["10:00", "14:00"],
  "timeOff": null
}
```

---

### 3. Billing System
**Purpose:** Track payments and generate invoices

**Database Tables:**
- `billing` - Main billing records
- `billing_items` - Itemized billing details

**Features:**
- Create billing with itemized charges
- Track payment status (pending, paid, cancelled, refunded)
- Payment method and transaction ID tracking
- Patient billing history
- Revenue statistics

**API Endpoints:**
```
POST /api/billing - Create new billing
GET /api/billing/appointment/:appointmentId - Get billing for appointment
GET /api/billing/patient/:patientId - Get patient billing history
PATCH /api/billing/:id - Update billing status
GET /api/billing/all/list - Get all billings with filters
GET /api/billing/stats/summary - Get billing statistics
```

**Create Billing Request:**
```json
{
  "appointmentId": 1,
  "patientId": 5,
  "amount": 150.00,
  "items": [
    {
      "description": "Consultation",
      "quantity": 1,
      "unitPrice": 100.00,
      "totalPrice": 100.00
    },
    {
      "description": "Lab Test",
      "quantity": 1,
      "unitPrice": 50.00,
      "totalPrice": 50.00
    }
  ]
}
```

---

### 4. Analytics Dashboard
**Purpose:** System-wide metrics and performance tracking

**Database Tables:**
- `system_metrics` - Custom metric storage with JSONB data

**Features:**
- Dashboard statistics (patients, appointments, revenue)
- Appointment trends over time
- Revenue trends by month
- Doctor performance metrics
- Specialization statistics
- Patient demographics
- Custom metric recording

**API Endpoints:**
```
GET /api/analytics/dashboard - Overall system stats
GET /api/analytics/appointments/trends?days=30 - Appointment trends
GET /api/analytics/revenue/trends?months=12 - Revenue trends
GET /api/analytics/doctors/performance - Doctor performance
GET /api/analytics/specializations/stats - Specialization breakdown
GET /api/analytics/patients/stats - Patient demographics

POST /api/analytics/metrics - Record custom metric
GET /api/analytics/metrics?metricName=X - Get metrics
```

**Dashboard Response:**
```json
{
  "total_patients": 150,
  "total_doctors": 12,
  "pending_appointments": 8,
  "approved_appointments": 25,
  "completed_appointments": 200,
  "today_appointments": 5,
  "total_revenue": 15000.00,
  "pending_revenue": 1200.00
}
```

---

### 5. PDF Report Generation
**Purpose:** Generate professional PDF documents

**Service:** `services/pdfService.js` using PDFKit

**Features:**
- Prescription PDFs with doctor and patient info
- Medical report PDFs with full patient history
- Invoice PDFs with itemized billing
- Automatic file storage in uploads directory
- Download endpoints for all reports

**API Endpoints:**
```
GET /api/reports/prescription/:prescriptionId - Download prescription PDF
GET /api/reports/medical-report/:patientId - Download medical report PDF
GET /api/reports/invoice/:billingId - Download invoice PDF
```

**PDF Contents:**

**Prescription:**
- Doctor information
- Patient information
- Medication details
- Dosage and instructions
- Date and signature area

**Medical Report:**
- Patient demographics
- Complete medical history
- Allergies list
- Recent prescriptions
- Generated date

**Invoice:**
- Invoice number and date
- Patient information
- Appointment details
- Itemized charges
- Total amount
- Payment status

---

## Database Schema Updates

Run this SQL to add Phase 2 tables:

```sql
-- Medical Records
CREATE TABLE medical_records (
  record_id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('lab_result', 'imaging', 'diagnosis', 'allergy', 'immunization', 'other')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_type VARCHAR(50),
  file_size INT,
  uploaded_by_role VARCHAR(50) NOT NULL,
  uploaded_by_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_type ON medical_records(record_type);

-- Medical History
CREATE TABLE patient_medical_history (
  history_id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  condition_name VARCHAR(200) NOT NULL,
  diagnosed_date DATE,
  status VARCHAR(50) CHECK (status IN ('active', 'resolved', 'chronic')),
  notes TEXT,
  added_by_doctor_id INT REFERENCES doctors(doctor_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patient_history ON patient_medical_history(patient_id);

-- Allergies
CREATE TABLE allergies (
  allergy_id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  allergen VARCHAR(200) NOT NULL,
  reaction TEXT,
  severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
  added_by_doctor_id INT REFERENCES doctors(doctor_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_allergies_patient ON allergies(patient_id);

-- Doctor Availability
CREATE TABLE doctor_availability (
  availability_id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctor_availability ON doctor_availability(doctor_id, day_of_week);

-- Time Off
CREATE TABLE doctor_time_off (
  time_off_id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctor_time_off ON doctor_time_off(doctor_id, start_date, end_date);

-- Billing
CREATE TABLE billing (
  billing_id SERIAL PRIMARY KEY,
  appointment_id INT NOT NULL REFERENCES appointments(appointment_id),
  patient_id INT NOT NULL REFERENCES patients(patient_id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_billing_appointment ON billing(appointment_id);
CREATE INDEX idx_billing_patient ON billing(patient_id);
CREATE INDEX idx_billing_status ON billing(status);

-- Billing Items
CREATE TABLE billing_items (
  item_id SERIAL PRIMARY KEY,
  billing_id INT NOT NULL REFERENCES billing(billing_id) ON DELETE CASCADE,
  description VARCHAR(200) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_items ON billing_items(billing_id);

-- System Metrics
CREATE TABLE system_metrics (
  metric_id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15, 2),
  metric_data JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name, recorded_at);
```

---

## Installation

1. **Install new dependencies:**
```bash
cd backend
npm install multer pdfkit
```

2. **Update database schema:**
```bash
psql -U postgres -d mediroute_db -f database/schema.sql
```

3. **Create upload directories:**
```bash
mkdir -p backend/uploads/medical-records
mkdir -p backend/uploads/prescriptions
mkdir -p backend/uploads/reports
mkdir -p backend/uploads/invoices
```

4. **Restart server:**
```bash
npm run dev
```

---

## File Upload Configuration

**Allowed File Types:**
- Images: JPEG, JPG, PNG
- Documents: PDF, DOC, DOCX

**File Size Limit:** 10MB

**Storage Location:** `backend/uploads/medical-records/`

**File Naming:** `{timestamp}-{originalname}`

---

## Security Considerations

1. **File Upload Security:**
   - File type validation
   - Size limits enforced
   - Secure file naming
   - Access control by role

2. **Medical Data Access:**
   - Doctors can view all patient records
   - Patients can only view their own records
   - All access logged in audit_logs

3. **Billing Security:**
   - Only receptionist and admin can create/modify billing
   - Patients can view their own billing
   - All transactions logged

4. **PDF Generation:**
   - Files stored securely
   - Access controlled by authentication
   - Automatic cleanup recommended

---

## Testing

### Test Medical Records:
```bash
# Upload file
curl -X POST http://localhost:5000/api/medical-records/upload \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -F "file=@test.pdf" \
  -F "patientId=1" \
  -F "recordType=lab_result" \
  -F "title=Blood Test Results"
```

### Test Availability:
```bash
# Set availability
curl -X POST http://localhost:5000/api/availability \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00"}'
```

### Test Billing:
```bash
# Create billing
curl -X POST http://localhost:5000/api/billing \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "patientId": 5,
    "amount": 150.00,
    "items": [{"description": "Consultation", "quantity": 1, "unitPrice": 100, "totalPrice": 100}]
  }'
```

### Test Analytics:
```bash
# Get dashboard stats
curl -X GET http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test PDF Generation:
```bash
# Download prescription
curl -X GET http://localhost:5000/api/reports/prescription/1 \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  --output prescription.pdf
```

---

## Performance Optimization

1. **Database Indexes:**
   - All foreign keys indexed
   - Composite indexes on frequently queried columns
   - Date-based indexes for time-series queries

2. **File Storage:**
   - Organized directory structure
   - Automatic file naming
   - Consider cloud storage for production

3. **PDF Generation:**
   - Generated on-demand
   - Cached in uploads directory
   - Consider background job processing

---

## Next Steps (Phase 3)

Phase 3 will add:
1. Real-time messaging system
2. Telemedicine integration
3. Two-factor authentication
4. Advanced analytics with charts
5. Multi-language support

---

## Troubleshooting

**File upload fails:**
- Check uploads directory exists and has write permissions
- Verify file size is under 10MB
- Ensure file type is allowed

**PDF generation fails:**
- Check uploads directory permissions
- Verify pdfkit is installed
- Check database records exist

**Analytics queries slow:**
- Ensure indexes are created
- Consider adding more specific indexes
- Use pagination for large datasets

**Billing calculations incorrect:**
- Verify decimal precision in database
- Check item calculations before saving
- Validate total matches sum of items

---

## API Summary

### New Endpoints (Phase 2):

**Medical Records:** 9 endpoints
**Availability:** 7 endpoints
**Billing:** 6 endpoints
**Analytics:** 8 endpoints
**Reports:** 3 endpoints

**Total New Endpoints:** 33

---

## Contributors
Document any team member contributions here.

-- Create all MediRoute tables

CREATE TABLE patients (
  patient_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admins (
  admin_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doctors (
  doctor_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  specialization VARCHAR(100),
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE receptionists (
  receptionist_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE symptom_submissions (
  submission_id SERIAL PRIMARY KEY,
  symptoms_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE
);

CREATE TABLE ai_recommendations (
  recommendation_id SERIAL PRIMARY KEY,
  suggested_specialization VARCHAR(100),
  reasoning TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  submission_id INT UNIQUE REFERENCES symptom_submissions(submission_id)
);

CREATE TABLE appointments (
  appointment_id SERIAL PRIMARY KEY,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date DATE,
  scheduled_time TIME,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','completed')),
  patient_id INT REFERENCES patients(patient_id),
  doctor_id INT REFERENCES doctors(doctor_id),
  submission_id INT REFERENCES symptom_submissions(submission_id)
);

CREATE TABLE doctor_notes (
  note_id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  appointment_id INT REFERENCES appointments(appointment_id),
  doctor_id INT REFERENCES doctors(doctor_id)
);

CREATE TABLE prescriptions (
  prescription_id SERIAL PRIMARY KEY,
  medication VARCHAR(200) NOT NULL,
  dosage VARCHAR(100),
  instructions TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  appointment_id INT REFERENCES appointments(appointment_id),
  doctor_id INT REFERENCES doctors(doctor_id)
);

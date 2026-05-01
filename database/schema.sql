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

CREATE TABLE doctor_time_off (
  time_off_id SERIAL PRIMARY KEY,
  doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctor_time_off ON doctor_time_off(doctor_id, start_date, end_date);

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

CREATE TABLE system_metrics (
  metric_id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15, 2),
  metric_data JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name, recorded_at);

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

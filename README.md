# 🏥 MediRoute

A healthcare appointment management system with AI-powered medical triage.
Patients describe their symptoms, AI suggests the right specialist, and the system manages the full appointment lifecycle across 4 roles: **Patient, Doctor, Receptionist, and Admin**.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **AI:** Groq API

---

## ✅ Prerequisites — Install These First

### 1. Node.js
- Download from: https://nodejs.org (choose the **LTS** version)
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
- Set up your identity (do this once):
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

### 3. PostgreSQL
- Download from: https://www.postgresql.org/download
- During installation:
  - Set a password for the `postgres` user — **remember this password**
  - Keep the default port: `5432`
- After installing, verify by opening **pgAdmin** (installed alongside PostgreSQL) or run:
  ```bash
  psql -U postgres
  ```

### 4. VS Code (recommended)
- Download from: https://code.visualstudio.com

---

## 📥 Getting the Project

### 1. Clone the repository
```bash
git clone https://github.com/tFardaus/mediroute.git
cd mediroute
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

---

## 🗄️ Database Setup

### 1. Create the database
Open a terminal and run:
```bash
psql -U postgres
```
Then inside the PostgreSQL shell:
```sql
CREATE DATABASE mediroute;
\q
```

### 2. Run the schema
From the root of the project:
```bash
psql -U postgres -d mediroute -f database/schema.sql
```
This will create all the required tables.

### 3. Seed an admin account
You need at least one admin to manage the system. Run this in psql:
```bash
psql -U postgres -d mediroute
```
```sql
INSERT INTO admins (name, email, password_hash)
VALUES (
  'Admin',
  'admin@mediroute.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);
\q
```
> This sets the admin password to: `password` — change it after first login.

---

## ⚙️ Environment Variables

Create a `.env` file inside the `backend/` folder:
```bash
cd backend
```
Create a file named `.env` and paste the following:
```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=mediroute
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

JWT_SECRET=your_super_secret_key_here

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192
```

Replace:
- `your_postgres_password_here` → the password you set during PostgreSQL installation
- `your_super_secret_key_here` → any long random string (e.g. `mediroute_jwt_secret_2024`)
- `your_groq_api_key_here` → get a free key from https://console.groq.com

> ⚠️ Never commit the `.env` file. It's already in `.gitignore`.

---

##  Running the Project

```bash
cd backend
npm run dev
```

You should see:
```
Server running on http://localhost:5000
✅ Connected to PostgreSQL database
```

Test it by visiting: http://localhost:5000 — you should see:
```json
{ "message": " MediRoute API is running!" }
```

---

## 📡 API Overview

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register as patient |
| POST | `/api/auth/login` | Public | Login (all roles) |
| POST | `/api/symptoms` | Patient | Submit symptoms for AI analysis |
| GET | `/api/symptoms/:id` | Patient | Get symptom submission + AI result |
| POST | `/api/appointments` | Patient | Request an appointment |
| DELETE | `/api/appointments/:id` | Patient | Cancel an appointment |
| GET | `/api/appointments/my` | Patient | View my appointments |
| GET | `/api/appointments/pending` | Receptionist | View pending appointments |
| PATCH | `/api/appointments/:id` | Receptionist | Approve or reject appointment |
| GET | `/api/appointments/doctor` | Doctor | View my approved appointments |
| POST | `/api/doctor/notes` | Doctor | Add consultation note |
| POST | `/api/doctor/prescriptions` | Doctor | Issue prescription |
| GET | `/api/doctor/prescriptions/my` | Patient | View my prescriptions |
| GET | `/api/doctor/notes/:appointmentId` | Doctor/Patient | View appointment notes |
| POST | `/api/admin/doctors` | Admin | Add a doctor |
| DELETE | `/api/admin/doctors/:id` | Admin | Remove a doctor |
| POST | `/api/admin/receptionists` | Admin | Add a receptionist |
| GET | `/api/admin/doctors` | Admin | List all doctors |
| GET | `/api/admin/stats` | Admin | System statistics |

---

## 🤝 Contributing

### Workflow (follow this every time)

#### 1. Make sure your local repo is up to date
```bash
git checkout main
git pull origin main
```

#### 2. Create a new branch for your feature
```bash
git checkout -b feature/your-feature-name
```
Examples:
```bash
git checkout -b feature/patient-dashboard
git checkout -b feature/login-page
git checkout -b fix/appointment-bug
```

#### 3. Make your changes, then stage and commit
```bash
git add .
git commit -m "feat: add patient dashboard UI"
```

#### 4. Push your branch to GitHub
```bash
git push origin feature/your-feature-name
```

#### 5. Open a Pull Request
- Go to https://github.com/tFardaus/mediroute
- Click **"Compare & pull request"**
- Add a clear title and description of what you did
- Request a review from a teammate
- Wait for approval before merging

---

## 🌿 Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| New feature | `feature/name` | `feature/doctor-dashboard` |
| Bug fix | `fix/name` | `fix/login-error` |
| UI work | `ui/name` | `ui/appointment-card` |
| Database | `db/name` | `db/add-indexes` |

---

## 💬 Commit Message Convention

```
feat: add new feature
fix: fix a bug
ui: update styling or layout
refactor: restructure code without changing behavior
docs: update documentation
```

---

## 📁 Project Structure

```
mediroute/
├── backend/
│   ├── config/
│   │   └── db.js              # PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.js  # Register & login
│   │   ├── appointmentController.js
│   │   ├── doctorController.js
│   │   ├── adminController.js
│   │   └── symptomController.js
│   ├── middleware/
│   │   └── auth.js            # JWT protect + roleGuard
│   ├── routes/
│   │   ├── auth.js
│   │   ├── appointment.js
│   │   ├── doctor.js
│   │   ├── admin.js
│   │   └── symptoms.js
│   ├── services/
│   │   └── groqService.js     # Groq AI integration
│   ├── .env                   # ⚠️ Not committed — create manually
│   ├── package.json
│   └── server.js
├── database/
│   └── schema.sql             # All table definitions
├── frontend/                  
└── README.md
```

---

##  Common Issues

**`psql` is not recognized as a command**
> Add PostgreSQL to your system PATH. Search "Environment Variables" in Windows, find `Path`, and add: `C:\Program Files\PostgreSQL\17\bin`

**`Cannot find module` error**
> You forgot to run `npm install`. Do it inside the `backend/` folder.

**`password authentication failed for user "postgres"`**
> Your `.env` file has the wrong `DB_PASSWORD`. Double-check the password you set during PostgreSQL installation.

**Port 5000 already in use**
> Change `PORT=5000` to `PORT=5001` in your `.env` file.

---



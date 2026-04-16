import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const NAV = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Patients', icon: 'people' },
  { label: 'Appointments', icon: 'calendar_month' },
  { label: 'Analytics', icon: 'analytics' },
  { label: 'Billing', icon: 'payments' },
  { label: 'Settings', icon: 'settings' },
]

const SAMPLE_RX = [
  { initials: 'LM', colorClass: 'bg-[#62d0ff]/20 text-[#62d0ff]', patient: 'Ariyan Khan',    medication: 'Atorvastatin', dosage: '20mg • Daily',  date: '22 Feb 2024' },
  { initials: 'CW', colorClass: 'bg-purple-500/20 text-purple-400', patient: 'Ishrag Hossain', medication: 'Lisinopril',   dosage: '10mg • Daily',  date: '21 Feb 2024' },
  { initials: 'JB', colorClass: 'bg-red-500/20 text-red-400',    patient: 'Javed Bari',     medication: 'Amiodarone',   dosage: '200mg • Once', date: '20 Feb 2024' },
]

const AVATAR_COLORS = [
  'bg-[#62d0ff]/20 text-[#62d0ff]',
  'bg-purple-500/20 text-purple-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-orange-500/20 text-orange-400',
  'bg-pink-500/20 text-pink-400',
]

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = String(t).split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`
}

function formatDate(d) {
  if (!d) return null
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return null }
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [sideActive, setSideActive]         = useState('Dashboard')
  const [appointments, setAppointments]     = useState([])
  const [activeApt, setActiveApt]           = useState(null)
  const [activeTab, setActiveTab]           = useState('CONSULTATION NOTES')
  const [note, setNote]                     = useState('')
  const [expandedId, setExpandedId]         = useState(null)
  const [medName, setMedName]               = useState('')
  const [medDosage, setMedDosage]           = useState('')
  const [medFreq, setMedFreq]               = useState('Once daily')
  const [medInstructions, setMedInstructions] = useState('')
  const [autosaving, setAutosaving]         = useState(false)
  const [toast, setToast]                   = useState('')
  const [recentRx, setRecentRx]             = useState([])
  const [docPatients, setDocPatients]       = useState([])
  const [aptHistory, setAptHistory]         = useState([])
  const [profileForm, setProfileForm]       = useState({ name: user.name || '', email: user.email || '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [profileSaving, setProfileSaving]   = useState(false)

  function logout() { localStorage.clear(); navigate('/login') }

  async function saveProfile() {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword)
      return showToast('New passwords do not match.')
    setProfileSaving(true)
    try {
      const { data } = await api.put('/auth/profile', {
        name: profileForm.name,
        email: profileForm.email,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
      })
      const updated = { ...user, name: data.user.name, email: data.user.email }
      localStorage.setItem('user', JSON.stringify(updated))
      setProfileForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
      showToast('Profile updated successfully!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile.')
    } finally { setProfileSaving(false) }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { loadAppointments(); loadRecentRx(); loadDocPatients(); loadAptHistory() }, [])

  async function loadAppointments() {
    try {
      const { data } = await api.get('/appointments/doctor')
      const apts = data?.appointments || data || []
      setAppointments(apts)
      setActiveApt(apts[0] || null)
    } catch {
      setAppointments([])
      setActiveApt(null)
    }
  }

  async function loadRecentRx() {
    try {
      const { data } = await api.get('/doctor/prescriptions/mine')
      setRecentRx(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function loadDocPatients() {
    try { const { data } = await api.get('/doctor/patients'); setDocPatients(Array.isArray(data) ? data : []) } catch {}
  }

  async function loadAptHistory() {
    try { const { data } = await api.get('/appointments/doctor/history'); setAptHistory(Array.isArray(data) ? data : []) } catch {}
  }

  // Auto-save indicator while typing notes
  useEffect(() => {
    if (!note) return
    setAutosaving(true)
    const t = setTimeout(() => setAutosaving(false), 1500)
    return () => clearTimeout(t)
  }, [note])

  async function saveNote(e) {
    e && e.preventDefault()
    if (!activeApt || !note.trim()) return
    try {
      await api.post('/doctor/notes', {
        appointmentId: activeApt.appointment_id,
        content: note,
      })
      showToast('Note saved!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save note')
    }
  }

  async function issuePrescription(e) {
    e && e.preventDefault()
    if (!activeApt) return
    if (!medName.trim()) { showToast('Medication name is required'); return }
    const instructionText = [medFreq, medInstructions].filter(Boolean).join(' — ')
    try {
      await api.post('/doctor/prescriptions', {
        appointmentId: activeApt.appointment_id,
        medication: medName,
        dosage: medDosage || null,
        instructions: instructionText,
      })
      showToast('Prescription transmitted!')
      setMedName(''); setMedDosage(''); setMedInstructions('')
      loadRecentRx()
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to issue prescription')
    }
  }

  async function selectApt(apt) {
    setActiveApt(apt)
    setNote('')
    setMedName('')
    setMedDosage('')
    setMedInstructions('')
    try {
      const { data } = await api.get(`/doctor/notes/${apt.appointment_id}`)
      const rows = Array.isArray(data) ? data : []
      if (rows.length > 0) setNote(rows[0].content)
    } catch { /* no notes yet */ }
    setActiveTab('CONSULTATION NOTES')
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#080d18' }}>

      {/* ─── Sidebar ─── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col"
        style={{ background: '#0b1120', borderRight: '1px solid rgba(98,208,255,0.07)' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#62d0ff] to-[#3a7bd5] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-sm">medical_services</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-wide font-serif italic">MediRoute</p>
            <p className="text-[#a0aace] text-[9px] tracking-widest uppercase">Clinical Intelligence</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 mt-2">
          {NAV.map(item => (
            <button
              key={item.label}
              onClick={() => setSideActive(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                sideActive === item.label
                  ? 'bg-[#62d0ff]/10 text-[#62d0ff]'
                  : 'text-[#a0aace] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom profile + logout */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(98,208,255,0.07)' }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#62d0ff]/20 flex items-center justify-center text-[#62d0ff] font-bold text-xs flex-shrink-0">
              {user.name?.charAt(0) || 'D'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name || 'Doctor'}</p>
              <p className="text-[#a0aace] text-[9px] tracking-widest uppercase">Clinical Intelligence</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#a0aace] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ─── Settings Panel ─── */}
      {sideActive === 'Settings' && (
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-10" style={{ background: '#090e1c' }}>
          <h2 className="text-white font-bold text-xl mb-1">Profile Settings</h2>
          <p className="text-[#a0aace] text-xs tracking-widest uppercase mb-8">Manage your account details and password</p>

          <div className="max-w-lg space-y-8">
            {/* Account Info */}
            <div className="rounded-2xl p-7" style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.08)' }}>
              <h3 className="text-[#62d0ff] text-xs font-bold uppercase tracking-widest mb-5">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#a0aace] mb-1.5">Full Name</label>
                  <input
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-[#0b1120] border border-[#62d0ff]/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#62d0ff]/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#a0aace] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-[#0b1120] border border-[#62d0ff]/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#62d0ff]/40"
                  />
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="rounded-2xl p-7" style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.08)' }}>
              <h3 className="text-[#62d0ff] text-xs font-bold uppercase tracking-widest mb-5">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#a0aace] mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={profileForm.currentPassword}
                    onChange={e => setProfileForm(f => ({ ...f, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full bg-[#0b1120] border border-[#62d0ff]/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5578] focus:outline-none focus:border-[#62d0ff]/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#a0aace] mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={profileForm.newPassword}
                    onChange={e => setProfileForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    className="w-full bg-[#0b1120] border border-[#62d0ff]/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5578] focus:outline-none focus:border-[#62d0ff]/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#a0aace] mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={e => setProfileForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    className="w-full bg-[#0b1120] border border-[#62d0ff]/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5578] focus:outline-none focus:border-[#62d0ff]/40"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60 transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #62d0ff 0%, #3a7bd5 100%)' }}
            >
              {profileSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Main ─── */}
      {sideActive !== 'Settings' && (
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: '#0b1120', borderBottom: '1px solid rgba(98,208,255,0.07)' }}
        >
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              Dr. {user.name || 'Doctor'}{' '}
              <span className="text-[#a0aace] font-normal">— {user.specialization || 'Cardiologist'}</span>
            </h1>
            <p className="text-[#a0aace] text-[10px] tracking-widest uppercase mt-0.5">
              {appointments.length} Patients Scheduled For Today
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5578] text-sm">search</span>
              <input
                type="text"
                placeholder="Search patient history..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm text-[#a0aace] bg-[#0f1928] border border-[#62d0ff]/10 focus:outline-none focus:border-[#62d0ff]/30 w-56 placeholder-[#4a5578] transition-colors"
              />
            </div>
            {[
              { icon: 'notifications' },
              { icon: 'history_edu' },
            ].map(({ icon }) => (
              <button
                key={icon}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#a0aace] hover:text-[#62d0ff] hover:bg-[#62d0ff]/10 transition-all"
                style={{ border: '1px solid rgba(98,208,255,0.1)' }}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </button>
            ))}
            <div className="w-9 h-9 rounded-full bg-[#62d0ff]/20 flex items-center justify-center text-[#62d0ff] font-bold text-sm">
              {user.name?.charAt(0) || 'D'}
            </div>
          </div>
        </header>

        {/* Stats row */}
        <div
          className="grid grid-cols-4 gap-4 px-6 py-4 flex-shrink-0"
          style={{ background: '#0b1120', borderBottom: '1px solid rgba(98,208,255,0.07)' }}
        >
          {/* Today's Appointments */}
          <div className="rounded-2xl p-4" style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.08)' }}>
            <p className="text-[#a0aace] text-[10px] tracking-widest uppercase mb-2">Today's Appointments</p>
            <p className="text-white font-bold text-2xl mb-2">{appointments.length}</p>
            <div className="h-1 rounded-full" style={{ background: 'rgba(98,208,255,0.12)' }}>
              <div
                className="h-full rounded-full bg-[#62d0ff]"
                style={{ width: `${Math.min(appointments.length * 8, 100)}%`, transition: 'width 0.4s ease' }}
              />
            </div>
          </div>

          {/* Total Patients */}
          <div className="rounded-2xl p-4" style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.08)' }}>
            <p className="text-[#a0aace] text-[10px] tracking-widest uppercase mb-2">Total Patients</p>
            <p className="text-white font-bold text-2xl mb-1">1,284</p>
            <span className="text-[10px] bg-[#62d0ff]/10 text-[#62d0ff] px-2 py-0.5 rounded-full font-semibold">New: 847</span>
          </div>

          {/* Prescriptions Issued */}
          <div className="rounded-2xl p-4" style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.08)' }}>
            <p className="text-[#a0aace] text-[10px] tracking-widest uppercase mb-2">Prescriptions Issued</p>
            <p className="text-white font-bold text-2xl">42</p>
          </div>

          {/* Notes Written */}
          <div className="rounded-2xl p-4" style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.08)' }}>
            <p className="text-[#a0aace] text-[10px] tracking-widest uppercase mb-2">Notes Written</p>
            <p className="text-white font-bold text-2xl mb-1">156</p>
            <span className="text-[10px] bg-[#a0aace]/10 text-[#a0aace] px-2 py-0.5 rounded-full font-semibold">0 pending</span>
          </div>
        </div>

        {/* Timeline + Consultation */}
        <div className="flex-1 px-6 pt-5 pb-0 grid gap-4 min-h-0" style={{ gridTemplateColumns: '5fr 7fr' }}>

          {/* Today's Timeline */}
          <div
            className="rounded-2xl flex flex-col overflow-hidden"
            style={{ background: '#0c1422', border: '1px solid rgba(98,208,255,0.08)', minHeight: 480 }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(98,208,255,0.07)' }}
            >
              <h2 className="text-white font-bold text-sm tracking-wide">Today's Timeline</h2>
              <button className="text-[#62d0ff] text-[10px] font-bold tracking-widest uppercase hover:text-white transition-colors">
                View Calendar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <span className="material-symbols-outlined text-[#62d0ff]/20 text-4xl">event_busy</span>
                  <p className="text-[#a0aace] text-sm">No appointments today</p>
                </div>
              ) : appointments.map((apt, i) => {
                const isInSession = i === 0
                const isSelected = activeApt?.appointment_id === apt.appointment_id
                const expanded = expandedId === apt.appointment_id
                const timeStr = formatTime(apt.scheduled_time)
                return (
                  <div key={apt.appointment_id} className="flex gap-2.5 mb-2.5">
                    {/* Dot + connecting line */}
                    <div className="flex flex-col items-center flex-shrink-0 w-3.5 pt-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={isInSession
                          ? { background: '#62d0ff', boxShadow: '0 0 6px rgba(98,208,255,0.7)' }
                          : { border: '2px solid rgba(74,85,120,0.6)', background: 'transparent' }
                        }
                      />
                      {i < appointments.length - 1 && (
                        <div className="flex-1 w-px mt-1.5" style={{ background: 'rgba(74,85,120,0.25)' }} />
                      )}
                    </div>
                    {/* Card */}
                    <div
                      onClick={() => selectApt(apt)}
                      className="flex-1 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden"
                      style={{
                        borderLeft: `3px solid ${isInSession ? '#62d0ff' : 'rgba(98,208,255,0.2)'}`,
                        background: isSelected
                          ? (isInSession ? 'rgba(98,208,255,0.08)' : 'rgba(255,255,255,0.04)')
                          : (isInSession ? 'rgba(98,208,255,0.04)' : 'rgba(255,255,255,0.02)'),
                      }}
                    >
                    <div className="px-3.5 py-3">
                      {/* Time + badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold tracking-wider ${isInSession ? 'text-[#62d0ff]' : 'text-[#4a5578]'}`}>
                          {isInSession ? `${timeStr} — ACTIVE NOW` : timeStr}
                        </span>
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                          isInSession ? 'bg-[#62d0ff]/15 text-[#62d0ff]' : 'bg-[#a0aace]/10 text-[#a0aace]'
                        }`}>
                          {isInSession ? 'In Session' : 'Pending'}
                        </span>
                      </div>

                      {/* Name */}
                      <p className="text-white font-semibold text-sm mb-2">{apt.patient_name}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {apt.suggested_specialization && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#a0aace]/10 text-[#a0aace]">
                            {apt.suggested_specialization}
                          </span>
                        )}
                        {isInSession && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#a0aace]/10 text-[#a0aace]">
                            Follow-up
                          </span>
                        )}
                        {apt.extra_tag && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#a0aace]/10 text-[#a0aace]">
                            {apt.extra_tag}
                          </span>
                        )}
                      </div>

                      {/* Symptoms quote */}
                      {apt.symptoms_text && (
                        <p className="text-[#a0aace] text-xs italic line-clamp-2 mb-2">
                          "{apt.symptoms_text}"
                        </p>
                      )}

                      {/* AI Insights */}
                      {apt.reasoning && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); setExpandedId(expanded ? null : apt.appointment_id) }}
                            className="flex items-center gap-1 text-[#62d0ff] text-[10px] font-bold tracking-widest uppercase hover:text-white transition-colors"
                          >
                            Expand AI Insights
                            <span className="material-symbols-outlined text-xs">
                              {expanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                          {expanded && (
                            <div
                              className="mt-2 p-3 rounded-lg text-[#a0aace] text-xs leading-relaxed"
                              style={{ background: 'rgba(98,208,255,0.05)', border: '1px solid rgba(98,208,255,0.1)' }}
                            >
                              {apt.reasoning}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active Consultation */}
          <div
            className="rounded-2xl flex flex-col overflow-hidden"
            style={{ background: '#0c1422', border: '1px solid rgba(98,208,255,0.08)', minHeight: 480 }}
          >
            {activeApt ? (
              <>
                {/* Panel title bar */}
                <div
                  className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(98,208,255,0.07)' }}
                >
                  <span className="text-white text-sm font-bold">Active Consultation</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#62d0ff] hover:bg-[#62d0ff]/10 transition-all"
                      style={{ border: '1px solid rgba(98,208,255,0.15)' }}
                    >
                      <span className="material-symbols-outlined text-base">call</span>
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a0aace] hover:bg-white/5 transition-all"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      onClick={() => setActiveApt(null)}
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>

                {/* Patient info — avatar left, details right */}
                <div
                  className="px-5 py-4 flex items-start gap-4 flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(98,208,255,0.07)' }}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 ${
                      AVATAR_COLORS[appointments.findIndex(a => a.appointment_id === activeApt.appointment_id) % AVATAR_COLORS.length]
                    }`}
                  >
                    {initials(activeApt.patient_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base leading-tight">{activeApt.patient_name}</h3>
                    <p className="text-[#a0aace] text-[10px] mb-2">
                      ID: #MR-{String(activeApt.appointment_id).padStart(5, '0')}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'AGE',        value: activeApt.age ? `${activeApt.age} yrs` : '—' },
                        { label: 'BLOOD TYPE', value: '—' },
                        { label: 'LAST VISIT', value: formatDate(activeApt.last_visit) || 'No prior visits' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[#a0aace] text-[9px] tracking-widest uppercase mb-0.5">{label}</p>
                          <p className="text-white text-xs font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section-label bar: notes left | autosaving | prescription right */}
                <div
                  className="flex items-center px-5 flex-shrink-0"
                  style={{ borderBottom: '1px solid rgba(98,208,255,0.07)' }}
                >
                  <div className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: '2px solid #62d0ff', marginBottom: '-1px' }}>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#62d0ff]">
                      Consultation Notes
                    </span>
                    {autosaving && (
                      <span className="text-[9px] text-[#a0aace] tracking-widest uppercase animate-pulse">
                        Autosaving...
                      </span>
                    )}
                  </div>
                  <span className="ml-auto text-[10px] font-bold tracking-widest uppercase text-[#a0aace] py-2.5">
                    Issue Prescription
                  </span>
                </div>

                {/* Split: notes | prescription form */}
                <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: '1fr 1fr' }}>

                  {/* Notes */}
                  <div
                    className="flex flex-col p-4 min-h-0"
                    style={{ borderRight: '1px solid rgba(98,208,255,0.06)' }}
                  >
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Start typing clinical observations..."
                      className="flex-1 resize-none bg-transparent text-[#c8d0e8] text-sm placeholder-[#4a5578] focus:outline-none leading-relaxed"
                    />
                    <div
                      className="flex items-center gap-2 pt-3 mt-2"
                      style={{ borderTop: '1px solid rgba(98,208,255,0.06)' }}
                    >
                      {['mic', 'attach_file'].map(icon => (
                        <button
                          key={icon}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a0aace] hover:text-[#62d0ff] hover:bg-[#62d0ff]/10 transition-all"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <span className="material-symbols-outlined text-base">{icon}</span>
                        </button>
                      ))}
                      <button
                        onClick={saveNote}
                        className="ml-auto text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-lg text-[#62d0ff] hover:bg-[#62d0ff]/10 transition-all"
                        style={{ border: '1px solid rgba(98,208,255,0.2)' }}
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>

                  {/* Prescription form */}
                  <div className="flex flex-col gap-3 p-4 overflow-y-auto">
                    <div>
                      <label className="block text-[#a0aace] text-[9px] tracking-widest uppercase mb-1.5">Medication Name</label>
                      <input
                        value={medName}
                        onChange={e => setMedName(e.target.value)}
                        placeholder="e.g. Metoprol Succinate"
                        className="w-full rounded-xl px-3 py-2 text-white text-sm placeholder-[#4a5578] focus:outline-none transition-colors"
                        style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.1)' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(98,208,255,0.3)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(98,208,255,0.1)'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[#a0aace] text-[9px] tracking-widest uppercase mb-1.5">Dosage</label>
                        <input
                          value={medDosage}
                          onChange={e => setMedDosage(e.target.value)}
                          placeholder="e.g. 50mg"
                          className="w-full rounded-xl px-3 py-2 text-white text-sm placeholder-[#4a5578] focus:outline-none transition-colors"
                          style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.1)' }}
                          onFocus={e => e.target.style.borderColor = 'rgba(98,208,255,0.3)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(98,208,255,0.1)'}
                        />
                      </div>
                      <div>
                        <label className="block text-[#a0aace] text-[9px] tracking-widest uppercase mb-1.5">Frequency</label>
                        <select
                          value={medFreq}
                          onChange={e => setMedFreq(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors"
                          style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.1)' }}
                        >
                          {['Once daily', 'Twice daily', 'Three times daily', 'As needed'].map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#a0aace] text-[9px] tracking-widest uppercase mb-1.5">Special Instructions</label>
                      <input
                        value={medInstructions}
                        onChange={e => setMedInstructions(e.target.value)}
                        placeholder="Take with food, morning..."
                        className="w-full rounded-xl px-3 py-2 text-white text-sm placeholder-[#4a5578] focus:outline-none transition-colors"
                        style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.1)' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(98,208,255,0.3)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(98,208,255,0.1)'}
                      />
                    </div>
                    <button
                      type="button"
                      className="mt-auto w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[#62d0ff] text-xs font-bold tracking-widest uppercase hover:bg-[#62d0ff]/10 transition-all"
                      style={{ border: '1px solid rgba(98,208,255,0.15)' }}
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      Add Another Medication
                    </button>
                  </div>
                </div>

                {/* Full-width confirm — panel footer */}
                <div
                  className="px-5 py-4 flex-shrink-0"
                  style={{ borderTop: '1px solid rgba(98,208,255,0.07)' }}
                >
                  <button
                    onClick={issuePrescription}
                    className="w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase text-white transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #62d0ff 0%, #3a7bd5 100%)' }}
                  >
                    Confirm &amp; Transmit Prescription
                  </button>
                  <p className="text-center text-[#4a5578] text-[10px] mt-2">
                    Securely sent to patient's preferred pharmacy
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-[#62d0ff]/20 text-5xl">person_search</span>
                <p className="text-[#a0aace] text-sm">Select a patient from the timeline</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Prescription History */}
        <div
          className="mx-6 mt-5 mb-6 rounded-2xl overflow-hidden"
          style={{ background: '#0c1422', border: '1px solid rgba(98,208,255,0.08)' }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(98,208,255,0.07)' }}
          >
            <h2 className="text-white font-bold text-sm tracking-wide">Recent Prescription History</h2>
            <button
              className="text-[10px] font-bold tracking-widest uppercase text-[#62d0ff] px-3 py-1.5 rounded-lg hover:bg-[#62d0ff]/10 transition-all"
              style={{ border: '1px solid rgba(98,208,255,0.2)' }}
            >
              Last 30 Days
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(98,208,255,0.06)' }}>
                {['Patient', 'Medication', 'Dosage', 'Date', 'Action'].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[#a0aace]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#a0aace] text-sm">
                    No prescriptions issued yet
                  </td>
                </tr>
              ) : recentRx.map((rx, i) => (
                <tr
                  key={rx.prescription_id}
                  className="transition-colors hover:bg-white/[0.015]"
                  style={{ borderBottom: i < recentRx.length - 1 ? '1px solid rgba(98,208,255,0.04)' : 'none' }}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {initials(rx.patient_name)}
                      </div>
                      <span className="text-white text-sm">{rx.patient_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-[#a0aace] text-sm">{rx.medication}</td>
                  <td className="px-6 py-3">
                    {rx.dosage
                      ? <span className="text-[#62d0ff] text-xs font-semibold">{rx.dosage}</span>
                      : <span className="text-[#a0aace] text-xs">—</span>
                    }
                  </td>
                  <td className="px-6 py-3 text-[#a0aace] text-sm">
                    {rx.issued_at ? new Date(rx.issued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <button className="text-[#62d0ff] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )} {/* end sideActive === Dashboard */}

      {/* ── Patients ── */}
      {sideActive === 'Patients' && (
        <div className="flex-1 p-8 overflow-y-auto" style={{ background: '#090e1c' }}>
          <h2 className="text-white font-bold text-xl mb-6">My Patients</h2>
          {docPatients.length === 0 ? (
            <div className="text-center py-20 text-[#a0aace]"><span className="material-symbols-outlined text-5xl block mb-3">people</span>No patients yet.</div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0c1422', border: '1px solid rgba(98,208,255,0.08)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(98,208,255,0.06)' }}>
                    {['Patient','Age','Email','Phone','Last Visit','Visits'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[#a0aace]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docPatients.map((p, i) => (
                    <tr key={p.patient_id} className="hover:bg-white/[0.015] transition-colors" style={{ borderBottom: i < docPatients.length - 1 ? '1px solid rgba(98,208,255,0.04)' : 'none' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{initials(p.name)}</div>
                          <span className="text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#a0aace]">{p.age ? `${p.age} yrs` : '—'}</td>
                      <td className="px-5 py-3 text-[#a0aace]">{p.email}</td>
                      <td className="px-5 py-3 text-[#a0aace]">{p.phone || '—'}</td>
                      <td className="px-5 py-3 text-[#a0aace]">{p.last_visit ? new Date(p.last_visit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-5 py-3 text-[#62d0ff] font-bold">{p.visit_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Appointments ── */}
      {sideActive === 'Appointments' && (
        <div className="flex-1 p-8 overflow-y-auto" style={{ background: '#090e1c' }}>
          <h2 className="text-white font-bold text-xl mb-6">Appointment History</h2>
          {aptHistory.length === 0 ? (
            <div className="text-center py-20 text-[#a0aace]"><span className="material-symbols-outlined text-5xl block mb-3">calendar_month</span>No appointments yet.</div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0c1422', border: '1px solid rgba(98,208,255,0.08)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(98,208,255,0.06)' }}>
                    {['Patient','Age','Date','Time','Status','Symptoms'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-[#a0aace]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aptHistory.map((a, i) => (
                    <tr key={a.appointment_id} className="hover:bg-white/[0.015] transition-colors" style={{ borderBottom: i < aptHistory.length - 1 ? '1px solid rgba(98,208,255,0.04)' : 'none' }}>
                      <td className="px-5 py-3 text-white font-medium">{a.patient_name}</td>
                      <td className="px-5 py-3 text-[#a0aace]">{a.age ? `${a.age} yrs` : '—'}</td>
                      <td className="px-5 py-3 text-[#a0aace]">{a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-5 py-3 text-[#a0aace]">{a.scheduled_time ? formatTime(a.scheduled_time) : '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${a.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : a.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{a.status}</span>
                      </td>
                      <td className="px-5 py-3 text-[#a0aace] max-w-xs truncate">{a.symptoms_text || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Analytics ── */}
      {sideActive === 'Analytics' && (
        <div className="flex-1 p-8 overflow-y-auto" style={{ background: '#090e1c' }}>
          <h2 className="text-white font-bold text-xl mb-6">Analytics</h2>
          <div className="grid grid-cols-3 gap-5 mb-8">
            {[
              { label: 'Total Patients', value: docPatients.length, icon: 'people' },
              { label: 'Total Appointments', value: aptHistory.length, icon: 'calendar_month' },
              { label: 'Prescriptions Issued', value: recentRx.length, icon: 'medication' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-6 flex items-center gap-4" style={{ background: '#0c1422', border: '1px solid rgba(98,208,255,0.08)' }}>
                <span className="material-symbols-outlined text-3xl text-[#62d0ff]">{s.icon}</span>
                <div>
                  <p className="text-3xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-[#a0aace] uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6 text-center" style={{ background: '#0c1422', border: '1px solid rgba(98,208,255,0.08)' }}>
            <span className="material-symbols-outlined text-4xl text-[#62d0ff]/30 block mb-2">monitoring</span>
            <p className="text-[#a0aace] text-sm">Detailed charts coming soon</p>
          </div>
        </div>
      )}

      {/* ── Billing ── */}
      {sideActive === 'Billing' && (
        <div className="flex-1 flex items-center justify-center" style={{ background: '#090e1c' }}>
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-[#62d0ff]/20 block mb-4">payments</span>
            <h3 className="text-white font-bold text-xl mb-2">Billing Module</h3>
            <p className="text-[#a0aace] text-sm">Coming soon</p>
          </div>
        </div>
      )}

      {/* Floating + button */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl hover:brightness-110 active:scale-95 transition-all z-50"
        style={{ background: 'linear-gradient(135deg, #62d0ff 0%, #3a7bd5 100%)' }}
      >
        <span className="material-symbols-outlined text-xl">add</span>
      </button>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 right-6 text-white px-5 py-3 rounded-xl shadow-2xl text-sm z-50"
          style={{ background: '#0f1928', border: '1px solid rgba(98,208,255,0.2)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

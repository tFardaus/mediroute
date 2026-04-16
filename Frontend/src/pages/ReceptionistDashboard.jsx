import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const NAV = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Pending Appointments', icon: 'pending_actions' },
  { label: 'Approved', icon: 'check_circle' },
  { label: 'Rejected', icon: 'cancel' },
  { label: 'Patient List', icon: 'group' },
  { label: 'Settings', icon: 'settings' },
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
  if (!t) return ''
  const [h, m] = String(t).split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`
}

function formatShortDate(d) {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    const day = dt.getDate()
    const mon = dt.toLocaleDateString('en-US', { month: 'short' })
    const time = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${day} ${mon} • ${time}`
  } catch { return '—' }
}

function formatFullDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function specColor(spec) {
  if (!spec) return 'bg-[#62d0ff]/10 text-[#62d0ff]'
  const s = spec.toLowerCase()
  if (s.includes('neuro')) return 'bg-[#62d0ff]/10 text-[#62d0ff]'
  if (s.includes('ortho')) return 'bg-purple-500/10 text-purple-400'
  if (s.includes('cardio')) return 'bg-pink-500/10 text-pink-400'
  if (s.includes('general')) return 'bg-emerald-500/10 text-emerald-400'
  return 'bg-[#62d0ff]/10 text-[#62d0ff]'
}

export default function ReceptionistDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() { localStorage.clear(); navigate('/login') }

  const [active, setActive]           = useState('Dashboard')
  const [pending, setPending]         = useState([])
  const [approvedApts, setApprovedApts] = useState([])
  const [rejectedApts, setRejectedApts] = useState([])
  const [allPatients, setAllPatients] = useState([])
  const [toast, setToast]             = useState('')
  const [approving, setApproving]     = useState(null)
  const [schedDate, setSchedDate]     = useState('')
  const [schedTime, setSchedTime]     = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [profileForm, setProfileForm] = useState({
    name: user.name || '', email: user.email || '',
    currentPassword: '', newPassword: '', confirmPassword: ''
  })
  const [profileSaving, setProfileSaving] = useState(false)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { loadPending(); loadApproved(); loadRejected(); loadPatients() }, [])

  async function loadPending() {
    try { const { data } = await api.get('/appointments/pending'); setPending(data?.appointments || data || []) } catch {}
  }
  async function loadApproved() {
    try { const { data } = await api.get('/appointments/approved'); setApprovedApts(Array.isArray(data) ? data : []) } catch {}
  }
  async function loadRejected() {
    try { const { data } = await api.get('/appointments/rejected'); setRejectedApts(Array.isArray(data) ? data : []) } catch {}
  }
  async function loadPatients() {
    try { const { data } = await api.get('/appointments/patients'); setAllPatients(Array.isArray(data) ? data : []) } catch {}
  }

  function openApprove(apt) {
    setApproving(apt)
    setSchedDate(apt.scheduled_date ? apt.scheduled_date.split('T')[0] : '')
    setSchedTime(apt.scheduled_time || '')
  }

  async function confirmApprove() {
    if (!schedDate) return showToast('Please set a scheduled date.')
    try {
      await api.patch(`/appointments/${approving.appointment_id}`, {
        status: 'approved', scheduledDate: schedDate, scheduledTime: schedTime || null,
      })
      showToast('Appointment approved!')
      setApproving(null)
      loadPending(); loadApproved()
    } catch (err) { showToast(err.response?.data?.error || 'Failed') }
  }

  async function rejectAppointment(id) {
    try {
      await api.patch(`/appointments/${id}`, { status: 'rejected' })
      showToast('Appointment rejected')
      loadPending(); loadRejected()
    } catch (err) { showToast(err.response?.data?.error || 'Failed') }
  }

  async function saveProfile() {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword)
      return showToast('New passwords do not match.')
    setProfileSaving(true)
    try {
      const { data } = await api.put('/auth/profile', {
        name: profileForm.name, email: profileForm.email,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
      })
      const updated = { ...user, name: data.user.name, email: data.user.email }
      localStorage.setItem('user', JSON.stringify(updated))
      setProfileForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
      showToast('Profile updated successfully!')
    } catch (err) { showToast(err.response?.data?.error || 'Failed to update profile.') }
    finally { setProfileSaving(false) }
  }

  // Computed
  const todayStr = new Date().toISOString().split('T')[0]
  const pendingCount = pending.length
  const approvedToday = approvedApts.filter(a => a.requested_at?.startsWith(todayStr)).length
  const rejectedToday = rejectedApts.filter(a => a.requested_at?.startsWith(todayStr)).length
  const totalManaged = pending.length + approvedApts.length + rejectedApts.length

  const filteredPending = searchQuery
    ? pending.filter(a =>
        a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : pending

  // ── Chart data: hourly appointment flow ──
  const hourLabels = ['8AM','9','10','11','12PM','1','2','3','4','5','6PM']
  const hourlyFlow = (() => {
    const counts = Array(11).fill(0)
    approvedApts.forEach(a => {
      if (a.scheduled_time) {
        const h = parseInt(String(a.scheduled_time).split(':')[0], 10)
        if (h >= 8 && h <= 18) counts[h - 8]++
      }
    })
    return counts
  })()

  const chartPaths = (() => {
    const W = 280, H = 100, PX = 20, PY = 10
    const maxVal = Math.max(...hourlyFlow, 1)
    const pts = hourlyFlow.map((v, i) => [
      PX + (i / (hourlyFlow.length - 1)) * (W - 2 * PX),
      PY + (1 - v / maxVal) * (H - 2 * PY)
    ])
    let line = `M${pts[0][0]},${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i++) {
      const cpx = (pts[i][0] + pts[i + 1][0]) / 2
      line += ` C${cpx},${pts[i][1]} ${cpx},${pts[i + 1][1]} ${pts[i + 1][0]},${pts[i + 1][1]}`
    }
    const area = line + ` L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`
    return { line, area }
  })()

  const avgWait = (() => {
    const waits = approvedApts
      .filter(a => a.requested_at && a.scheduled_date)
      .map(a => Math.abs(new Date(a.scheduled_date) - new Date(a.requested_at)) / (1000 * 60 * 60))
    if (!waits.length) return '0 mins'
    const avg = waits.reduce((s, w) => s + w, 0) / waits.length
    if (avg < 1) return `${Math.round(avg * 60)} mins`
    if (avg < 24) return `${Math.round(avg)} hrs`
    return `${Math.round(avg / 24)} days`
  })()

  const doctorCapacity = totalManaged > 0
    ? Math.min(Math.round((approvedApts.length / totalManaged) * 100), 100)
    : 0

  // ── Pending table (reused in Dashboard + Pending Appointments page) ──
  function PendingTable({ data, showSearch }) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-headline font-bold text-on-surface text-lg">Pending Appointment Requests</h3>
          <div className="flex items-center gap-3">
            {showSearch && (
              <div className="relative">
                <input
                  type="text" placeholder="Search by name/date..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="input-field py-2 pr-4 pl-9 text-xs w-56"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
              </div>
            )}
            <button onClick={loadPending} className="btn-secondary text-xs px-4 py-2">
              <span className="material-symbols-outlined text-sm mr-1">refresh</span>Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant text-[10px] uppercase tracking-widest">
                <th className="text-left pb-3 px-3 font-semibold">Patient Name</th>
                <th className="text-left pb-3 px-3 font-semibold">Symptoms Summary</th>
                <th className="text-left pb-3 px-3 font-semibold">AI Specialization</th>
                <th className="text-left pb-3 px-3 font-semibold">Requested Date</th>
                <th className="text-left pb-3 px-3 font-semibold">Doctor Assigned</th>
                <th className="text-center pb-3 px-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-on-surface-variant text-sm">No pending appointments</td></tr>
              ) : data.map((apt, i) => (
                <tr key={apt.appointment_id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {initials(apt.patient_name)}
                      </div>
                      <span className="font-medium text-on-surface">{apt.patient_name || 'Patient'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant max-w-[200px]">
                    <p className="truncate text-xs">{apt.symptoms_text || '—'}</p>
                  </td>
                  <td className="py-3 px-3">
                    {apt.suggested_specialization ? (
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${specColor(apt.suggested_specialization)}`}>
                        {apt.suggested_specialization}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant text-xs">
                    {formatShortDate(apt.requested_at || apt.scheduled_date)}
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant text-xs">
                    {apt.doctor_name ? `Dr. ${apt.doctor_name}` : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openApprove(apt)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-tertiary/10 text-tertiary hover:bg-tertiary hover:text-surface transition-all">
                        <span className="material-symbols-outlined text-base">check</span>
                      </button>
                      <button onClick={() => rejectAppointment(apt.appointment_id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-error/10 text-error hover:bg-error hover:text-on-error transition-all">
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#080d18' }}>

      {/* ─── Sidebar ─── */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: '#0b1120', borderRight: '1px solid rgba(98,208,255,0.07)' }}
      >
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#62d0ff] to-[#3a7bd5] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-sm">medical_services</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-wide font-serif italic">MediRoute</p>
            <p className="text-[#a0aace] text-[9px] tracking-widest uppercase">Clinical Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 mt-2">
          {NAV.map(item => (
            <button
              key={item.label}
              onClick={() => setActive(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active === item.label
                  ? 'bg-[#62d0ff]/10 text-[#62d0ff]'
                  : 'text-[#a0aace] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(98,208,255,0.07)' }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#62d0ff]/20 flex items-center justify-center text-[#62d0ff] font-bold text-xs flex-shrink-0">
              {user.name?.charAt(0) || 'R'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name || 'Receptionist'}</p>
              <p className="text-[#a0aace] text-[9px] tracking-widest uppercase">Lead Receptionist</p>
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

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 bg-surface-container-low">
          <div>
            <h1 className="text-xl font-headline font-bold text-on-surface">
              Receptionist Panel — <span className="text-primary">{user.name}</span>
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">{formatFullDate()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Quick search patients…" className="input-field py-2 pr-4 pl-9 text-xs w-52" />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-xl cursor-pointer hover:text-primary">notifications</span>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user.name?.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto space-y-6">

          {/* ═══════════ DASHBOARD ═══════════ */}
          {active === 'Dashboard' && <>

            {/* Stats row — 4 cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Pending', value: String(pendingCount).padStart(2, '0'), icon: 'pending_actions', color: '#62d0ff', glow: false },
                { label: 'Approved Today', value: String(approvedToday).padStart(2, '0'), icon: 'check_circle', color: '#9bffce', glow: true },
                { label: 'Rejected Today', value: String(rejectedToday).padStart(2, '0'), icon: 'cancel', color: '#ff716c', glow: false },
                { label: 'Total Managed', value: totalManaged.toLocaleString(), icon: 'assessment', color: '#c9bfff', glow: false },
              ].map(s => (
                <div key={s.label} className="glass-card p-5 hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-3xl font-bold text-on-surface">{s.value}</p>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mt-1">{s.label}</p>
                    </div>
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{
                        background: `${s.color}15`,
                        boxShadow: s.glow ? `0 0 20px ${s.color}40` : 'none',
                      }}
                    >
                      <span className="material-symbols-outlined text-xl" style={{ color: s.color }}>{s.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Appointment Requests */}
            <PendingTable data={filteredPending} showSearch={true} />

            {/* Bottom two-column: Approved + Daily Clinic Flow */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {/* Approved Appointments */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-headline font-bold text-on-surface">Approved Appointments</h3>
                  <button onClick={() => setActive('Approved')} className="text-xs text-primary font-bold uppercase tracking-widest hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {approvedApts.length === 0 ? (
                    <p className="text-center py-8 text-on-surface-variant text-sm">No approved appointments yet</p>
                  ) : approvedApts.slice(0, 5).map((apt, i) => (
                    <div key={apt.appointment_id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-container-highest/30 transition-colors">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {initials(apt.patient_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{apt.patient_name}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {apt.specialization || 'General'} • {apt.scheduled_time ? formatTime(apt.scheduled_time) : (apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—')}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-tertiary/10 text-tertiary px-3 py-1 rounded-full flex-shrink-0">
                        Approved
                      </span>
                      <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Clinic Flow */}
              <div className="glass-card p-6">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-5">Daily Clinic Flow</h3>

                {/* Chart */}
                <div className="rounded-xl p-4 mb-5" style={{ background: '#080d18', border: '1px solid rgba(98,208,255,0.08)' }}>
                  <svg viewBox="0 0 280 125" className="w-full" style={{ height: 150 }}>
                    <defs>
                      <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#62d0ff" stopOpacity="0.25" />
                        <stop offset="60%" stopColor="#62d0ff" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#62d0ff" stopOpacity="0" />
                      </linearGradient>
                      <filter id="lineGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    {[0.25, 0.5, 0.75].map(r => (
                      <line key={r} x1="20" y1={10 + r * 90} x2="260" y2={10 + r * 90}
                        stroke="rgba(98,208,255,0.06)" strokeWidth="0.5" strokeDasharray="4 3" />
                    ))}
                    <path d={chartPaths.area} fill="url(#flowGrad)" />
                    <path d={chartPaths.line} fill="none" stroke="#62d0ff" strokeWidth="2.5" opacity="0.25" filter="url(#lineGlow)" />
                    <path d={chartPaths.line} fill="none" stroke="#62d0ff" strokeWidth="1.5" strokeLinecap="round" />
                    {hourLabels.map((lbl, i) => (
                      <text key={i} x={20 + (i / 10) * 240} y="118" fill="#a0aace" fontSize="7" textAnchor="middle" fontFamily="sans-serif">{lbl}</text>
                    ))}
                  </svg>
                </div>

                {/* Avg. Wait Time */}
                <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(98,208,255,0.07)' }}>
                  <span className="text-xs text-on-surface-variant font-medium">Avg. Wait Time</span>
                  <span className="text-sm font-bold text-on-surface">{avgWait}</span>
                </div>

                {/* Doctor Capacity */}
                <div className="pt-3 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-on-surface-variant font-medium">Doctor Capacity</span>
                    <span className="text-sm font-bold text-on-surface">{doctorCapacity}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(98,208,255,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${doctorCapacity}%`,
                        background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                        boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                      }}
                    />
                  </div>
                </div>

                {/* AI Note */}
                <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: 'rgba(98,208,255,0.04)', borderLeft: '3px solid #62d0ff' }}>
                  <span className="material-symbols-outlined text-primary text-base mt-0.5 flex-shrink-0">bolt</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    <span className="text-primary font-semibold">AI Note: </span>
                    High volume expected between 2 PM and 4 PM. Suggest preemptive triage for minor symptoms.
                  </p>
                </div>
              </div>
            </div>

          </>}

          {/* ═══════════ PENDING APPOINTMENTS (full page) ═══════════ */}
          {active === 'Pending Appointments' && (
            <PendingTable data={filteredPending} showSearch={true} />
          )}

          {/* ═══════════ APPROVED (full page) ═══════════ */}
          {active === 'Approved' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-xl">check_circle</span> Approved Appointments
                </h3>
                <button onClick={loadApproved} className="btn-secondary text-xs px-4 py-2">
                  <span className="material-symbols-outlined text-sm mr-1">refresh</span>Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant text-[10px] uppercase tracking-widest">
                      <th className="text-left pb-3 px-3 font-semibold">Patient</th>
                      <th className="text-left pb-3 px-3 font-semibold">Doctor</th>
                      <th className="text-left pb-3 px-3 font-semibold">Specialization</th>
                      <th className="text-left pb-3 px-3 font-semibold">Date</th>
                      <th className="text-left pb-3 px-3 font-semibold">Time</th>
                      <th className="text-left pb-3 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedApts.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-on-surface-variant text-sm">No approved appointments</td></tr>
                    ) : approvedApts.map((apt, i) => (
                      <tr key={apt.appointment_id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                              {initials(apt.patient_name)}
                            </div>
                            <span className="font-medium text-on-surface">{apt.patient_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">Dr. {apt.doctor_name}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${specColor(apt.specialization)}`}>
                            {apt.specialization || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant text-xs">{apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td className="py-3 px-3 text-on-surface-variant text-xs">{apt.scheduled_time ? formatTime(apt.scheduled_time) : '—'}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-full">Approved</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════ REJECTED (full page) ═══════════ */}
          {active === 'Rejected' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-xl">cancel</span> Rejected Appointments
                </h3>
                <button onClick={loadRejected} className="btn-secondary text-xs px-4 py-2">
                  <span className="material-symbols-outlined text-sm mr-1">refresh</span>Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant text-[10px] uppercase tracking-widest">
                      <th className="text-left pb-3 px-3 font-semibold">Patient</th>
                      <th className="text-left pb-3 px-3 font-semibold">Doctor</th>
                      <th className="text-left pb-3 px-3 font-semibold">Specialization</th>
                      <th className="text-left pb-3 px-3 font-semibold">Requested Date</th>
                      <th className="text-left pb-3 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedApts.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-on-surface-variant text-sm">No rejected appointments</td></tr>
                    ) : rejectedApts.map((apt, i) => (
                      <tr key={apt.appointment_id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                              {initials(apt.patient_name)}
                            </div>
                            <span className="font-medium text-on-surface">{apt.patient_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">Dr. {apt.doctor_name}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${specColor(apt.specialization)}`}>
                            {apt.specialization || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant text-xs">{formatShortDate(apt.requested_at)}</td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-error/10 text-error px-2.5 py-1 rounded-full">Rejected</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════ PATIENT LIST (full page) ═══════════ */}
          {active === 'Patient List' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">group</span> All Patients
                </h3>
                <button onClick={loadPatients} className="btn-secondary text-xs px-4 py-2">
                  <span className="material-symbols-outlined text-sm mr-1">refresh</span>Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant text-[10px] uppercase tracking-widest">
                      <th className="text-left pb-3 px-3 font-semibold">Name</th>
                      <th className="text-left pb-3 px-3 font-semibold">Age</th>
                      <th className="text-left pb-3 px-3 font-semibold">Email</th>
                      <th className="text-left pb-3 px-3 font-semibold">Phone</th>
                      <th className="text-left pb-3 px-3 font-semibold">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPatients.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-on-surface-variant text-sm">No patients found</td></tr>
                    ) : allPatients.map((p, i) => (
                      <tr key={p.patient_id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                              {initials(p.name)}
                            </div>
                            <span className="font-medium text-on-surface">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">{p.age ? `${p.age} yrs` : '—'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{p.email}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{p.phone || '—'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════ SETTINGS ═══════════ */}
          {active === 'Settings' && (
            <div className="max-w-lg space-y-8">
              <div>
                <h2 className="text-xl font-bold text-on-surface mb-1">Profile Settings</h2>
                <p className="text-on-surface-variant text-xs tracking-widest uppercase">Manage your account details and password</p>
              </div>

              <div className="glass-card p-7">
                <h3 className="text-primary text-xs font-bold uppercase tracking-widest mb-5">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">Full Name</label>
                    <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">Email Address</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                      className="input-field" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-7">
                <h3 className="text-primary text-xs font-bold uppercase tracking-widest mb-5">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">Current Password</label>
                    <input type="password" value={profileForm.currentPassword} onChange={e => setProfileForm(f => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="Enter current password" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">New Password</label>
                    <input type="password" value={profileForm.newPassword} onChange={e => setProfileForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="Enter new password" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">Confirm New Password</label>
                    <input type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Repeat new password" className="input-field" />
                  </div>
                </div>
              </div>

              <button onClick={saveProfile} disabled={profileSaving}
                className="btn-primary">
                {profileSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

        </main>
      </div>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-40"
        style={{ background: 'linear-gradient(135deg, #62d0ff, #7459f7)', boxShadow: '0 8px 32px rgba(98,208,255,0.4)' }}
        onClick={() => { loadPending(); loadApproved(); loadRejected() }}>
        <span className="material-symbols-outlined text-on-primary text-xl">add</span>
      </button>

      {/* Approve modal */}
      {approving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-[#62d0ff]/20 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-headline font-bold text-on-surface mb-1">Approve Appointment</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              {approving.patient_name} → {approving.doctor_name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Scheduled Date</label>
                <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Scheduled Time <span className="normal-case text-on-surface-variant/60">(optional)</span></label>
                <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
            </div>
            <div className="flex gap-3 mt-7">
              <button onClick={() => setApproving(null)}
                className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors">
                Cancel
              </button>
              <button onClick={confirmApprove}
                className="flex-1 py-3 rounded-xl bg-tertiary/20 border border-tertiary/30 text-tertiary text-sm font-bold hover:bg-tertiary hover:text-surface transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">check</span> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-surface-container-highest border border-outline-variant/20 text-on-surface px-5 py-3 rounded-xl shadow-2xl text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const NAV = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Patients', icon: 'group' },
  { label: 'Appointments', icon: 'calendar_today' },
  { label: 'Analytics', icon: 'monitoring' },
  { label: 'Billing', icon: 'payments' },
  { label: 'Settings', icon: 'settings' },
]


export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [active, setActive] = useState('Dashboard')
  const [stats, setStats] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [receptionists, setReceptionists] = useState([])
  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [docForm, setDocForm] = useState({ name: '', email: '', password: '', specialization: '' })
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '' })
  const [toast, setToast] = useState('')
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const [s, d, r, a] = await Promise.all([
          api.get('/admin/stats').catch(() => ({ data: null })),
          api.get('/admin/doctors').catch(() => ({ data: [] })),
          api.get('/admin/receptionists').catch(() => ({ data: [] })),
          api.get('/admin/analytics').catch(() => ({ data: null })),
        ])
        setStats(s.data)
        setDoctors(d.data || [])
        setReceptionists(r.data || [])
        setAnalytics(a.data)
      } catch {}
    })()
  }, [])

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  function handleNav(label) {
    setActive(label)
    if (label === 'Settings') logout()
  }

  async function refreshDoctors() {
    try { const { data } = await api.get('/admin/doctors'); setDoctors(data || []) } catch {}
  }

  async function refreshReceptionists() {
    try { const { data } = await api.get('/admin/receptionists'); setReceptionists(data || []) } catch {}
  }

  async function deleteReceptionist(id) {
    if (!window.confirm('Delete this receptionist?')) return
    try {
      await api.delete(`/admin/receptionists/${id}`)
      refreshReceptionists()
    } catch (err) {
      setToast(err.response?.data?.error || 'Delete failed')
      setTimeout(() => setToast(''), 2500)
    }
  }

  async function addDoctor(e) {
    e.preventDefault()
    try {
      await api.post('/admin/doctors', docForm)
      setShowDoctorModal(false)
      setDocForm({ name: '', email: '', password: '', specialization: '' })
      setToast('Doctor added')
      setTimeout(() => setToast(''), 2500)
      refreshDoctors()
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to add doctor')
      setTimeout(() => setToast(''), 2500)
    }
  }

  async function deleteDoctor(id) {
    if (!window.confirm('Delete this doctor?')) return
    try {
      await api.delete(`/admin/doctors/${id}`)
      refreshDoctors()
    } catch (err) {
      setToast(err.response?.data?.error || 'Delete failed')
      setTimeout(() => setToast(''), 2500)
    }
  }

  async function addStaff(e) {
    e.preventDefault()
    try {
      await api.post('/admin/receptionists', staffForm)
      setShowStaffModal(false)
      setStaffForm({ name: '', email: '', password: '' })
      setToast('Receptionist added')
      setTimeout(() => setToast(''), 2500)
      refreshReceptionists()
    } catch (err) {
      setToast(err.response?.data?.error || 'Failed to add staff')
      setTimeout(() => setToast(''), 2500)
    }
  }

  const totalPatients = stats?.totalPatients ?? 0
  const activeDoctors = stats?.totalDoctors ?? doctors.length
  const appointmentsToday = stats?.appointmentsToday ?? 0
  const adminName = user?.name || 'Admin'
  const initial = adminName.charAt(0).toUpperCase()

  return (
    <div className="bg-surface text-on-surface font-body overflow-hidden">
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <aside className="flex flex-col h-full py-6 px-4 bg-[#090e1c]/80 backdrop-blur-xl w-64 border-r border-[#62d0ff]/15 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50 shrink-0">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary-dim flex items-center justify-center shadow-[0_0_15px_rgba(98,208,255,0.3)]">
              <span className="material-symbols-outlined text-surface font-bold">medical_services</span>
            </div>
            <div>
              <h1 className="text-2xl font-headline italic text-[#62d0ff] drop-shadow-[0_0_8px_rgba(98,208,255,0.5)]">MediRoute</h1>
              <p className="tracking-wide uppercase text-[11px] text-on-surface-variant">Clinical Intelligence</p>
            </div>
          </div>
          <nav className="flex-1 space-y-2">
            {NAV.map((n) => (
              <button
                key={n.label}
                onClick={() => handleNav(n.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                  active === n.label
                    ? 'text-[#62d0ff] font-bold border-r-2 border-[#62d0ff] bg-gradient-to-r from-[#62d0ff]/10 to-transparent'
                    : 'text-[#a0aace] hover:bg-[#62d0ff]/5 hover:text-[#62d0ff]'
                }`}
              >
                <span className="material-symbols-outlined">{n.icon}</span>
                <span className="text-sm">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-outline-variant/10">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold ring-2 ring-primary/20">
                {initial}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{adminName}</p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">System Admin</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#a0aace] hover:bg-error/10 hover:text-error transition-all duration-300"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center w-full px-8 sticky top-0 z-40 h-20 bg-[#090e1c]/40 backdrop-blur-md border-b border-[#62d0ff]/5">
            <div className="flex items-center gap-6">
              <h2 className="hidden md:block text-xl font-headline text-[#dfe4ff]">Admin Control Panel</h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/50 border border-outline-variant/10">
                <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_#10B981]"></span>
                <span className="text-[10px] font-medium text-tertiary-dim tracking-widest uppercase">All Systems Operational</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative hidden lg:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                <input className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-primary/50 transition-all" placeholder="Search clinical records..." type="text" />
              </div>
              <div className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined hover:text-[#62d0ff] cursor-pointer transition-colors">history_edu</span>
                <span className="material-symbols-outlined hover:text-[#62d0ff] cursor-pointer transition-colors relative">
                  notifications
                  <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
                </span>
              </div>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto w-full space-y-12">
            {/* Hero Stats */}
            <section>
              <div className="flex items-baseline justify-between mb-8">
                <h3 className="text-3xl font-headline text-on-surface">Intelligence Overview</h3>
                <p className="text-on-surface-variant text-sm">Last synchronized: 2 mins ago</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon="person" iconColor="text-primary" iconBg="bg-primary/10" badge="+12% ↑" badgeColor="text-tertiary" value={fmt(totalPatients)} label="Total Patients" valueColor="text-primary-fixed" />
                <StatCard icon="stethoscope" iconColor="text-secondary-dim" iconBg="bg-secondary-dim/10" badge="Stable" badgeColor="text-on-surface-variant" value={fmt(activeDoctors)} label="Active Doctors" />
                <StatCard icon="support_agent" iconColor="text-tertiary-dim" iconBg="bg-tertiary-dim/10" badge="" badgeColor="text-tertiary" value={fmt(receptionists.length)} label="Receptionists" />
                <StatCard icon="calendar_month" iconColor="text-primary-dim" iconBg="bg-primary-dim/10" badge="Peak Time" badgeColor="text-primary" value={fmt(appointmentsToday)} label="Appointments Today" />
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between group hover:bg-surface-container-highest/60 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-dim/10 blur-3xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-secondary p-2 bg-secondary/10 rounded-lg">psychology</span>
                    <span className="text-secondary text-xs font-bold">AI Driven</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-4xl font-headline text-on-surface">18</p>
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-1">AI Recommendations</p>
                  </div>
                </div>
                <StatCard icon="speed" iconColor="text-tertiary" iconBg="bg-tertiary/10" badge="99.9%" badgeColor="text-tertiary" value="428d" label="System Uptime" />
              </div>
            </section>

            {/* Management Panels */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Doctor Management */}
              <div className="bg-surface-container-high rounded-2xl p-8 border border-outline-variant/10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-2xl font-headline text-on-surface">Doctor Management</h4>
                    <div className="w-10 h-0.5 bg-primary mt-2"></div>
                  </div>
                  <button onClick={() => setShowDoctorModal(true)} className="bg-gradient-to-r from-primary to-secondary-dim text-surface px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(98,208,255,0.4)] transition-all">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add New Doctor
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-outline-variant/10 text-on-surface-variant text-[11px] uppercase tracking-widest">
                      <tr>
                        <th className="pb-4 font-medium">ID</th>
                        <th className="pb-4 font-medium">Name</th>
                        <th className="pb-4 font-medium">Specialization</th>
                        <th className="pb-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {doctors.length === 0 ? (
                        <tr><td colSpan={4} className="py-10 text-center text-on-surface-variant text-sm">No doctors registered yet</td></tr>
                      ) : doctors.map((d) => (
                        <tr key={d.doctor_id} className="border-b border-outline-variant/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4 text-on-surface-variant">#DR-{d.doctor_id}</td>
                          <td className="py-4 font-medium">{d.name}</td>
                          <td className="py-4 text-on-surface-variant">{d.specialization}</td>
                          <td className="py-4 text-right space-x-3">
                            <button className="text-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-lg">edit_note</span></button>
                            <button onClick={() => deleteDoctor(d.doctor_id)} className="text-error hover:text-white transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reception Management */}
              <div className="bg-surface-container-high rounded-2xl p-8 border border-outline-variant/10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-2xl font-headline text-on-surface">Reception Management</h4>
                    <div className="w-10 h-0.5 bg-secondary mt-2"></div>
                  </div>
                  <button onClick={() => setShowStaffModal(true)} className="bg-surface-bright/50 border border-outline-variant/30 text-on-surface px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-surface-bright transition-all">
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Add New Staff
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-outline-variant/10 text-on-surface-variant text-[11px] uppercase tracking-widest">
                      <tr>
                        <th className="pb-4 font-medium">Staff ID</th>
                        <th className="pb-4 font-medium">Name</th>
                        <th className="pb-4 font-medium">Email</th>
                        <th className="pb-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {receptionists.length === 0 ? (
                        <tr><td colSpan={4} className="py-10 text-center text-on-surface-variant text-sm">No staff registered yet</td></tr>
                      ) : receptionists.map((s) => (
                        <tr key={s.receptionist_id} className="border-b border-outline-variant/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 text-on-surface-variant">#RC-{s.receptionist_id}</td>
                          <td className="py-4 font-medium">{s.name}</td>
                          <td className="py-4 text-on-surface-variant text-xs">{s.email}</td>
                          <td className="py-4 text-right space-x-3">
                            <button className="text-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-lg">edit_note</span></button>
                            <button onClick={() => deleteReceptionist(s.receptionist_id)} className="text-error hover:text-white transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Analytics */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-2xl font-headline text-on-surface">Data Analytics &amp; Forecasting</h4>
                  <p className="text-on-surface-variant text-sm mt-1">Facility optimization</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-primary/30 text-primary font-medium hover:bg-primary/10 transition-all">
                  <span className="material-symbols-outlined">analytics</span>
                  Generate Full Report
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10">
                  <h5 className="text-sm font-semibold mb-8 uppercase tracking-widest text-on-surface-variant">Appointments per Day (Last 7 Days)</h5>
                  <div className="flex items-end justify-between h-48 gap-4 px-4">
                    {(() => {
                      const days = analytics?.daily || []
                      const maxCount = Math.max(...days.map(d => d.count), 1)
                      return days.map((b, i) => {
                        const heightPct = Math.max((b.count / maxCount) * 100, 4)
                        const isPeak = b.count === maxCount
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant mb-1">{b.count > 0 ? b.count : ''}</span>
                            <div className="w-full bg-primary/20 rounded-t-lg relative" style={{ height: `${heightPct}%` }}>
                              <div className={`absolute bottom-0 w-full rounded-t-lg h-full ${isPeak ? 'bg-gradient-to-t from-primary to-secondary-dim' : 'bg-primary opacity-60'}`}></div>
                            </div>
                            <span className="text-[10px] text-on-surface-variant">{b.label}</span>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
                {/* Donut Chart */}
                <div className="bg-surface-container p-8 rounded-2xl border border-outline-variant/10 flex flex-col md:flex-row items-center gap-8">
                  {(() => {
                    const s = analytics?.status
                    const total = s?.total || 0
                    const CIRC = 502
                    const completedPct = total ? s.completed / total : 0
                    const scheduledPct = total ? s.scheduled / total : 0
                    const cancelledPct = total ? s.cancelled / total : 0
                    const completedDash = CIRC - completedPct * CIRC
                    const scheduledDash = CIRC - scheduledPct * CIRC
                    const cancelledDash = CIRC - cancelledPct * CIRC
                    const pct = (n) => total ? Math.round((n / total) * 100) + '%' : '0%'
                    return (
                      <>
                        <div className="relative w-48 h-48 shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                            <circle className="text-surface-container-high" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="16" />
                            <circle className="text-primary" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeDasharray={CIRC} strokeDashoffset={completedDash} strokeWidth="16" />
                            <circle className="text-secondary-dim" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeDasharray={CIRC} strokeDashoffset={scheduledDash} strokeWidth="16" strokeOpacity={scheduledPct > 0 ? 1 : 0} />
                            <circle className="text-tertiary" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeDasharray={CIRC} strokeDashoffset={cancelledDash} strokeWidth="16" strokeOpacity={cancelledPct > 0 ? 1 : 0} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold">{total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total}</span>
                            <span className="text-[10px] uppercase text-on-surface-variant">Total</span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                          <h5 className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Appointments by Status</h5>
                          <LegendRow color="bg-primary" label="Completed" pct={pct(s?.completed || 0)} />
                          <LegendRow color="bg-secondary-dim" label="Scheduled" pct={pct(s?.scheduled || 0)} />
                          <LegendRow color="bg-tertiary" label="Cancelled" pct={pct(s?.cancelled || 0)} />
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </section>

            <footer className="pt-8 border-t border-outline-variant/10 text-center">
              <p className="text-xs text-on-surface-variant tracking-widest uppercase">MediRoute Enterprise System © 2024 • Clinical Intelligence Protocol v4.2.0</p>
            </footer>
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/20 text-sm text-on-surface shadow-xl">
          {toast}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showDoctorModal && (
        <Modal title="Add New Doctor" onClose={() => setShowDoctorModal(false)}>
          <form onSubmit={addDoctor} className="space-y-4">
            <input className="input-field" placeholder="Name" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} required />
            <input className="input-field" type="email" placeholder="Email" value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} required />
            <input className="input-field" type="password" placeholder="Password" value={docForm.password} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} required />
            <input className="input-field" placeholder="Specialization" value={docForm.specialization} onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })} required />
            <button type="submit" className="btn-primary">Add Doctor</button>
          </form>
        </Modal>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && (
        <Modal title="Add New Staff" onClose={() => setShowStaffModal(false)}>
          <form onSubmit={addStaff} className="space-y-4">
            <input className="input-field" placeholder="Name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} required />
            <input className="input-field" type="email" placeholder="Email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
            <input className="input-field" type="password" placeholder="Password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} required />
            <button type="submit" className="btn-primary">Add Staff</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function fmt(n) {
  return typeof n === 'number' ? n.toLocaleString('en-US') : n
}

function StatCard({ icon, iconColor, iconBg, badge, badgeColor, value, label, valueColor = 'text-on-surface' }) {
  return (
    <div className="glass-card p-6 rounded-xl flex flex-col justify-between group hover:bg-surface-container-highest/60 transition-all duration-300">
      <div className="flex justify-between items-start">
        <span className={`material-symbols-outlined ${iconColor} p-2 ${iconBg} rounded-lg`}>{icon}</span>
        <span className={`${badgeColor} text-xs font-bold`}>{badge}</span>
      </div>
      <div className="mt-4">
        <p className={`text-4xl font-headline ${valueColor}`}>{value}</p>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-1">{label}</p>
      </div>
    </div>
  )
}

function LegendRow({ color, label, pct }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${color}`}></span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-bold">{pct}</span>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-surface-container-high rounded-2xl p-8 w-full max-w-md border border-outline-variant/20 editorial-shadow" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-headline text-on-surface">{title}</h4>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

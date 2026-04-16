import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api'

export default function ReceptionistDashboard() {
  const [active, setActive] = useState('Dashboard')
  const [pending, setPending] = useState([])
  const [toast, setToast] = useState('')
  const [approving, setApproving] = useState(null)
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [approvedApts, setApprovedApts] = useState([])
  const [allPatients, setAllPatients] = useState([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { loadPending(); loadApproved(); loadPatients() }, [])

  async function loadPending() {
    try { const { data } = await api.get('/appointments/pending'); setPending(data?.appointments || data || []) } catch {}
  }

  async function loadApproved() {
    try { const { data } = await api.get('/appointments/approved'); setApprovedApts(Array.isArray(data) ? data : []) } catch {}
  }

  async function loadPatients() {
    try { const { data } = await api.get('/admin/patients'); setAllPatients(Array.isArray(data) ? data : []) } catch {}
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
        status: 'approved',
        scheduledDate: schedDate,
        scheduledTime: schedTime || null,
      })
      showToast('Appointment approved!')
      setApproving(null)
      loadPending()
      loadApproved()
    } catch (err) { showToast(err.response?.data?.error || 'Failed') }
  }

  async function rejectAppointment(id) {
    try {
      await api.patch(`/appointments/${id}`, { status: 'rejected' })
      showToast('Appointment rejected')
      loadPending()
    } catch (err) { showToast(err.response?.data?.error || 'Failed') }
  }

  const approved = pending.filter(a => a.status === 'approved')
  const waiting = pending.filter(a => a.status === 'pending')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="receptionist" active={active} setActive={setActive} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 bg-surface-container-low">
          <div>
            <h1 className="text-xl font-headline font-bold text-on-surface">Receptionist Dashboard</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Welcome, {user.name}</p>
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
          {/* ── Sidebar nav sections ── */}
          {active === 'Pending' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">pending_actions</span> Pending Appointments
                </h3>
                <button onClick={loadPending} className="btn-secondary text-xs px-4 py-2">
                  <span className="material-symbols-outlined text-sm mr-1">refresh</span>Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-outline-variant/20 text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="text-left pb-3 px-3">Patient</th><th className="text-left pb-3 px-3">Doctor</th>
                    <th className="text-left pb-3 px-3">Date</th><th className="text-center pb-3 px-3">Actions</th>
                  </tr></thead>
                  <tbody>
                    {pending.filter(a => a.status === 'pending').length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-on-surface-variant">No pending appointments</td></tr>
                    ) : pending.filter(a => a.status === 'pending').map(apt => (
                      <tr key={apt.appointment_id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20">
                        <td className="py-3 px-3 font-medium text-on-surface">{apt.patient_name}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{apt.doctor_name}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openApprove(apt)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-tertiary/10 text-tertiary hover:bg-tertiary hover:text-surface transition-all">
                              <span className="material-symbols-outlined text-sm">check</span>Approve
                            </button>
                            <button onClick={() => rejectAppointment(apt.appointment_id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-error/10 text-error hover:bg-error hover:text-on-error transition-all">
                              <span className="material-symbols-outlined text-sm">close</span>Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'Approved' && (
            <div className="glass-card p-6">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-tertiary text-xl">check_circle</span>Approved Appointments
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-outline-variant/20 text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="text-left pb-3 px-3">Patient</th><th className="text-left pb-3 px-3">Doctor</th>
                    <th className="text-left pb-3 px-3">Specialization</th><th className="text-left pb-3 px-3">Date</th><th className="text-left pb-3 px-3">Time</th>
                  </tr></thead>
                  <tbody>
                    {approvedApts.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-on-surface-variant">No approved appointments</td></tr>
                    ) : approvedApts.map(apt => (
                      <tr key={apt.appointment_id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20">
                        <td className="py-3 px-3 font-medium text-on-surface">{apt.patient_name}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{apt.doctor_name}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{apt.specialization || '—'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{apt.scheduled_time || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'Patients' && (
            <div className="glass-card p-6">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary text-xl">group</span>All Patients
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-outline-variant/20 text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="text-left pb-3 px-3">Name</th><th className="text-left pb-3 px-3">Age</th>
                    <th className="text-left pb-3 px-3">Email</th><th className="text-left pb-3 px-3">Phone</th><th className="text-left pb-3 px-3">Registered</th>
                  </tr></thead>
                  <tbody>
                    {allPatients.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-on-surface-variant">No patients found</td></tr>
                    ) : allPatients.map(p => (
                      <tr key={p.patient_id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20">
                        <td className="py-3 px-3 font-medium text-on-surface">{p.name}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{p.age ? `${p.age} yrs` : '—'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{p.email}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{p.phone || '—'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Dashboard (default) ── */}
          {active === 'Dashboard' && <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-5">
            {[
              { label: 'Pending Review', value: waiting.length, icon: 'pending_actions', color: '#f59e0b' },
              { label: 'Approved Today', value: approved.length, icon: 'check_circle', color: '#9bffce' },
              { label: 'Total in Queue', value: pending.length, icon: 'queue', color: '#62d0ff' },
            ].map(s => (
              <div key={s.label} className="glass-card p-5 border-l-4 hover:-translate-y-1 transition-transform"
                style={{ borderLeftColor: s.color }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">{s.label}</span>
                  <span className="material-symbols-outlined text-xl" style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div className="text-3xl font-bold text-on-surface">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Pending appointments table */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">pending_actions</span> Appointment Approvals
              </h3>
              <button onClick={loadPending} className="btn-secondary text-xs px-4 py-2">
                <span className="material-symbols-outlined text-sm mr-1">refresh</span>Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="text-left pb-3 px-3">Patient</th>
                    <th className="text-left pb-3 px-3">Doctor</th>
                    <th className="text-left pb-3 px-3">Date</th>
                    <th className="text-left pb-3 px-3">Status</th>
                    <th className="text-center pb-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-on-surface-variant text-sm">No appointments in queue</td></tr>
                  ) : pending.map(apt => (
                    <tr key={apt.appointment_id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                            {apt.patient_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p className="font-medium text-on-surface">{apt.patient_name || 'Patient'}</p>
                            <p className="text-xs text-on-surface-variant">ID: #{apt.appointment_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="text-on-surface">{apt.doctor_name || 'Doctor'}</p>
                          {apt.specialization && (
                            <span className="text-xs bg-secondary-container/30 text-on-secondary-container px-2 py-0.5 rounded-full">{apt.specialization}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant">
                        {apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full capitalize
                          ${apt.status === 'approved' ? 'bg-tertiary/10 text-tertiary' :
                            apt.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {apt.status === 'pending' && (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openApprove(apt)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-tertiary/10 text-tertiary hover:bg-tertiary hover:text-surface transition-all">
                              <span className="material-symbols-outlined text-sm">check</span> Approve
                            </button>
                            <button onClick={() => rejectAppointment(apt.appointment_id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-error/10 text-error hover:bg-error hover:text-on-error transition-all">
                              <span className="material-symbols-outlined text-sm">close</span> Reject
                            </button>
                          </div>
                        )}
                        {apt.status !== 'pending' && (
                          <p className="text-center text-xs text-on-surface-variant">Processed</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approved list */}
          {approved.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-xl">check_circle</span> Approved Appointments
              </h3>
              <div className="space-y-2">
                {approved.map(apt => (
                  <div key={apt.appointment_id} className="flex items-center gap-4 p-3 bg-surface-container rounded-xl hover:bg-surface-container-highest/20 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary font-bold text-sm">
                      {apt.patient_name?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">{apt.patient_name}</p>
                      <p className="text-xs text-on-surface-variant">{apt.doctor_name} · {apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString() : ''}</p>
                    </div>
                    <span className="text-xs bg-tertiary/10 text-tertiary px-3 py-1 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check</span> Approved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>}
        </main>
      </div>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
        style={{ background: 'linear-gradient(135deg, #62d0ff, #7459f7)', boxShadow: '0 8px 32px rgba(98,208,255,0.4)' }}
        onClick={loadPending}>
        <span className="material-symbols-outlined text-on-primary text-xl">refresh</span>
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
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Scheduled Time <span className="normal-case text-on-surface-variant/60">(optional)</span></label>
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
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

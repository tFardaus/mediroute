import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api'

export default function ReceptionistDashboard() {
  const [active, setActive] = useState('Dashboard')
  const [pending, setPending] = useState([])
  const [toast, setToast] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { loadPending() }, [])

  async function loadPending() {
    try { const { data } = await api.get('/appointments/pending'); setPending(data?.appointments || data || []) }
    catch {}
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/appointments/${id}`, { status })
      showToast(status === 'approved' ? 'Appointment approved!' : 'Appointment rejected')
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
                    <tr key={apt.id} className="border-b border-outline-variant/10 hover:bg-surface-container-highest/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                            {apt.patient_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p className="font-medium text-on-surface">{apt.patient_name || 'Patient'}</p>
                            <p className="text-xs text-on-surface-variant">ID: {apt.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="text-on-surface">{apt.doctor_name || 'Doctor'}</p>
                          {apt.specialty && (
                            <span className="text-xs bg-secondary-container/30 text-on-secondary-container px-2 py-0.5 rounded-full">{apt.specialty}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant">
                        {apt.preferred_date ? new Date(apt.preferred_date).toLocaleDateString() : '—'}
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
                            <button onClick={() => updateStatus(apt.id, 'approved')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-tertiary/10 text-tertiary hover:bg-tertiary hover:text-surface transition-all">
                              <span className="material-symbols-outlined text-sm">check</span> Approve
                            </button>
                            <button onClick={() => updateStatus(apt.id, 'rejected')}
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
                  <div key={apt.id} className="flex items-center gap-4 p-3 bg-surface-container rounded-xl hover:bg-surface-container-highest/20 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary font-bold text-sm">
                      {apt.patient_name?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">{apt.patient_name}</p>
                      <p className="text-xs text-on-surface-variant">{apt.doctor_name} · {apt.preferred_date ? new Date(apt.preferred_date).toLocaleDateString() : ''}</p>
                    </div>
                    <span className="text-xs bg-tertiary/10 text-tertiary px-3 py-1 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check</span> Approved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
        style={{ background: 'linear-gradient(135deg, #62d0ff, #7459f7)', boxShadow: '0 8px 32px rgba(98,208,255,0.4)' }}
        onClick={loadPending}>
        <span className="material-symbols-outlined text-on-primary text-xl">refresh</span>
      </button>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-surface-container-highest border border-outline-variant/20 text-on-surface px-5 py-3 rounded-xl shadow-2xl text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

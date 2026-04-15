import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const NAV = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Submit Symptoms', icon: 'medical_services' },
  { label: 'AI Suggestion', icon: 'psychology' },
  { label: 'My Appointments', icon: 'calendar_today' },
  { label: 'My Prescriptions', icon: 'prescriptions' },
  { label: 'Consultation Notes', icon: 'description' },
  { label: 'Settings', icon: 'settings' },
]

export default function PatientDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [active, setActive] = useState('Dashboard')
  const [symptoms, setSymptoms] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [symptomId, setSymptomId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    loadAppointments()
    loadPrescriptions()
    loadDoctors()
  }, [])

  async function loadAppointments() {
    try { const { data } = await api.get('/appointments/my'); setAppointments(data?.appointments || data || []) } catch {}
  }
  async function loadPrescriptions() {
    try { const { data } = await api.get('/doctor/prescriptions/my'); setPrescriptions(data?.prescriptions || data || []) } catch {}
  }
  async function loadDoctors() {
    try {
      const { data } = await api.get('/appointments/doctors')
      setDoctors(Array.isArray(data) ? data : data?.doctors || [])
    } catch (err) {
      console.error('loadDoctors failed:', err.response?.status, err.response?.data)
    }
  }

  async function submitSymptoms() {
    if (!symptoms.trim()) return
    setLoading(true); setAiResult(null)
    try {
      const { data } = await api.post('/symptoms', { symptomsText: symptoms })
      setAiResult(data)
      setSymptomId(data.submission?.submission_id || data.id)
      showToast('AI analysis complete!')
    } catch (err) { showToast(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  function openBooking() {
    if (!doctors.length) return showToast('No doctors available at the moment.')
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow.toISOString().split('T')[0])
    setSelectedDoctorId(doctors[0]?.doctor_id || '')
    setBookingOpen(true)
  }

  async function confirmBooking() {
    if (!selectedDoctorId) return showToast('Please select a doctor.')
    if (!selectedDate) return showToast('Please select a date.')
    setBookingLoading(true)
    try {
      await api.post('/appointments', {
        doctorId: selectedDoctorId,
        submissionId: symptomId,
        scheduledDate: selectedDate,
      })
      showToast('Appointment requested successfully!')
      setBookingOpen(false)
      loadAppointments()
    } catch (err) { showToast(err.response?.data?.error || 'Booking failed') }
    finally { setBookingLoading(false) }
  }

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const firstName = (user.name || 'Patient').split(' ')[0]
  const initial = (user.name || 'P').charAt(0).toUpperCase()

  const stats = [
    { label: 'Total Appointments', value: String(appointments.length).padStart(2, '0'), icon: 'event_available', border: 'border-primary/40', iconColor: 'text-primary/40' },
    { label: 'Pending Actions', value: String(appointments.filter(a => a.status === 'pending').length).padStart(2, '0'), icon: 'pending_actions', border: 'border-secondary-dim/40', iconColor: 'text-secondary-dim/40' },
    { label: 'Active Prescriptions', value: String(prescriptions.length).padStart(2, '0'), icon: 'medication', border: 'border-tertiary/40', iconColor: 'text-tertiary/40' },
    { label: 'AI Suggestions', value: aiResult ? '01' : '00', icon: 'auto_awesome', border: 'border-primary/40', iconColor: 'text-primary/40' },
  ]

  const aiText = aiResult?.recommendation?.reasoning || ''
  const aiSpecialty = aiResult?.recommendation?.suggested_specialization || ''

  const statusChip = (s) => {
    if (s === 'approved') return 'bg-primary/10 text-primary'
    if (s === 'pending') return 'bg-amber-500/10 text-amber-500'
    if (s === 'rejected') return 'bg-error/10 text-error'
    return 'bg-surface-container-highest text-on-surface-variant'
  }

  return (
    <div className="bg-surface text-on-surface flex min-h-screen font-body">
      {/* Sidebar */}
      <aside className="flex flex-col h-screen w-64 border-r border-[#62d0ff]/15 bg-[#090e1c]/80 backdrop-blur-xl sticky top-0 py-6 px-4 shrink-0">
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-headline italic text-[#62d0ff] drop-shadow-[0_0_8px_rgba(98,208,255,0.5)]">MediRoute</h1>
          <p className="text-[11px] tracking-wide uppercase text-on-surface-variant mt-1">Clinical Intelligence</p>
        </div>

        <div className="flex items-center gap-3 px-4 mb-8">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/20 flex items-center justify-center text-primary font-bold">
              {initial}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-tertiary rounded-full border-2 border-surface" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">{user.name || 'Patient'}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Patient ID: #{user.id || '----'}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map(item => {
            const isActive = active === item.label
            return (
              <a
                key={item.label}
                href="#"
                onClick={(e) => { e.preventDefault(); setActive(item.label) }}
                className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'text-[#62d0ff] font-bold border-r-2 border-[#62d0ff] bg-gradient-to-r from-[#62d0ff]/10 to-transparent'
                    : 'text-[#a0aace] hover:bg-[#62d0ff]/5 hover:text-[#62d0ff]'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm tracking-wide uppercase text-[11px]">{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="pt-4 mt-auto border-t border-[#62d0ff]/10 space-y-1">
          <a href="#" onClick={(e) => { e.preventDefault(); setActive('Profile') }}
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#a0aace] hover:bg-[#62d0ff]/5 hover:text-[#62d0ff] transition-all duration-300">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-sm tracking-wide uppercase text-[11px] truncate">{user.name || 'Patient'}</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); logout() }}
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-[#a0aace] hover:bg-error/10 hover:text-error transition-all duration-300">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm tracking-wide uppercase text-[11px]">Logout</span>
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col bg-surface min-w-0">
        {/* Header */}
        <header className="flex justify-between items-center w-full px-8 sticky top-0 z-50 h-20 bg-[#090e1c]/40 backdrop-blur-md border-b border-[#62d0ff]/5">
          <div className="flex flex-col">
            <h2 className="text-xl font-headline font-bold text-on-surface">Good Morning, {firstName} 👋</h2>
            <p className="text-xs text-on-surface-variant">{dateStr} | {timeStr}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer text-[#a0aace] hover:text-[#62d0ff] transition-colors">
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border border-surface" />
            </div>
            <div className="cursor-pointer text-[#a0aace] hover:text-[#62d0ff] transition-colors">
              <span className="material-symbols-outlined text-2xl">history_edu</span>
            </div>
            <div className="h-8 w-[1px] bg-outline-variant/30" />
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/10 flex items-center justify-center text-primary font-bold">
              {initial}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-10 overflow-y-auto">
          {/* Stats */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label}
                className={`glass-card p-6 rounded-xl border-l-4 ${s.border} flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300`}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">{s.label}</p>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-headline font-extrabold text-on-surface leading-none">{s.value}</span>
                  <span className={`material-symbols-outlined ${s.iconColor} text-3xl`}>{s.icon}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Symptom triage bento */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input */}
            <div className="lg:col-span-2 bg-surface-container rounded-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary-dim" />
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
                <h3 className="text-2xl font-headline font-bold">Submit Your Symptoms</h3>
              </div>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed max-w-xl">
                Our clinical intelligence engine uses encrypted diagnostic models to provide preliminary guidance. Describe your symptoms in detail below.
              </p>
              <div className="relative group">
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full h-48 bg-surface-container-low border-none rounded-xl p-6 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/40 transition-all text-base resize-none"
                  placeholder="Describe how you're feeling today... (e.g., persistent dry cough for 3 days, mild fatigue, no fever)"
                />
                <div className="absolute inset-0 rounded-xl border border-primary/5 pointer-events-none group-focus-within:border-primary/30" />
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={submitSymptoms}
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-secondary-dim text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(98,208,255,0.4)] transition-all active:scale-95 disabled:opacity-60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                >
                  {loading ? 'Analyzing…' : 'Get AI Recommendation'}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* AI Result */}
            <div className="bg-surface-container rounded-xl p-8 border border-primary/30 shadow-[0_0_30px_rgba(98,208,255,0.1)] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">AI Result Analysis</p>
                </div>
                <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div className="mb-6">
                <p className="text-xs text-on-surface-variant mb-1">Suggested Specialization</p>
                <h4 className="text-2xl font-headline font-bold text-on-surface">{aiSpecialty}</h4>
              </div>
              <div className="space-y-4 mb-8">
                <p className="text-sm text-on-surface-variant italic leading-relaxed">
                  {aiText
                    ? `"${aiText}"`
                    : '"Symptoms indicate potential palpitations related to stress or mild arrhythmia. Clinical consultation is advised within 48 hours."'}
                </p>
              </div>
              <button
                onClick={openBooking}
                className="mt-auto w-full py-3 bg-surface-container-highest hover:bg-surface-bright border border-outline-variant/30 rounded-xl text-on-surface font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                Book Appointment
              </button>
            </div>
          </section>

          {/* Secondary grid */}
          <section className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Appointments */}
            <div className="xl:col-span-3 bg-surface-container-low rounded-xl overflow-hidden">
              <div className="p-6 flex justify-between items-center border-b border-outline-variant/10">
                <h3 className="text-lg font-headline font-bold">Recent Appointments</h3>
                <button
                  onClick={openBooking}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-primary text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Book Appointment
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest bg-surface-container-high/50">
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Doctor</th>
                      <th className="px-6 py-4 font-semibold">Specialization</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {appointments.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm">No appointments yet</td></tr>
                    ) : appointments.slice(0, 5).map(apt => (
                      <tr key={apt.appointment_id} className="hover:bg-surface-container-highest/20 transition-colors">
                        <td className="px-6 py-5 text-sm font-medium">
                          {apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-6 py-5 text-sm">{apt.doctor_name || 'Doctor'}</td>
                        <td className="px-6 py-5 text-xs text-on-surface-variant">{apt.specialization || '—'}</td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter ${statusChip(apt.status)}`}>
                            {apt.status === 'approved' ? 'Confirmed' : apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prescriptions */}
            <div className="xl:col-span-2 space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-lg font-headline font-bold">Active Prescriptions</h3>
                <button className="text-xs text-primary hover:underline font-bold uppercase tracking-widest">View All</button>
              </div>
              <div className="space-y-4">
                {prescriptions.length === 0 ? (
                  <>
                    <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">Lisinopril 10mg</h4>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Issued by Dr. Sarah Jenkins</p>
                        </div>
                        <span className="material-symbols-outlined text-primary/40">medication_liquid</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div className="flex-1">
                          <p className="text-on-surface-variant text-[9px] uppercase tracking-tighter mb-1">Dosage</p>
                          <p className="font-medium">1 Tablet Daily</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-on-surface-variant text-[9px] uppercase tracking-tighter mb-1">Timing</p>
                          <p className="font-medium">Before Breakfast</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">Amoxicillin 500mg</h4>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Issued by Dr. Michael Chen</p>
                        </div>
                        <span className="material-symbols-outlined text-primary/40">pill</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div className="flex-1">
                          <p className="text-on-surface-variant text-[9px] uppercase tracking-tighter mb-1">Dosage</p>
                          <p className="font-medium">2 Tablets Daily</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-on-surface-variant text-[9px] uppercase tracking-tighter mb-1">Timing</p>
                          <p className="font-medium">After Meals (7 days)</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : prescriptions.slice(0, 4).map(p => (
                  <div key={p.prescription_id} className="bg-surface-container p-5 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                          {p.medication || 'Prescription'}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                          Issued by {p.doctor_name || 'Doctor'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-primary/40">medication_liquid</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div className="flex-1">
                        <p className="text-on-surface-variant text-[9px] uppercase tracking-tighter mb-1">Dosage</p>
                        <p className="font-medium">{p.dosage || '—'}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-on-surface-variant text-[9px] uppercase tracking-tighter mb-1">Instructions</p>
                        <p className="font-medium truncate">{p.instructions || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Booking Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-[#62d0ff]/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-headline font-bold text-on-surface">Book Appointment</h3>
              <button onClick={() => setBookingOpen(false)} className="text-[#a0aace] hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {aiSpecialty ? (
              <div className="mb-5 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <p className="text-xs text-primary font-bold uppercase tracking-widest">AI Suggested: {aiSpecialty}</p>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant mb-5">
                No AI recommendation yet — you can still select any doctor and date below.
              </p>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Select Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  {doctors.map(d => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.name} — {d.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Preferred Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setBookingOpen(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                disabled={bookingLoading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary-dim text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(98,208,255,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {bookingLoading ? 'Submitting…' : 'Request Appointment'}
                {!bookingLoading && <span className="material-symbols-outlined text-sm">send</span>}
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

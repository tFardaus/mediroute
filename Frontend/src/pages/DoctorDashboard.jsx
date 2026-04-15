import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api'

export default function DoctorDashboard() {
  const [active, setActive] = useState('Dashboard')
  const [appointments, setAppointments] = useState([])
  const [note, setNote] = useState('')
  const [aptId, setAptId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: 'Once daily', instructions: '' }])
  const [toast, setToast] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { loadAppointments() }, [])

  async function loadAppointments() {
    try { const { data } = await api.get('/appointments/doctor'); setAppointments(data?.appointments || data || []) }
    catch {}
  }

  async function saveNote(e) {
    e.preventDefault()
    try {
      await api.post('/doctor/notes', { appointment_id: parseInt(aptId), note })
      showToast('Note saved!'); setNote(''); setAptId('')
    } catch (err) { showToast(err.response?.data?.error || 'Failed') }
  }

  async function issuePrescription(e) {
    e.preventDefault()
    const medications = meds.map(m => `${m.name} ${m.dosage} - ${m.frequency}${m.instructions ? '. ' + m.instructions : ''}`).join('\n')
    try {
      await api.post('/doctor/prescriptions', { appointment_id: parseInt(aptId), patient_id: parseInt(patientId), medications, instructions: '' })
      showToast('Prescription issued!'); setMeds([{ name:'',dosage:'',frequency:'Once daily',instructions:'' }])
    } catch (err) { showToast(err.response?.data?.error || 'Failed') }
  }

  function addMed() { setMeds(m => [...m, { name:'',dosage:'',frequency:'Once daily',instructions:'' }]) }
  function updateMed(i, k, v) { setMeds(m => m.map((x,idx)=> idx===i ? {...x,[k]:v} : x)) }
  function removeMed(i) { setMeds(m => m.filter((_,idx)=>idx!==i)) }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="doctor" active={active} setActive={setActive} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 bg-surface-container-low">
          <div>
            <h1 className="text-xl font-headline font-bold text-on-surface">Doctor Dashboard</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Dr. {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Search patient…" className="input-field py-2 pr-4 pl-9 text-xs w-48" />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-xl cursor-pointer hover:text-primary">notifications</span>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user.name?.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          {/* My appointments */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">event_available</span> My Appointments
              </h3>
              <button onClick={loadAppointments} className="btn-secondary text-xs px-4 py-2">Refresh</button>
            </div>
            {appointments.length === 0 ? (
              <p className="text-center py-8 text-on-surface-variant text-sm">No approved appointments yet</p>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id} className="flex items-center gap-4 p-4 bg-surface-container rounded-xl border-l-4 border-primary/40 hover:bg-surface-container-highest/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {apt.patient_name?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">{apt.patient_name || 'Patient'}</p>
                      <p className="text-xs text-on-surface-variant">{apt.preferred_date ? new Date(apt.preferred_date).toLocaleDateString() : 'Date TBD'}</p>
                    </div>
                    <span className="text-xs bg-tertiary/10 text-tertiary px-3 py-1 rounded-full">Approved</span>
                    <button onClick={() => setAptId(String(apt.id))} className="text-xs text-primary hover:underline">Select</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Consultation Note */}
            <div className="glass-card p-6">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">note_alt</span> Consultation Note
                <span className="ml-auto text-xs bg-surface-container px-2.5 py-1 rounded-full text-on-surface-variant border border-outline-variant/20">Autosaves</span>
              </h3>
              <form onSubmit={saveNote} className="space-y-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">tag</span>
                  <input type="number" placeholder="Appointment ID" value={aptId} onChange={e=>setAptId(e.target.value)} required className="input-field pl-10 text-sm" />
                </div>
                <textarea value={note} onChange={e=>setNote(e.target.value)} rows={5} required
                  placeholder="Clinical observations, diagnosis, recommendations…"
                  className="input-field resize-none text-sm" />
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary px-4 py-2 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">mic</span>
                  </button>
                  <button type="button" className="btn-secondary px-4 py-2 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">attach_file</span>
                  </button>
                  <button type="submit" className="btn-primary py-2 px-5 text-sm flex-1">Save Note</button>
                </div>
              </form>
            </div>

            {/* Prescription */}
            <div className="glass-card p-6">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">medication</span> Issue Prescription
              </h3>
              <form onSubmit={issuePrescription} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">tag</span>
                    <input type="number" placeholder="Appointment ID" value={aptId} onChange={e=>setAptId(e.target.value)} required className="input-field pl-10 text-sm" />
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">person</span>
                    <input type="number" placeholder="Patient ID" value={patientId} onChange={e=>setPatientId(e.target.value)} required className="input-field pl-10 text-sm" />
                  </div>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {meds.map((med, i) => (
                    <div key={i} className="bg-surface-container-low/40 rounded-xl p-3 space-y-2 border border-outline-variant/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-on-surface-variant">Medication {i+1}</span>
                        {meds.length > 1 && <button type="button" onClick={()=>removeMed(i)} className="text-error text-xs hover:underline">Remove</button>}
                      </div>
                      <input placeholder="Medication name" value={med.name} onChange={e=>updateMed(i,'name',e.target.value)} required className="input-field text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Dosage e.g. 50mg" value={med.dosage} onChange={e=>updateMed(i,'dosage',e.target.value)} className="input-field text-sm" />
                        <select value={med.frequency} onChange={e=>updateMed(i,'frequency',e.target.value)} className="input-field text-sm">
                          {['Once daily','Twice daily','Three times daily','As needed'].map(f=><option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <input placeholder="Special instructions" value={med.instructions} onChange={e=>updateMed(i,'instructions',e.target.value)} className="input-field text-sm" />
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addMed}
                  className="w-full py-2 rounded-xl border border-dashed border-outline-variant/40 text-on-surface-variant text-xs hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span> Add Another Medication
                </button>

                <button type="submit" className="btn-primary py-2.5 text-sm">Confirm & Transmit Prescription</button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-surface-container-highest border border-outline-variant/20 text-on-surface px-5 py-3 rounded-xl shadow-2xl text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

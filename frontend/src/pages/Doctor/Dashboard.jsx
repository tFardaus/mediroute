import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [prescription, setPrescription] = useState({ medication: '', dosage: '', instructions: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAppointments([
      { appointment_id: 1, patient_name: 'Rahim Chowdhury', patient_email: 'rahim@example.com', patient_phone: '01711000001', scheduled_date: '2025-07-10', symptoms_text: 'Chest pain and shortness of breath for 2 days.', suggested_specialization: 'Cardiology', reasoning: 'Symptoms are consistent with a cardiac condition.' },
      { appointment_id: 2, patient_name: 'Nadia Islam', patient_email: 'nadia@example.com', patient_phone: '01711000002', scheduled_date: '2025-07-12', symptoms_text: 'Severe headaches and dizziness since last week.', suggested_specialization: 'Neurology', reasoning: 'Recurring headaches with dizziness may indicate a neurological issue.' },
      { appointment_id: 3, patient_name: 'Karim Uddin', patient_email: 'karim@example.com', patient_phone: '01711000003', scheduled_date: null, symptoms_text: 'Fever, cough and sore throat for 3 days.', suggested_specialization: 'General Practice', reasoning: 'Common cold or flu symptoms.' },
    ]);
  }, []);

  const saveNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post('/doctor/notes', { appointmentId: selected.appointment_id, content: note });
      setMessage('✅ Note saved!');
      setNote('');
    } catch (err) {
      setMessage('Failed to save note.');
    }
  };

  const savePrescription = async () => {
    if (!prescription.medication.trim()) return;
    try {
      await api.post('/doctor/prescriptions', { appointmentId: selected.appointment_id, ...prescription });
      setMessage('✅ Prescription issued!');
      setPrescription({ medication: '', dosage: '', instructions: '' });
    } catch (err) {
      setMessage('Failed to issue prescription.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-700">🏥 MediRoute — Doctor</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Dr. {user.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 flex gap-6">
        <div className="w-1/3 space-y-3">
          <h2 className="font-semibold text-gray-700">Your Appointments</h2>
          {appointments.map(apt => (
            <div
              key={apt.appointment_id}
              onClick={() => { setSelected(apt); setMessage(''); }}
              className={`p-4 rounded-xl cursor-pointer border transition ${
                selected?.appointment_id === apt.appointment_id
                  ? 'border-green-500 bg-green-50'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-800">{apt.patient_name}</p>
              <p className="text-sm text-gray-500">
                {apt.scheduled_date ? new Date(apt.scheduled_date).toLocaleDateString() : 'Date TBD'}
              </p>
            </div>
          ))}
          {appointments.length === 0 && (
            <p className="text-gray-400 text-sm">No appointments yet.</p>
          )}
        </div>

        {selected ? (
          <div className="flex-1 space-y-5">
            {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg">{message}</div>}

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-lg text-gray-800 mb-3">👤 Patient: {selected.patient_name}</h3>
              <p className="text-sm text-gray-500 mb-3">📧 {selected.patient_email} | 📞 {selected.patient_phone}</p>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-700">Reported Symptoms:</p>
                <p className="text-sm text-gray-700">{selected.symptoms_text}</p>
                {selected.suggested_specialization && (
                  <p className="text-sm text-blue-600 mt-2">
                    🤖 AI recommended: <strong>{selected.suggested_specialization}</strong>
                    <br />
                    <span className="text-gray-500">{selected.reasoning}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">📝 Consultation Notes</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add your consultation notes..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-green-400"
              />
              <button onClick={saveNote} className="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600">
                Save Note
              </button>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">💊 Issue Prescription</h3>
              <div className="space-y-3">
                <input
                  placeholder="Medication name"
                  value={prescription.medication}
                  onChange={(e) => setPrescription({ ...prescription, medication: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
                />
                <input
                  placeholder="Dosage (e.g., 500mg twice daily)"
                  value={prescription.dosage}
                  onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
                />
                <textarea
                  placeholder="Additional instructions..."
                  value={prescription.instructions}
                  onChange={(e) => setPrescription({ ...prescription, instructions: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-green-400"
                />
                <button onClick={savePrescription} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  Issue Prescription
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            ← Select an appointment to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;

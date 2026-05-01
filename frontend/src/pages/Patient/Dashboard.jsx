import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState('symptoms');
  const [symptoms, setSymptoms] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDoctors([
      { doctor_id: 1, name: 'Sarah Ahmed', specialization: 'Cardiology' },
      { doctor_id: 2, name: 'James Malik', specialization: 'Neurology' },
      { doctor_id: 3, name: 'Priya Hassan', specialization: 'General Practice' },
    ]);
    if (view === 'appointments') setAppointments([
      { appointment_id: 1, doctor_name: 'Sarah Ahmed', specialization: 'Cardiology', scheduled_date: '2025-07-10', scheduled_time: '10:00', status: 'approved' },
      { appointment_id: 2, doctor_name: 'James Malik', specialization: 'Neurology', scheduled_date: null, scheduled_time: null, status: 'pending' },
      { appointment_id: 3, doctor_name: 'Priya Hassan', specialization: 'General Practice', scheduled_date: '2025-06-28', scheduled_time: '14:30', status: 'completed' },
    ]);
    if (view === 'prescriptions') setPrescriptions([
      { prescription_id: 1, medication: 'Amoxicillin', dosage: '500mg twice daily', instructions: 'Take with food. Complete the full course.', issued_at: '2025-06-20', doctor_name: 'Priya Hassan' },
      { prescription_id: 2, medication: 'Atorvastatin', dosage: '10mg once daily', instructions: 'Take at night before bed.', issued_at: '2025-06-15', doctor_name: 'Sarah Ahmed' },
    ]);
  }, [view]);

  const handleSymptomSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/symptoms', { symptomsText: symptoms });
      setAiResult(res.data);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to analyze symptoms.');
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async (doctorId) => {
    if (!aiResult) return;
    setLoading(true);
    try {
      await api.post('/appointments', {
        doctorId,
        submissionId: aiResult.submission.submission_id,
      });
      setMessage('✅ Appointment requested! Waiting for receptionist approval.');
      setAiResult(null);
      setSymptoms('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">🏥 MediRoute</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Hello, {user.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'symptoms', label: '🔬 Submit Symptoms' },
            { key: 'appointments', label: '📅 My Appointments' },
            { key: 'prescriptions', label: '💊 Prescriptions' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setView(tab.key); setMessage(''); }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-4">{message}</div>
        )}

        {view === 'symptoms' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Describe Your Symptoms</h2>
            <form onSubmit={handleSymptomSubmit} className="space-y-4">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={5}
                placeholder="Describe your symptoms in detail. E.g., I have been experiencing chest pain and shortness of breath for 2 days..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? '🤖 Analyzing...' : '🤖 Get AI Recommendation'}
              </button>
            </form>

            {aiResult && (
              <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-xl">
                <h3 className="font-semibold text-green-800 text-lg mb-2">🧠 AI Recommendation</h3>
                <p className="text-green-700 mb-1">
                  <strong>Suggested Specialization:</strong>{' '}
                  {aiResult.recommendation?.suggested_specialization}
                </p>
                <p className="text-gray-600 text-sm mb-4">{aiResult.recommendation?.reasoning}</p>

                <h4 className="font-medium text-gray-700 mb-3">Book with a doctor:</h4>
                <div className="grid gap-3">
                  {doctors
                    .filter(d =>
                      d.specialization?.toLowerCase() ===
                      aiResult.recommendation?.suggested_specialization?.toLowerCase()
                    )
                    .map(doctor => (
                      <div key={doctor.doctor_id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-sm text-gray-500">{doctor.specialization}</p>
                        </div>
                        <button
                          onClick={() => bookAppointment(doctor.doctor_id)}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700"
                        >
                          Book
                        </button>
                      </div>
                    ))}
                  {doctors.filter(d =>
                    d.specialization?.toLowerCase() ===
                    aiResult.recommendation?.suggested_specialization?.toLowerCase()
                  ).length === 0 && (
                    <div>
                      <p className="text-gray-500 text-sm mb-2">No exact match found. All available doctors:</p>
                      {doctors.map(doctor => (
                        <div key={doctor.doctor_id} className="flex items-center justify-between bg-white p-3 rounded-lg border mb-2">
                          <div>
                            <p className="font-medium">{doctor.name}</p>
                            <p className="text-sm text-gray-500">{doctor.specialization}</p>
                          </div>
                          <button
                            onClick={() => bookAppointment(doctor.doctor_id)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700"
                          >
                            Book
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'appointments' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
                No appointments yet. Submit your symptoms to get started!
              </div>
            ) : (
              appointments.map(apt => (
                <div key={apt.appointment_id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">Dr. {apt.doctor_name}</p>
                      <p className="text-sm text-gray-500">{apt.specialization}</p>
                      {apt.scheduled_date && (
                        <p className="text-sm text-gray-600 mt-1">
                          📅 {new Date(apt.scheduled_date).toLocaleDateString()} {apt.scheduled_time && `at ${apt.scheduled_time}`}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[apt.status]}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
                No prescriptions yet.
              </div>
            ) : (
              prescriptions.map(p => (
                <div key={p.prescription_id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-gray-800">💊 {p.medication}</h3>
                    <span className="text-sm text-gray-400">{new Date(p.issued_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Dosage: {p.dosage}</p>
                  <p className="text-sm text-gray-600">Instructions: {p.instructions}</p>
                  <p className="text-sm text-gray-500 mt-1">By: Dr. {p.doctor_name}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;

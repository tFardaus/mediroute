import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ReceptionistDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [scheduleInput, setScheduleInput] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAppointments([
      { appointment_id: 1, patient_name: 'Rahim Chowdhury', patient_email: 'rahim@example.com', doctor_name: 'Sarah Ahmed', specialization: 'Cardiology', symptoms_text: 'Chest pain and shortness of breath for 2 days.', suggested_specialization: 'Cardiology' },
      { appointment_id: 2, patient_name: 'Nadia Islam', patient_email: 'nadia@example.com', doctor_name: 'James Malik', specialization: 'Neurology', symptoms_text: 'Severe headaches and dizziness since last week.', suggested_specialization: 'Neurology' },
      { appointment_id: 3, patient_name: 'Karim Uddin', patient_email: 'karim@example.com', doctor_name: 'Priya Hassan', specialization: 'General Practice', symptoms_text: 'Fever, cough and sore throat for 3 days.', suggested_specialization: 'General Practice' },
    ]);
  }, []);

  const handleDecision = async (id, status, scheduledDate, scheduledTime) => {
    try {
      await api.patch(`/appointments/${id}`, { status, scheduledDate, scheduledTime });
      setMessage(`✅ Appointment ${status}!`);
      fetchPending();
    } catch (err) {
      setMessage('Failed to update appointment.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-700">🏥 MediRoute — Receptionist</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pending Appointments</h2>
        <p className="text-gray-500 mb-6">{appointments.length} appointment(s) waiting for review</p>

        {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">{message}</div>}

        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            No pending appointments 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(apt => (
              <div key={apt.appointment_id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{apt.patient_name}</p>
                    <p className="text-sm text-gray-500">{apt.patient_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-700">Dr. {apt.doctor_name}</p>
                    <p className="text-sm text-gray-500">{apt.specialization}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-blue-700">Patient Symptoms:</p>
                  <p className="text-sm text-gray-700">{apt.symptoms_text}</p>
                  {apt.suggested_specialization && (
                    <p className="text-sm text-blue-600 mt-1">
                      🤖 AI suggested: <strong>{apt.suggested_specialization}</strong>
                    </p>
                  )}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <input
                    type="date"
                    onChange={(e) => setScheduleInput(prev => ({ ...prev, [apt.appointment_id]: { ...prev[apt.appointment_id], date: e.target.value }}))}
                    className="border rounded-lg px-3 py-1.5 text-sm"
                  />
                  <input
                    type="time"
                    onChange={(e) => setScheduleInput(prev => ({ ...prev, [apt.appointment_id]: { ...prev[apt.appointment_id], time: e.target.value }}))}
                    className="border rounded-lg px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => handleDecision(
                      apt.appointment_id, 'approved',
                      scheduleInput[apt.appointment_id]?.date,
                      scheduleInput[apt.appointment_id]?.time
                    )}
                    className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-600"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleDecision(apt.appointment_id, 'rejected')}
                    className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-600"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;

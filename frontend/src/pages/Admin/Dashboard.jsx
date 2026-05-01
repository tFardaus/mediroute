import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '', phone: '' });
  const [recForm, setRecForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [view, setView] = useState('overview');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDoctors([
      { doctor_id: 1, name: 'Sarah Ahmed', specialization: 'Cardiology', email: 'sarah@mediroute.com' },
      { doctor_id: 2, name: 'James Malik', specialization: 'Neurology', email: 'james@mediroute.com' },
      { doctor_id: 3, name: 'Priya Hassan', specialization: 'General Practice', email: 'priya@mediroute.com' },
    ]);
    setStats({ totalPatients: 124, totalDoctors: 3, pendingAppointments: 8, approvedAppointments: 47 });
  }, []);

  const addDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/doctors', form);
      setMessage('✅ Doctor added!');
      setForm({ name: '', email: '', password: '', specialization: '', phone: '' });
      api.get('/admin/doctors').then(r => setDoctors(r.data));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed.');
    }
  };

  const addReceptionist = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/receptionists', recForm);
      setMessage('✅ Receptionist added!');
      setRecForm({ name: '', email: '', password: '', phone: '' });
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed.');
    }
  };

  const removeDoctor = async (id) => {
    if (!window.confirm('Remove this doctor?')) return;
    await api.delete(`/admin/doctors/${id}`);
    setDoctors(doctors.filter(d => d.doctor_id !== id));
  };

  const statCards = [
    { label: 'Total Patients', value: stats.totalPatients, color: 'blue' },
    { label: 'Total Doctors', value: stats.totalDoctors, color: 'green' },
    { label: 'Pending Appointments', value: stats.pendingAppointments, color: 'yellow' },
    { label: 'Approved Appointments', value: stats.approvedAppointments, color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-red-700">🏥 MediRoute — Admin</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {['overview', 'doctors', 'receptionists'].map(t => (
            <button key={t} onClick={() => { setView(t); setMessage(''); }}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${view === t ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              {t}
            </button>
          ))}
        </div>

        {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">{message}</div>}

        {view === 'overview' && (
          <div className="grid grid-cols-2 gap-4">
            {statCards.map(s => (
              <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 text-sm">{s.label}</p>
                <p className={`text-4xl font-bold text-${s.color}-600 mt-1`}>{s.value ?? '—'}</p>
              </div>
            ))}
          </div>
        )}

        {view === 'doctors' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Add New Doctor</h3>
              <form onSubmit={addDoctor} className="grid grid-cols-2 gap-3">
                {[
                  { key: 'name', placeholder: 'Full Name' },
                  { key: 'email', placeholder: 'Email', type: 'email' },
                  { key: 'specialization', placeholder: 'Specialization (e.g., Cardiology)' },
                  { key: 'phone', placeholder: 'Phone' },
                  { key: 'password', placeholder: 'Password', type: 'password' },
                ].map(f => (
                  <input key={f.key} type={f.type || 'text'} placeholder={f.placeholder}
                    value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400"
                    required={f.key !== 'phone'} />
                ))}
                <button type="submit" className="col-span-2 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700">
                  Add Doctor
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">All Doctors ({doctors.length})</h3>
              <div className="divide-y">
                {doctors.map(d => (
                  <div key={d.doctor_id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-sm text-gray-500">{d.specialization} · {d.email}</p>
                    </div>
                    <button onClick={() => removeDoctor(d.doctor_id)} className="text-red-500 text-sm hover:underline">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'receptionists' && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Add New Receptionist</h3>
            <form onSubmit={addReceptionist} className="grid grid-cols-2 gap-3">
              {[
                { key: 'name', placeholder: 'Full Name' },
                { key: 'email', placeholder: 'Email', type: 'email' },
                { key: 'phone', placeholder: 'Phone' },
                { key: 'password', placeholder: 'Password', type: 'password' },
              ].map(f => (
                <input key={f.key} type={f.type || 'text'} placeholder={f.placeholder}
                  value={recForm[f.key]} onChange={(e) => setRecForm({ ...recForm, [f.key]: e.target.value })}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400"
                  required={f.key !== 'phone'} />
              ))}
              <button type="submit" className="col-span-2 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700">
                Add Receptionist
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

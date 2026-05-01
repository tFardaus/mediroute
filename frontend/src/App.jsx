import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PatientDashboard from './pages/Patient/Dashboard';
import DoctorDashboard from './pages/Doctor/Dashboard';
import ReceptionistDashboard from './pages/Receptionist/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard';

const RootRedirect = () => <Navigate to="/login" replace />;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/patient" element={
            <ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>
          } />
          <Route path="/doctor" element={
            <ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>
          } />
          <Route path="/receptionist" element={
            <ProtectedRoute allowedRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

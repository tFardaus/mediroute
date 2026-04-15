import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import ReceptionistDashboard from './pages/ReceptionistDashboard'

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/doctor" element={<PrivateRoute allowedRoles={['doctor']}><DoctorDashboard /></PrivateRoute>} />
        <Route path="/patient" element={<PrivateRoute allowedRoles={['patient']}><PatientDashboard /></PrivateRoute>} />
        <Route path="/receptionist" element={<PrivateRoute allowedRoles={['receptionist']}><ReceptionistDashboard /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

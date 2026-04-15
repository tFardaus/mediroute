import { useNavigate } from 'react-router-dom'

const NAV = {
  admin: [
    { icon: 'dashboard', label: 'Dashboard', path: '/admin' },
    { icon: 'group', label: 'Doctors', path: '/admin' },
    { icon: 'badge', label: 'Receptionists', path: '/admin' },
    { icon: 'bar_chart', label: 'Stats', path: '/admin' },
  ],
  doctor: [
    { icon: 'dashboard', label: 'Dashboard', path: '/doctor' },
    { icon: 'event_available', label: 'Appointments', path: '/doctor' },
    { icon: 'medication', label: 'Prescriptions', path: '/doctor' },
    { icon: 'note_alt', label: 'Notes', path: '/doctor' },
  ],
  patient: [
    { icon: 'dashboard', label: 'Dashboard', path: '/patient' },
    { icon: 'healing', label: 'Symptoms', path: '/patient' },
    { icon: 'event_available', label: 'Appointments', path: '/patient' },
    { icon: 'medication', label: 'Prescriptions', path: '/patient' },
  ],
  receptionist: [
    { icon: 'dashboard', label: 'Dashboard', path: '/receptionist' },
    { icon: 'pending_actions', label: 'Pending', path: '/receptionist' },
    { icon: 'check_circle', label: 'Approved', path: '/receptionist' },
    { icon: 'group', label: 'Patients', path: '/receptionist' },
  ],
}

export default function Sidebar({ role, active, setActive }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col border-r border-outline-variant/10 bg-surface-container-low">
      {/* Logo */}
      <div className="p-6 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">local_hospital</span>
          <span className="font-headline italic text-xl text-on-surface" style={{ textShadow: '0 0 20px rgba(98,208,255,0.3)' }}>MediRoute</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {(NAV[role] || []).map(item => (
          <button key={item.label} onClick={() => setActive(item.label)}
            className={`sidebar-item w-full ${active === item.label ? 'active' : ''}`}>
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-outline-variant/10">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {user.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{user.name || 'User'}</p>
            <p className="text-xs text-on-surface-variant capitalize">{role}</p>
          </div>
        </div>
        <button onClick={logout} className="sidebar-item w-full text-error hover:text-error hover:bg-error/10">
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

const ROLES = ['patient', 'doctor', 'receptionist']

export default function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState('patient')
  const [form, setForm] = useState({ name: '', dob: '', email: '', phone: '', password: '', confirmPassword: '', address: '' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (!agreed) return setError('Please accept the terms of service.')
    setLoading(true)
    try {
      await api.post('/auth/register', { ...form, role })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Background glows */}
      <div className="fixed top-0 left-0 w-96 h-96 pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(98,208,255,0.6) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(116,89,247,0.6) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">local_hospital</span>
          <span className="font-headline italic text-xl text-on-surface" style={{ textShadow: '0 0 20px rgba(98,208,255,0.3)' }}>MediRoute</span>
        </div>
        <span className="text-xs text-on-surface-variant bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant/20">
          Step 1 of 2
        </span>
      </header>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="glass-panel rounded-3xl p-8 border border-outline-variant/10"
            style={{ boxShadow: '0 24px 48px -8px rgba(0,0,0,0.5)' }}>
            <h2 className="text-2xl font-headline font-bold text-on-surface mb-1">Create Your Account</h2>
            <p className="text-on-surface-variant text-sm mb-6">Join MediRoute and experience smarter healthcare</p>

            {/* Role selection */}
            <div className="flex gap-3 mb-6">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    ${role === r
                      ? 'text-on-primary shadow-lg shadow-primary/20'
                      : 'border border-outline-variant/30 text-on-surface-variant hover:border-primary/40'}`}
                  style={role === r ? { background: 'linear-gradient(135deg, #00b6ea, #62d0ff, #7459f7)' } : {}}>
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Full Name', key: 'name', type: 'text', icon: 'person', placeholder: 'Your full name' },
                  { label: 'Date of Birth', key: 'dob', type: 'date', icon: 'cake', placeholder: '' },
                  { label: 'Email Address', key: 'email', type: 'email', icon: 'mail', placeholder: 'you@example.com' },
                  { label: 'Phone Number', key: 'phone', type: 'tel', icon: 'phone', placeholder: '+880 ...' },
                  { label: 'Password', key: 'password', type: 'password', icon: 'lock', placeholder: '••••••••' },
                  { label: 'Confirm Password', key: 'confirmPassword', type: 'password', icon: 'lock_reset', placeholder: '••••••••' },
                ].map(({ label, key, type, icon, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">{label}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">{icon}</span>
                      <input type={type} value={form[key]} onChange={set(key)} placeholder={placeholder} required
                        className="input-field pl-10" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Address</label>
                <textarea value={form.address} onChange={set('address')} rows={3} placeholder="Your full address"
                  className="input-field resize-none" />
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 mb-5 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-primary" />
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  I agree to the{' '}
                  <span className="text-primary cursor-pointer hover:underline">Terms of Service</span> and{' '}
                  <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
                </span>
              </label>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs mb-4">
                  <span className="material-symbols-outlined text-base">error</span>{error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="border-t border-outline-variant/10 mt-6 pt-5 flex justify-center">
              <Link to="/login" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

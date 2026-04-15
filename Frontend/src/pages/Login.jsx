import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

const ROLES = ['patient', 'doctor', 'receptionist', 'admin']

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password, role })
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', role)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate(`/${role}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background text-on-surface font-body min-h-screen overflow-hidden">
      <div className="flex flex-col md:flex-row h-screen w-full">
        {/* Left Panel: Brand Anchor & Visuals */}
        <section className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#00c4fd] to-[#7459f7]">
          {/* Decorative neuron background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1400&q=80')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-on-primary">local_hospital</span>
              <h1 className="text-3xl font-headline font-bold italic tracking-tight text-white drop-shadow-md">
                MediRoute
              </h1>
            </div>
            <p className="mt-4 text-xl font-headline italic text-on-primary/90 max-w-sm">
              Connecting Patients to the Right Care
            </p>
          </div>

          {/* Central Graphic */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-12">
            <svg className="w-64 h-32 text-white/40" fill="none" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 50H40L50 20L70 80L85 50H115L125 10L145 90L160 50H200"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/20 editorial-shadow transform transition-transform hover:scale-105">
                <span className="block text-3xl font-headline font-bold text-white mb-1">1200+</span>
                <span className="text-[11px] uppercase tracking-widest text-white/80 font-medium">Patients Served</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl border border-white/20 editorial-shadow transform transition-transform hover:scale-105">
                <span className="block text-3xl font-headline font-bold text-white mb-1">98%</span>
                <span className="text-[11px] uppercase tracking-widest text-white/80 font-medium">AI Accuracy</span>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="h-1 w-24 bg-white/30 rounded-full mb-4"></div>
            <p className="text-sm text-on-primary/80 font-medium">Medical Intelligence, Elevated.</p>
          </div>
        </section>

        {/* Right Panel: Login Form */}
        <main className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-surface">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile branding */}
            <div className="md:hidden flex flex-col items-center mb-8">
              <span className="material-symbols-outlined text-5xl text-primary mb-2">local_hospital</span>
              <h2 className="text-2xl font-headline font-bold italic text-on-surface">MediRoute</h2>
            </div>

            {/* Form Card */}
            <div className="bg-surface-container-highest/40 backdrop-blur-2xl p-8 md:p-10 rounded-2xl editorial-shadow border border-outline-variant/15">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-4xl font-headline text-on-surface mb-2">Welcome Back</h2>
                <div className="h-0.5 w-12 bg-primary mb-4 hidden md:block" />
                <p className="text-on-surface-variant text-sm">Sign in to your MediRoute account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selector Tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-surface-container-low rounded-lg mb-8">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
                        role === r
                          ? 'bg-primary text-on-primary-container shadow-lg'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold px-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                      mail
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dr.smith@mediroute.com"
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold" htmlFor="password">
                      Password
                    </label>
                    <a className="text-[11px] uppercase tracking-widest text-primary font-bold hover:underline" href="#">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                      lock
                    </span>
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">{showPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                  </div>
                )}

                {/* Sign In */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-on-primary-container bg-gradient-to-r from-primary to-secondary-dim shadow-xl shadow-primary/10 hover:shadow-primary/20 transform transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div className="mt-8 flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-outline-variant/30" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold">or</span>
                <div className="h-[1px] flex-1 bg-outline-variant/30" />
              </div>

              <div className="mt-8 text-center">
                <p className="text-on-surface-variant text-sm">
                  Don't have an account?
                  <Link to="/register" className="text-primary font-bold hover:underline ml-1 transition-colors">
                    Register
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <footer className="pt-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">
                © 2025 MediRoute. All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

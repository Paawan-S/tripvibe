import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Clock, Compass, Navigation, Sparkles, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: Sparkles, text: 'AI-powered planning' },
  { icon: Navigation, text: 'Smart route grouping' },
  { icon: Wallet, text: 'Costs in ₹ per day' },
  { icon: Clock, text: 'Relaxed to fast pace' },
]

export default function Login() {
  const { session, signIn, signUp } = useAuth()

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  // Already logged in? Skip this page.
  if (session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const { data, error } = await signUp(email, password, name)
        if (error) throw error
        if (!data.session) {
          setInfo('Account created. Check your email to confirm it, then log in.')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="auth-page">
      <section className="auth-brand">
        <div className="brand">
          <span className="brand-mark">
            <Compass size={20} />
          </span>
          TripVibe
        </div>

        <span className="pill">
          <Sparkles size={14} /> AI trip planner
        </span>

        <h1>
          Plan your next <span className="hero-accent">adventure</span> in seconds.
        </h1>
        <p className="auth-lead">
          Pick a vibe, set a budget and your dates. Get a day-by-day plan with places grouped by
          area, travel times and costs in ₹.
        </p>

        <ul className="auth-features">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={18} /> {text}
            </li>
          ))}
        </ul>

        <div className="auth-sample" aria-hidden="true">
          <div className="sample-head">
            <span>Day 1</span>
            <span className="sample-tag">Example</span>
          </div>
          <div className="sample-row">
            <strong>09:00</strong>
            <span>Morning walk through the old town</span>
          </div>
          <div className="sample-row">
            <strong>13:00</strong>
            <span>Local lunch near the market</span>
          </div>
          <div className="sample-row">
            <strong>17:30</strong>
            <span>Sunset at a scenic viewpoint</span>
          </div>
        </div>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="muted" style={{ marginBottom: 22 }}>
            {isLogin ? 'Log in to see your trips.' : 'Sign up to start planning.'}
          </p>

          {error && <div className="error-box">{error}</div>}
          {info && <div className="info-box">{info}</div>}

          {!isLogin && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}
          </button>

          <p className="auth-switch muted">
            {isLogin ? 'New here? ' : 'Already have an account? '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode(isLogin ? 'signup' : 'login')
                setError('')
                setInfo('')
              }}
            >
              {isLogin ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}
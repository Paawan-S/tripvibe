import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <Compass size={26} /> TripVibe
        </div>
        <p className="muted" style={{ textAlign: 'center', marginBottom: 20 }}>
          {isLogin ? 'Welcome back. Log in to your trips.' : 'Create an account to start planning.'}
        </p>

        {error && <div className="error-box">{error}</div>}
        {info && <div className="info-box">{info}</div>}

        {!isLogin && (
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
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
    </div>
  )
}
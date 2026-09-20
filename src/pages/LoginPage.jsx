import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6'
import { authApi } from '../lib/api.js'
import './PortalPages.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => {
    authApi.session().then(data => setSession(data.user)).catch(() => setSession(null))
  }, [])

  async function submit(event) {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Signing you in...' })
    try {
      const data = await authApi.login(email, password)
      setSession(data.user)
      navigate('/dashboard', { replace: true, state: { toast: 'Login successful. Welcome back.' } })
    } catch (error) { setStatus({ state: 'error', message: error.message }) }
  }

  async function resetPassword() {
    if (!email) return setStatus({ state: 'error', message: 'Enter your email address first.' })
    setStatus({ state: 'loading', message: 'Sending reset instructions...' })
    try { await authApi.reset(email); setStatus({ state: 'success', message: 'Password reset instructions were sent.' }) } catch (error) { setStatus({ state: 'error', message: error.message }) }
  }

  return <main className="portal-page auth-page">
    <div className="auth-shell">
      <Link to="/" className="portal-brand auth-brand"><img src="/brand/lions-ent-white.png" alt="Lions Entertainment" /></Link>
      {session ? <Navigate to="/dashboard" replace state={{ toast: 'You are already signed in.' }} /> : <section className="auth-card">
        <p className="portal-eyebrow">Lions Entertainment Portal</p>
        <h1>Welcome back</h1>
        <p>Sign in securely to your Lions Entertainment account.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></label>
          <label>Password<input required type="password" minLength="8" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label>
          {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
          <button className="portal-button primary auth-submit" disabled={status.state === 'loading'}>{status.state === 'loading' ? 'Please wait...' : 'Log in'} <FaArrowRight aria-hidden="true" /></button>
        </form>
        <div className="auth-options"><button type="button" onClick={resetPassword}>Forgot password?</button></div>
      </section>}
      <Link className="auth-back" to="/"><FaArrowLeft aria-hidden="true" /> Main website</Link>
    </div>
  </main>
}

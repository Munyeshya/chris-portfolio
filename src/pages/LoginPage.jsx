import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa6'
import { authConfigured, supabase } from '../lib/supabase.js'
import './PortalPages.css'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => {
    if (!supabase) return undefined
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  async function submit(event) {
    event.preventDefault()
    if (!supabase) return setStatus({ state: 'error', message: 'Authentication is not configured yet.' })
    setStatus({ state: 'loading', message: mode === 'register' ? 'Creating your account...' : 'Signing you in...' })
    const action = mode === 'register'
      ? supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/login` } })
      : supabase.auth.signInWithPassword({ email, password })
    const { data, error } = await action
    if (error) return setStatus({ state: 'error', message: error.message })
    if (mode === 'register' && !data.session) return setStatus({ state: 'success', message: 'Account created. Check your email and confirm it before signing in.' })
    setStatus({ state: 'success', message: 'Login successful.' })
  }

  async function resetPassword() {
    if (!email) return setStatus({ state: 'error', message: 'Enter your email address first.' })
    if (!supabase) return setStatus({ state: 'error', message: 'Authentication is not configured yet.' })
    setStatus({ state: 'loading', message: 'Sending reset instructions...' })
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
    setStatus(error ? { state: 'error', message: error.message } : { state: 'success', message: 'Password reset instructions were sent to your email.' })
  }

  async function signOut() {
    setStatus({ state: 'loading', message: 'Signing out...' })
    const { error } = await supabase.auth.signOut()
    setStatus(error ? { state: 'error', message: error.message } : { state: 'idle', message: '' })
  }

  return <main className="portal-page auth-page">
    <div className="auth-shell">
      <Link to="/" className="portal-brand auth-brand"><img src="/brand/lions-ent-white.png" alt="Lions Entertainment" /></Link>
      {session ? <section className="auth-card auth-success">
        <span className="auth-success-icon"><FaCheck aria-hidden="true" /></span>
        <p className="portal-eyebrow">Authenticated</p>
        <h1>Login successful.</h1>
        <p>You are signed in as <strong>{session.user.email}</strong>. Your management dashboard will be added in the next phase.</p>
        <div className="portal-actions"><Link className="portal-button primary" to="/booking">Go to booking <FaArrowRight aria-hidden="true" /></Link><button className="portal-button" type="button" onClick={signOut}>Sign out</button></div>
      </section> : <section className="auth-card">
        <p className="portal-eyebrow">Lions Entertainment Portal</p>
        <h1>{mode === 'register' ? 'Create account' : 'Welcome back'}</h1>
        <p>{mode === 'register' ? 'Create your portal account. You may need to confirm your email.' : 'Sign in securely to your Lions Entertainment account.'}</p>
        {!authConfigured && <p className="form-status error">Add the public Supabase URL and publishable key to your environment before logging in.</p>}
        <form className="auth-form" onSubmit={submit}>
          <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></label>
          <label>Password<input required type="password" minLength="8" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>
          {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
          <button className="portal-button primary auth-submit" disabled={status.state === 'loading'}>{status.state === 'loading' ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Log in'} <FaArrowRight aria-hidden="true" /></button>
        </form>
        <div className="auth-options"><button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setStatus({ state: 'idle', message: '' }) }}>{mode === 'login' ? 'Create an account' : 'Already have an account?'}</button>{mode === 'login' && <button type="button" onClick={resetPassword}>Forgot password?</button>}</div>
      </section>}
      <Link className="auth-back" to="/"><FaArrowLeft aria-hidden="true" /> Main website</Link>
    </div>
  </main>
}

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6'
import { authApi } from '../lib/api.js'
import './PortalPages.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirmation,setConfirmation]=useState('')
  const [status,setStatus]=useState({state:'idle',message:''})

  async function requestReset(event){
    event.preventDefault();setStatus({state:'loading',message:'Sending reset instructions…'})
    try{const data=await authApi.forgotPassword(email);setStatus({state:'success',message:data.message})}catch(error){setStatus({state:'error',message:error.message})}
  }
  async function resetPassword(event){
    event.preventDefault()
    if(password!==confirmation)return setStatus({state:'error',message:'The passwords do not match.'})
    setStatus({state:'loading',message:'Resetting your password…'})
    try{const data=await authApi.resetPassword(token,password);setStatus({state:'success',message:data.message});setPassword('');setConfirmation('')}catch(error){setStatus({state:'error',message:error.message})}
  }

  return <main className="portal-page auth-page"><div className="auth-shell">
    <Link to="/" className="portal-brand auth-brand"><img src="/brand/lions-plus-white.png" alt="Lions Plus" /></Link>
    <section className="auth-card">
      <p className="portal-eyebrow">Account recovery</p>
      <h1>{token?'Choose a new password':'Reset password'}</h1>
      <p>{token?'Enter a secure new password for your administrator account.':'Enter your administrator email and we will send you a secure reset link.'}</p>
      {token?<form className="auth-form" onSubmit={resetPassword}>
        <label>New password<input required type="password" minLength="10" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password" /></label>
        <label>Confirm new password<input required type="password" minLength="10" value={confirmation} onChange={event=>setConfirmation(event.target.value)} autoComplete="new-password" /></label>
        {status.message&&<p className={`form-status ${status.state}`} role="status">{status.message}</p>}
        {status.state==='success'?<Link className="portal-button primary auth-submit" to="/login">Continue to login <FaArrowRight /></Link>:<button className="portal-button primary auth-submit" disabled={status.state==='loading'}>{status.state==='loading'?'Please wait…':'Reset password'} <FaArrowRight /></button>}
      </form>:<form className="auth-form" onSubmit={requestReset}>
        <label>Email address<input required type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" /></label>
        {status.message&&<p className={`form-status ${status.state}`} role="status">{status.message}</p>}
        <button className="portal-button primary auth-submit" disabled={status.state==='loading'}>{status.state==='loading'?'Please wait…':'Send reset link'} <FaArrowRight /></button>
      </form>}
    </section>
    <Link className="auth-back" to="/login"><FaArrowLeft /> Back to login</Link>
  </div></main>
}

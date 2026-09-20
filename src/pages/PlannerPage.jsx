import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { FaArrowLeft, FaArrowRightFromBracket } from 'react-icons/fa6'
import { api, authApi } from '../lib/api.js'
import { OrganizerApplication, OrganizerWorkspace } from './TicketingPage.jsx'
import './PortalPages.css'

export default function PlannerPage() {
  const [user, setUser] = useState(undefined)
  const [organizer, setOrganizer] = useState(undefined)
  const [events, setEvents] = useState([])
  const [notice, setNotice] = useState('')

  const loadOrganizer = () => api('/ticketing/organizer').then(data => setOrganizer(data.organizer))
  const loadEvents = () => api('/ticketing/organizer/events').then(data => setEvents(data.events))

  useEffect(() => {
    authApi.session().then(({ user: sessionUser }) => {
      setUser(sessionUser)
      if (!sessionUser) return
      loadOrganizer().catch(error => setNotice(error.message))
    }).catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (organizer?.status === 'approved') loadEvents().catch(error => setNotice(error.message))
  }, [organizer])

  async function signOut() {
    await authApi.logout()
    setUser(null)
  }

  if (user === undefined || (user && organizer === undefined)) return <main className="portal-page planner-loading">Opening planner portal…</main>
  if (!user) return <Navigate to="/login" replace state={{ destination: '/planner' }} />
  if (user.role === 'admin') return <Navigate to="/dashboard" replace />

  return <div className="portal-page planner-page">
    <header className="portal-header planner-header">
      <Link to="/" className="portal-brand"><img src="/brand/lions-plus-white.png" alt="Lions Plus" /></Link>
      <nav><Link to="/ticketing">Public events</Link><button className="portal-login planner-signout" onClick={signOut}>Sign out <FaArrowRightFromBracket /></button></nav>
    </header>
    {notice && <div className="booking-toast error"><span>{notice}</span><button onClick={() => setNotice('')}>×</button></div>}
    <main className="portal-shell planner-main">
      <div className="portal-heading">
        <p className="portal-eyebrow">Event planner portal</p>
        <h1>{organizer?.status === 'approved' ? 'Manage your events' : 'Planner access'}</h1>
        <p>Only your organization’s events, registrations and entrance records are available here.</p>
      </div>
      {!organizer ? <OrganizerApplication onDone={loadOrganizer} setNotice={setNotice} /> : organizer.status !== 'approved' ? <div className="organizer-status"><strong>Application {organizer.status}</strong><p>{organizer.status === 'pending' ? 'The Lions Plus administrator is reviewing your request.' : 'Your planner access is not active. Contact the administrator for assistance.'}</p></div> : <OrganizerWorkspace events={events} reload={loadEvents} setNotice={setNotice} />}
    </main>
    <footer className="portal-footer portal-shell"><span>© 2026 Lions Plus Planner Portal</span><Link to="/ticketing"><FaArrowLeft /> Public events</Link></footer>
  </div>
}

import { Link } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa6'
import './PortalPages.css'

export default function TicketingPage() {
  return <main className="portal-page ticketing-coming-soon"><div className="coming-soon-content"><img src="/brand/lions-ent-white.png" alt="Lions Entertainment" /><p className="portal-eyebrow">Event Ticketing</p><h1>Coming Soon</h1><p>Event registration, ticket sales, seating and entrance management will be developed after the Booking platform.</p><Link className="portal-button" to="/"><FaArrowLeft aria-hidden="true" /> Return to the website</Link></div></main>
}

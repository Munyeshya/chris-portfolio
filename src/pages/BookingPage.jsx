import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaArrowRight, FaCheck, FaUpload } from 'react-icons/fa6'
import './PortalPages.css'

const serviceOptions = ['Photography', 'Videography', 'Livestreaming', 'AV Production', 'LED Screens', 'Event Production', 'Graphics & Printing', 'Audio Production', 'Websites', 'Software Development']
const workflow = ['Submit a request', 'Scope and availability review', 'Quotation and revisions', 'Contract and deposit', 'Booking confirmation', 'Production and editing', 'Client review and revisions', 'Final delivery and closure']

const initialForm = { clientName: '', phone: '', email: '', company: '', projectName: '', projectType: 'event', services: [], brief: '', eventDate: '', startTime: '', endTime: '', location: '', deadline: '', packageChoice: '', customRequirements: '', budget: '', notes: '' }

export default function BookingPage() {
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const toggleService = service => setForm(current => ({ ...current, services: current.services.includes(service) ? current.services.filter(item => item !== service) : [...current.services, service] }))

  async function submitRequest(event) {
    event.preventDefault()
    setStatus({ state: 'loading', message: 'Sending your request...' })
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, Array.isArray(value) ? JSON.stringify(value) : value))
    files.forEach(file => body.append('references', file))
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/bookings`, { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The request could not be submitted.')
      setStatus({ state: 'success', message: `Request ${result.reference} received. It is not yet a confirmed booking; our team will review it and send a quotation.` })
      setForm(initialForm)
      setFiles([])
      event.currentTarget.reset()
    } catch (error) {
      setStatus({ state: 'error', message: error.message === 'Failed to fetch' ? 'Online booking is still being connected. Please try again when the platform is launched.' : error.message })
    }
  }

  return <div className="portal-page">
    <header className="portal-header"><Link to="/" className="portal-brand"><img src="/brand/lions-ent-white.png" alt="Lions Entertainment" /></Link><nav aria-label="Booking navigation"><a href="#services">Services</a><a href="#process">Process</a><a href="#request">Request booking</a><Link to="/ticketing">Ticketing</Link></nav></header>

    <main>
      <section className="booking-hero portal-shell"><p className="portal-eyebrow">Lions Entertainment Booking</p><h1>From request to <span>final delivery.</span></h1><p>Request creative production and technology services, receive a quotation, confirm your booking and follow the project through completion.</p><div className="portal-actions"><a className="portal-button primary" href="#request">Start a booking <FaArrowRight aria-hidden="true" /></a><a className="portal-button" href="#process">See how it works</a></div><p className="booking-rule">Submitting a request does not confirm a booking. Confirmation follows scope, resource, quotation, contract and deposit review.</p></section>

      <section className="portal-section portal-shell" id="services"><div className="portal-heading"><p className="portal-eyebrow">Services covered</p><h2>What you can request</h2></div><div className="service-options">{serviceOptions.map(service => <div key={service}><FaCheck aria-hidden="true" /><span>{service}</span></div>)}</div></section>

      <section className="portal-section process-section" id="process"><div className="portal-shell"><div className="portal-heading"><p className="portal-eyebrow">Booking workflow</p><h2>How your booking will work</h2></div><ol className="booking-steps">{workflow.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol></div></section>

      <section className="portal-section portal-shell" id="request"><div className="portal-heading"><p className="portal-eyebrow">New booking</p><h2>Tell us about your project</h2><p>Provide the information below. Lions Entertainment will review the scope, crew and equipment availability before issuing a quotation.</p></div>
        <form className="booking-form" onSubmit={submitRequest}>
          <fieldset><legend>Client details</legend><div className="form-grid"><label>Full name<input required name="clientName" value={form.clientName} onChange={update} autoComplete="name" /></label><label>Phone<input required name="phone" value={form.phone} onChange={update} autoComplete="tel" /></label><label>Email<input required type="email" name="email" value={form.email} onChange={update} autoComplete="email" /></label><label>Company <small>Optional</small><input name="company" value={form.company} onChange={update} autoComplete="organization" /></label></div></fieldset>
          <fieldset><legend>Project requirements</legend><div className="form-grid"><label>Project name<input required name="projectName" value={form.projectName} onChange={update} /></label><label>Project type<select name="projectType" value={form.projectType} onChange={update}><option value="event">Event-based project</option><option value="non-event">Non-event project</option></select></label></div><span className="field-label">Requested services</span><div className="service-checks">{serviceOptions.map(service => <label key={service}><input type="checkbox" checked={form.services.includes(service)} onChange={() => toggleService(service)} /><span>{service}</span></label>)}</div><label>Project brief<textarea required name="brief" rows="5" value={form.brief} onChange={update} /></label></fieldset>
          <fieldset><legend>{form.projectType === 'event' ? 'Event schedule' : 'Delivery schedule'}</legend>{form.projectType === 'event' ? <div className="form-grid"><label>Event date<input required type="date" name="eventDate" value={form.eventDate} onChange={update} /></label><label>Location<input required name="location" value={form.location} onChange={update} /></label><label>Start time<input required type="time" name="startTime" value={form.startTime} onChange={update} /></label><label>End time<input required type="time" name="endTime" value={form.endTime} onChange={update} /></label></div> : <label>Required delivery deadline<input required type="date" name="deadline" value={form.deadline} onChange={update} /></label>}</fieldset>
          <fieldset><legend>Package and references</legend><div className="form-grid"><label>Package or option<input name="packageChoice" value={form.packageChoice} onChange={update} placeholder="Package name, custom, or undecided" /></label><label>Estimated budget <small>Optional</small><input name="budget" value={form.budget} onChange={update} placeholder="Currency and amount" /></label></div><label>Custom requirements<textarea name="customRequirements" rows="4" value={form.customRequirements} onChange={update} /></label><label className="file-input"><FaUpload aria-hidden="true" /><span>Reference files <small>Optional, up to 5 files</small></span><input type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx" onChange={event => setFiles([...event.target.files].slice(0, 5))} /></label>{files.length > 0 && <p className="file-list">{files.map(file => file.name).join(', ')}</p>}<label>Additional notes<textarea name="notes" rows="4" value={form.notes} onChange={update} /></label></fieldset>
          {status.message && <p className={`form-status ${status.state}`} role="status">{status.message}</p>}
          <button className="portal-button primary submit" disabled={status.state === 'loading'}>{status.state === 'loading' ? 'Sending...' : 'Submit booking request'} <FaArrowRight aria-hidden="true" /></button>
        </form>
      </section>
    </main>
    <footer className="portal-footer portal-shell"><span>© 2026 Lions Entertainment</span><Link to="/"><FaArrowLeft aria-hidden="true" /> Main website</Link></footer>
  </div>
}

import { useEffect, useRef, useState } from 'react'
import { company, services, eventSolutions, clients, team } from './content'
import './App.css'
import Portfolio from './Portfolio'

function Brand({ dark = false }) {
  return (
    <a href="#home" className="brand" aria-label="Lions ENT — home">
      <span className="logo-crop">
        <img src={`/brand/lions-ent-${dark ? 'black' : 'white'}.png`} alt="Lions ENT" width="5404" height="3414" />
      </span>
    </a>
  )
}

function Pattern({ className = '' }) {
  return <div className={`pattern ${className}`} aria-hidden="true"><i /><i /><i /><i /></div>
}

function Icon({ type }) {
  return <span className={`service-icon icon-${type}`} aria-hidden="true"><i /><b /><em /></span>
}

function SectionLabel({ number, children, light = false }) {
  return <p className={`eyebrow${light ? ' on-red' : ''}`}><span>{number}</span>{children}</p>
}

function PortalLink({ className = '', onUnavailable }) {
  return company.portalUrl
    ? <a className={className} href={company.portalUrl} target="_blank" rel="noreferrer">Portal <span aria-hidden="true">↗</span></a>
    : <button className={className} type="button" onClick={onUnavailable}>Portal <span aria-hidden="true">↗</span></button>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [dialogContent, setDialogContent] = useState(null)
  const dialogRef = useRef(null)
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id)
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 })
    document.querySelectorAll('main > section[id]').forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = event => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButtonRef.current?.focus() }
    }
    const closeOutside = event => {
      if (!menuRef.current?.contains(event.target) && !menuButtonRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOutside)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOutside)
    }
  }, [menuOpen])

  useEffect(() => {
    if (dialogContent) dialogRef.current?.showModal()
  }, [dialogContent])

  function showPortalNotice() {
    setMenuOpen(false)
    setDialogContent({ title: 'Registration & Booking Portal', text: 'The portal is a separate registration and booking platform. Its link will be added here once confirmed.' })
  }

  const navLinks = [['about', 'About Us'], ['services', 'Services'], ['portfolio', 'Portfolio'], ['contact', 'Contact Us']]
  const footerLinks = [['about', 'About Us'], ['services', 'Services'], ['event-solutions', 'Event Solutions'], ['portfolio', 'Portfolio'], ['team', 'Our Team'], ['contact', 'Contact Us']]
  const contactHref = company.email ? `mailto:${company.email}` : company.phone ? `tel:${company.phone.replace(/[^+\d]/g, '')}` : company.socials.Instagram

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="header" data-section="01-header">
        <div className="nav-wrap">
          <Brand />
          <button ref={menuButtonRef} className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close ×' : 'Menu ☰'}</button>
          <nav ref={menuRef} id="navigation" className={`navigation${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
            {navLinks.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
            <PortalLink className="nav-cta" onUnavailable={showPortalNotice} />
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero" id="home" data-section="02-hero" aria-labelledby="hero-title">
          <img className="hero-photo" src="/portfolio/55487392634.jpg" alt="Drummers performing at Kigali Twataramye 3rd edition" fetchPriority="high" />
          <div className="hero-shade" />
          <div className="hero-content section-shell">
            <p className="eyebrow hero-kicker"><span className="red-dash" /> LIONS ENT</p>
            <h1 id="hero-title">We Are a <span>Creative Production</span> and Technology Partner.</h1>
            <div className="hero-copy">
              <p>Lions ENT combines professional AV production, creative media, and digital technology to help businesses, organizations, and events communicate, connect, and create memorable experiences.</p>
              <p>From photography, videography, livestreaming, LED displays, and audiovisual production to web design and web application development, we deliver integrated solutions from concept to execution.</p>
            </div>
            <div className="hero-actions"><a className="button red" href="#services">Explore Our Services <span aria-hidden="true">↗</span></a><a className="button outline" href="#portfolio">View Portfolio <span aria-hidden="true">↗</span></a></div>
          </div>
          <div className="hero-art" aria-hidden="true"><i /><i /><i /><span>✳</span></div>
          <div className="hero-bottom section-shell"><a href="#about">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a><span>PRODUCTION / MEDIA / EVENTS / TECHNOLOGY</span></div>
          <a className="image-credit" href="https://www.flickr.com/photos/196950681@N03/albums/72177720335314989" target="_blank" rel="noreferrer">Kigali Twataramye 3rd edition · View album ↗</a>
        </section>

        <section className="about section-shell" id="about" data-section="03-about" aria-labelledby="about-title">
          <div className="about-heading"><SectionLabel number="03">WHO WE ARE</SectionLabel><h2 id="about-title">About <span>Us</span></h2><div className="experience"><strong>5<span>+</span></strong><span>YEARS OF<br />EXPERIENCE</span></div></div>
          <div className="about-copy"><p>Lions ENT is a creative production and technology company with over 5 years of experience delivering professional AV production, media, event, and digital solutions.</p><p>We combine creativity and technology to provide photography, videography, livestreaming, LED displays, web design, and web application development for businesses, organizations, and events.</p><div className="about-signature"><Brand dark /><span>CREATIVITY.<br />MEET TECHNOLOGY.</span></div></div>
          <Pattern className="about-pattern" />
        </section>

        <section className="services section-shell" id="services" data-section="04-services" aria-labelledby="services-title">
          <div className="section-heading"><div><SectionLabel number="04">WHAT WE DO</SectionLabel><h2 id="services-title">Our <span>Services</span></h2></div><span className="section-motif" aria-hidden="true">✳</span></div>
          <div className="service-grid">{services.map((service, index) => <article className="service-card" key={service.id} id={service.id}><div className="service-top"><span>0{index + 1}</span><Icon type={service.icon} /></div><h3>{service.title}</h3><p>{service.description}</p><span className="card-rule" aria-hidden="true" /></article>)}</div>
        </section>

        <section className="events section-shell" id="event-solutions" data-section="05-event-solutions" aria-labelledby="events-title">
          <div className="events-heading"><SectionLabel number="05" light>EVENT SOLUTIONS</SectionLabel><h2 id="events-title">Event Planning &amp;<br />Management Solutions</h2><h3>From Planning to Execution, We Help You Manage It All.</h3></div>
          <div className="events-content"><p>Lions ENT supports clients with both event planning and event management solutions, helping organize smooth, professional, and well-coordinated events from preparation to event day.</p><ul className="event-list">{eventSolutions.map((item, index) => <li key={item}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ul><p className="events-closing">Whether it is a conference, corporate event, exhibition, launch, or private event, we help manage the details so the entire event runs smoothly.</p></div>
          <Pattern className="events-pattern" />
        </section>

        <section className="work section-shell" id="portfolio" data-section="06-work" aria-labelledby="work-title">
          <div className="section-heading"><div><SectionLabel number="06">PORTFOLIO</SectionLabel><h2 id="work-title">Our <span>Work</span></h2></div><p>A selection of projects delivered across audiovisual production, photography, videography, livestreaming, events, and digital solutions.</p></div>
          <Portfolio />
        </section>

        <section className="clients section-shell" id="clients" data-section="07-clients" aria-labelledby="clients-title">
          <div className="clients-heading"><SectionLabel number="07">Clients &amp; Partners</SectionLabel><h2 id="clients-title">Trusted <span>By</span></h2><p>We are proud to have worked with businesses, organizations, institutions, and brands across different projects.</p></div>
          <div className="client-grid">{clients.map((client, index) => <div className="client-cell" key={client.name || index}>{client.logo ? <img src={client.logo} alt={client.name} loading="lazy" /> : <span className="client-placeholder">CLIENT / PARTNER<br /><strong>LOGO</strong></span>}</div>)}</div>
        </section>

        <section className="team section-shell" id="team" data-section="08-team" aria-labelledby="team-title">
          <div className="team-heading"><SectionLabel number="08">THE PEOPLE BEHIND THE WORK</SectionLabel><h2 id="team-title">Our <span>Team</span></h2><h3>Meet the creative and technical team behind Lions ENT.</h3><p>Our team brings together experience in audiovisual production, photography, videography, livestreaming, event production, design, and technology to deliver reliable solutions from concept to execution.</p></div>
          <div className="team-grid">{team.map((member, index) => <article className="team-card" key={member.name || index}><div className="team-photo">{member.photo ? <img src={member.photo} alt={member.name} loading="lazy" /> : <><span className="portrait-placeholder" aria-hidden="true"><i /><b /></span><span className="photo-label">PHOTO</span></>}</div><h3>{member.name || 'Name'}</h3><p>{member.role || 'Role'}</p></article>)}</div>
        </section>

        <section className="contact section-shell" id="contact" data-section="09-contact" aria-labelledby="contact-title">
          <div className="contact-heading"><SectionLabel number="09" light>Contact Us</SectionLabel><h2 id="contact-title">Let's Work<br /><span>Together.</span></h2><p>Planning an event, production, or digital project? Talk to Lions ENT and let's turn your idea into a professional solution.</p></div>
          <div className="contact-content">
            <dl className="contact-details">
              {company.phone && <div><dt>Phone / WhatsApp</dt><dd><a href={`tel:${company.phone.replace(/[^+\d]/g, '')}`}>{company.phone}</a>{company.whatsapp && <a className="whatsapp-link" href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp ↗</a>}</dd></div>}
              {company.email && <div><dt>Email</dt><dd><a href={`mailto:${company.email}`}>{company.email}</a></dd></div>}
              <div><dt>Instagram</dt><dd><a href={company.socials.Instagram} target="_blank" rel="noreferrer">@lions_ent_ ↗</a></dd></div>
              <div><dt>YouTube</dt><dd><a href={company.socials.YouTube} target="_blank" rel="noreferrer">@golive-r9e ↗</a></dd></div>
              <div><dt>Location</dt><dd>{company.location}</dd></div>
            </dl>
            <a className="button light" href={contactHref} target={contactHref.startsWith('https:') ? '_blank' : undefined} rel={contactHref.startsWith('https:') ? 'noreferrer' : undefined}>Get in Touch <span aria-hidden="true">↗</span></a>
            {!company.email && !company.phone && <p className="contact-note">Message us on Instagram to discuss your project.</p>}
          </div>
          <Pattern className="contact-pattern" />
        </section>
      </main>

      <footer className="footer section-shell" data-section="10-footer">
        <div className="footer-intro"><Brand /><div><p className="footer-tagline">Creative Production and Technology Partner.</p><p>Professional AV production, media, event management, and digital solutions for businesses, organizations, and events.</p></div></div>
        <div className="footer-columns"><div><h2>Quick Links</h2><ul>{footerLinks.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}<li><PortalLink className="footer-portal" onUnavailable={showPortalNotice} /></li></ul></div><div><h2>Services</h2><ul>{services.slice(0, 3).map(service => <li key={service.id}><a href={`#${service.id}`}>{service.title}</a></li>)}<li><a href="#event-solutions">Event Planning &amp; Management</a></li><li><a href="#creative-digital">Creative &amp; Digital Solutions</a></li></ul></div><div><h2>Contact</h2><ul><li>{company.location}</li><li><a href={company.socials.Instagram} target="_blank" rel="noreferrer">Message us on Instagram ↗</a></li>{company.email && <li><a href={`mailto:${company.email}`}>{company.email}</a></li>}</ul></div><div><h2>Follow Us</h2><ul>{Object.entries(company.socials).map(([label, url]) => <li key={label}>{url ? <a href={url} target="_blank" rel="noreferrer">{label} ↗</a> : <span className="social-pending">{label}<small>Link pending</small></span>}</li>)}</ul></div></div>
        <div className="footer-bottom"><p>© 2026 Lions ENT. All Rights Reserved.</p><a href="#home">BACK TO TOP <span aria-hidden="true">↑</span></a></div>
      </footer>

      <dialog ref={dialogRef} className="information-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description" onClose={() => setDialogContent(null)} onClick={event => {
        if (event.target === dialogRef.current) {
          const bounds = dialogRef.current.getBoundingClientRect()
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialogRef.current.close()
        }
      }}><button className="dialog-close" type="button" aria-label="Close dialog" onClick={() => dialogRef.current?.close()}>×</button><p className="eyebrow">LIONS ENT</p><h2 id="dialog-title">{dialogContent?.title}</h2><p id="dialog-description">{dialogContent?.text}</p><button className="button red" type="button" onClick={() => dialogRef.current?.close()}>Close</button></dialog>
    </>
  )
}

export default App


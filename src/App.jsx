import { useEffect, useRef, useState } from 'react'
import { company, services, eventSolutions, clients, team } from './content'
import './App.css'
import Portfolio from './Portfolio'
import { FaInstagram, FaYoutube, FaWhatsapp, FaArrowUpRightFromSquare, FaArrowDown, FaArrowUp, FaBars, FaXmark, FaAsterisk } from 'react-icons/fa6'
import { useScrollHeader, useSectionReveals } from './usePageMotion'

function Brand({ dark = false }) {
  return (
    <a href="#home" className="brand" aria-label="Lions ENT — home">
      <span className="logo-crop">
        <img src={`/brand/lions-ent-${dark ? 'black' : 'white'}.png`} alt="Lions ENT" width="5404" height="3414" />
      </span>
    </a>
  )
}

function Icon({ type }) {
  return <span className={`service-icon icon-${type}`} aria-hidden="true"><i /><b /><em /></span>
}

function SectionLabel({ children, light = false }) {
  return <p className={`eyebrow${light ? ' on-red' : ''}`}>{children}</p>
}

function WavyBackdrop({ id }) {
  return (
    <div className="wave-backdrop" aria-hidden="true">
      <svg viewBox="0 0 1600 620" preserveAspectRatio="none">
        <defs><linearGradient id={id} x1="0" x2="1"><stop stopColor="#c41b1b" stopOpacity="0" /><stop offset=".22" stopColor="#e94a4a" stopOpacity=".75" /><stop offset=".72" stopColor="#fff" stopOpacity=".28" /><stop offset="1" stopColor="#c41b1b" stopOpacity="0" /></linearGradient></defs>
        {Array.from({ length: 13 }, (_, index) => <path key={index} style={{ stroke: `url(#${id})` }} d="M-120 300 C120 70 350 70 565 300 S1010 530 1235 300 S1580 70 1720 260" transform={`translate(0 ${index * 42 - 252})`} />)}
      </svg>
    </div>
  )
}

function PartnerSlider({ items }) {
  return <div className="client-slider"><div className="client-grid"><div className="client-track">{[0, 1].map(copy => <div className="client-set" key={copy} aria-hidden={copy === 1}>{items.map(client => <div className={`client-cell${client.knockout ? ' knockout-logo' : ''}`} key={`${copy}-${client.name}`}><img src={client.logo} alt={copy === 0 ? client.name : ''} loading="lazy" /></div>)}</div>)}</div></div></div>
}

function PortalLink({ className = '', onUnavailable }) {
  return company.portalUrl
    ? <a className={className} href={company.portalUrl} target="_blank" rel="noreferrer">Portal <FaArrowUpRightFromSquare aria-hidden="true" className="ui-icon" /></a>
    : <button className={className} type="button" onClick={onUnavailable}>Portal <FaArrowUpRightFromSquare aria-hidden="true" className="ui-icon" /></button>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [dialogContent, setDialogContent] = useState(null)
  const dialogRef = useRef(null)
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const headerRef = useRef(null)
  const headerHidden = useScrollHeader(headerRef, menuOpen)
  useSectionReveals()

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
  const contactHref = company.whatsapp ? `https://wa.me/${company.whatsapp}` : company.email ? `mailto:${company.email}` : company.phone ? `tel:${company.phone.replace(/[^+\d]/g, '')}` : company.socials.Instagram

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header ref={headerRef} className={`header${headerHidden ? ' header-hidden' : ''}`} data-section="01-header">
        <div className="nav-wrap">
          <Brand />
          <button ref={menuButtonRef} className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="navigation" onClick={() => setMenuOpen(!menuOpen)}><span>{menuOpen ? 'Close' : 'Menu'}</span>{menuOpen ? <FaXmark aria-hidden="true" /> : <FaBars aria-hidden="true" />}</button>
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
            <p className="eyebrow hero-kicker"><span className="red-dash" /><span className="hero-kicker-label">LIONS ENT<span className="red-dot" /></span></p>
            <h1 id="hero-title">We Are a <br className="hero-mobile-break" /><span>Creative Production</span><br />and Technology Partner.</h1>
            <div className="hero-copy">
              <p>Lions ENT combines professional AV production, creative media, and digital technology to help businesses, organizations, and events communicate, connect, and create memorable experiences.</p>
              <p>From photography, videography, livestreaming, LED displays, and audiovisual production to web design and web application development, we deliver integrated solutions from concept to execution.</p>
            </div>
            <div className="hero-actions"><a className="button red" href="#services">Explore Our Services <FaArrowUpRightFromSquare aria-hidden="true" className="ui-icon" /></a><a className="button outline" href="#portfolio">View Portfolio <FaArrowUpRightFromSquare aria-hidden="true" className="ui-icon" /></a></div>
          </div>
          <div className="hero-art" aria-hidden="true"><i /><i /><i /><FaAsterisk aria-hidden="true" className="hero-asterisk" /></div>
          <div className="hero-bottom section-shell"><a href="#about">SCROLL TO EXPLORE <FaArrowDown aria-hidden="true" className="ui-icon" /></a><span>PRODUCTION / MEDIA / EVENTS / TECHNOLOGY</span></div>
          <a className="image-credit" href="https://www.flickr.com/photos/196950681@N03/albums/72177720335314989" target="_blank" rel="noreferrer">Kigali Twataramye 3rd edition · View album <FaArrowUpRightFromSquare aria-hidden="true" /></a>
        </section>

        <section className="about section-shell" id="about" data-section="03-about" aria-labelledby="about-title">
          <div className="about-heading"><SectionLabel>WHO WE ARE</SectionLabel><h2 id="about-title">About <span>Us</span></h2><div className="experience"><strong>5<span>+</span></strong><span>YEARS OF<br />EXPERIENCE</span></div></div>
          <div className="about-copy"><p>Lions ENT is a creative production and technology company with over 5 years of experience delivering professional AV production, media, event, and digital solutions.</p><p>We combine creativity and technology to provide photography, videography, livestreaming, LED displays, web design, and web application development for businesses, organizations, and events.</p></div>
          <img className="lion-motif about-pattern" src="/brand/vector.png" alt="" aria-hidden="true" />
        </section>

        <section className="services section-shell" id="services" data-section="04-services" aria-labelledby="services-title">
          <WavyBackdrop id="services-wave-stroke" />
          <div className="section-heading"><div><SectionLabel>WHAT WE DO</SectionLabel><h2 id="services-title">Our <span>Services</span></h2></div><FaAsterisk className="section-motif" aria-hidden="true" /></div>
          <div className="service-grid">{services.map((service, index) => <article className="service-card" key={service.id} id={service.id}><div className="service-top"><span>0{index + 1}</span><Icon type={service.icon} /></div><h3>{service.title}</h3><p>{service.description}</p><span className="card-rule" aria-hidden="true" /></article>)}</div>
        </section>

        <section className="events section-shell" id="event-solutions" data-section="05-event-solutions" aria-labelledby="events-title">
          <div className="events-heading"><SectionLabel light>EVENT SOLUTIONS</SectionLabel><h2 id="events-title">Event Planning &amp;<br />Management Solutions</h2><h3>From Planning to Execution, We Help You Manage It All.</h3></div>
          <div className="events-content"><p>Lions ENT supports clients with both event planning and event management solutions, helping organize smooth, professional, and well-coordinated events from preparation to event day.</p><ul className="event-list">{eventSolutions.map((item, index) => <li key={item}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ul><p className="events-closing">Whether it is a conference, corporate event, exhibition, launch, or private event, we help manage the details so the entire event runs smoothly.</p></div>
          <img className="lion-motif events-pattern" src="/brand/vector.png" alt="" aria-hidden="true" />
        </section>

        <section className="work section-shell" id="portfolio" data-section="06-work" aria-labelledby="work-title">
          <WavyBackdrop id="work-wave-stroke" />
          <div className="section-heading"><div><SectionLabel>PORTFOLIO</SectionLabel><h2 id="work-title">Our <span>Work</span></h2></div><p>A selection of projects delivered across audiovisual production, photography, videography, livestreaming, events, and digital solutions.</p></div>
          <Portfolio />
        </section>

        <section className="clients section-shell" id="clients" data-section="07-clients" aria-labelledby="clients-title">
          <img className="lion-motif clients-pattern" src="/brand/vector.png" alt="" aria-hidden="true" />
          <div className="clients-heading"><SectionLabel>Clients &amp; Partners</SectionLabel><h2 id="clients-title">Trusted <span>By</span></h2><p>We are proud to have worked with businesses, organizations, institutions, and brands across different projects.</p></div>
          <PartnerSlider items={clients} />
        </section>

        <section className="team section-shell" id="team" data-section="08-team" aria-labelledby="team-title">
          <WavyBackdrop id="team-wave-stroke" />
          <div className="team-heading"><SectionLabel>THE PEOPLE BEHIND THE WORK</SectionLabel><h2 id="team-title">Our <span>Team</span></h2><h3>Meet the creative and technical team behind Lions ENT.</h3><p>Our team brings together experience in audiovisual production, photography, videography, livestreaming, event production, design, and technology to deliver reliable solutions from concept to execution.</p></div>
          <div className="team-grid">{team.map((member, index) => <article className="team-card" key={member.name || index}><div className="team-photo">{member.photo ? <img src={member.photo} alt={member.name} loading="lazy" /> : <><span className="portrait-placeholder" aria-hidden="true"><i /><b /></span><span className="photo-label">PHOTO</span></>}</div><h3>{member.name || 'Name'}</h3><p>{member.role || 'Role'}</p></article>)}</div>
        </section>

        <section className="contact section-shell" id="contact" data-section="09-contact" aria-labelledby="contact-title">
          <div className="contact-heading"><SectionLabel light>Contact Us</SectionLabel><h2 id="contact-title">Let's Work<br /><span>Together.</span></h2><p>Planning an event, production, or digital project? Talk to Lions ENT and let's turn your idea into a professional solution.</p></div>
          <div className="contact-content">
            <dl className="contact-details">
              {company.phone && <div><dt>Phone / WhatsApp</dt><dd><a href={`tel:${company.phone.replace(/[^+\d]/g, '')}`}>{company.phone}</a>{company.whatsapp && <a className="whatsapp-link" href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp ↗</a>}</dd></div>}
              {company.email && <div><dt>Email</dt><dd><a href={`mailto:${company.email}`}>{company.email}</a></dd></div>}
              <div><dt>WhatsApp</dt><dd className="whatsapp-numbers">{company.whatsappNumbers.map(number => <a key={number.international} href={`https://wa.me/${number.international}`} target="_blank" rel="noreferrer" aria-label={`Chat on WhatsApp: ${number.label}`}><FaWhatsapp aria-hidden="true" /><span>{number.label}</span><FaArrowUpRightFromSquare className="number-arrow" aria-hidden="true" /></a>)}</dd></div>
              <div><dt>Follow Us</dt><dd className="social-icon-links"><a href={company.socials.Instagram} target="_blank" rel="noreferrer" aria-label="Lions ENT on Instagram" title="Instagram"><FaInstagram aria-hidden="true" /></a><a href={company.socials.YouTube} target="_blank" rel="noreferrer" aria-label="Lions ENT on YouTube" title="YouTube"><FaYoutube aria-hidden="true" /></a></dd></div>
              <div><dt>Location</dt><dd>{company.location}</dd></div>
            </dl>
            <a className="button light" href={contactHref} target={contactHref.startsWith('https:') ? '_blank' : undefined} rel={contactHref.startsWith('https:') ? 'noreferrer' : undefined}>Get in Touch <FaArrowUpRightFromSquare aria-hidden="true" className="ui-icon" /></a>
            {!company.email && !company.phone && <p className="contact-note">Message us on WhatsApp to discuss your project.</p>}
          </div>
          <img className="lion-motif contact-pattern" src="/brand/vector.png" alt="" aria-hidden="true" />
        </section>
      </main>

      <footer className="footer section-shell" data-section="10-footer">
        <WavyBackdrop id="footer-wave-stroke" />
        <div className="footer-intro"><Brand /><div><p className="footer-tagline">Creative Production and Technology Partner.</p><p>Professional AV production, media, event management, and digital solutions for businesses, organizations, and events.</p></div></div>
        <div className="footer-columns"><div><h2>Quick Links</h2><ul>{footerLinks.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}<li><PortalLink className="footer-portal" onUnavailable={showPortalNotice} /></li></ul></div><div><h2>Services</h2><ul>{services.slice(0, 3).map(service => <li key={service.id}><a href={`#${service.id}`}>{service.title}</a></li>)}<li><a href="#event-solutions">Event Planning &amp; Management</a></li><li><a href="#creative-digital">Creative &amp; Digital Solutions</a></li></ul></div><div><h2>Contact</h2><ul><li>{company.location}</li>{company.whatsappNumbers.map(number => <li key={number.international}><a className="footer-whatsapp" href={`https://wa.me/${number.international}`} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" /> {number.label}</a></li>)}{company.email && <li><a href={`mailto:${company.email}`}>{company.email}</a></li>}</ul></div><div><h2>Follow Us</h2><ul>{Object.entries(company.socials).map(([label, url]) => <li key={label}>{url ? <a href={url} target="_blank" rel="noreferrer"><span className="footer-social">{label === 'Instagram' ? <FaInstagram aria-hidden="true" /> : <FaYoutube aria-hidden="true" />}{label}</span></a> : <span className="social-pending">{label}<small>Link pending</small></span>}</li>)}</ul></div></div>
        <div className="footer-bottom"><p>© 2026 Lions ENT. All Rights Reserved.</p><a href="#home">BACK TO TOP <FaArrowUp aria-hidden="true" className="ui-icon" /></a></div>
      </footer>

      <dialog ref={dialogRef} className="information-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description" onClose={() => setDialogContent(null)} onClick={event => {
        if (event.target === dialogRef.current) {
          const bounds = dialogRef.current.getBoundingClientRect()
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialogRef.current.close()
        }
      }}><button className="dialog-close" type="button" aria-label="Close dialog" onClick={() => dialogRef.current?.close()}><FaXmark aria-hidden="true" /></button><p className="eyebrow">LIONS ENT</p><h2 id="dialog-title">{dialogContent?.title}</h2><p id="dialog-description">{dialogContent?.text}</p><button className="button red" type="button" onClick={() => dialogRef.current?.close()}>Close</button></dialog>
    </>
  )
}

export default App


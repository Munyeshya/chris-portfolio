import { useEffect, useState } from 'react'
import './App.css'

const services = [
  ['01', 'Photography', 'The big picture. The little details.', 'Honest emotions, striking portraits and every in-between moment, captured with care.', '↗', '#/portfolio/visual'],
  ['02', 'Videography', 'Stories you can feel.', 'Event films, brand stories and cinematic highlights that bring the moment back to life.', '▷', '#/portfolio/visual'],
  ['03', 'Websites', 'Your next great first impression.', 'Distinctive, responsive websites that connect your brand with the people who matter.', '⌘', '#/portfolio/digital'],
  ['04', 'Software', 'Good ideas. Built to work.', 'Thoughtful digital tools and custom applications that make your everyday work simpler.', '+', '#/portfolio/digital'],
]

function Brand() {
  return <a className="brand" href="#home" aria-label="LionsEvents home"><span className="brand-mark" aria-hidden="true">L<span>.</span></span><span>LIONS<span className="brand-light">EVENTS</span><small>CAPTURE. CREATE. CONNECT.</small></span></a>
}
function Pattern({ className = '' }) { return <div className={`pattern ${className}`} aria-hidden="true"><i /><i /><i /><i /></div> }
function DigitalArt() {
  return <div className="digital-art" aria-hidden="true"><div className="browser-art"><div className="browser-top"><span>● ● ●</span><span>STUDIO / DIGITAL</span></div><div className="browser-content"><small>IDEAS INTO EXPERIENCES</small><strong>Made to<br /><em>stand out.</em></strong><span className="art-button">EXPLORE THE POSSIBILITIES ↗</span><div className="art-orbit" /></div></div><div className="code-tag">&lt; creativity meets code /&gt;</div></div>
}
function App() {
  const [hash, setHash] = useState(window.location.hash || '#home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('All')
  const [copied, setCopied] = useState(false)
  const [brief, setBrief] = useState('')
  useEffect(() => {
    const onHash = () => { setHash(window.location.hash || '#home'); setMenuOpen(false); setFilter('All') }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const portfolio = hash.startsWith('#/portfolio/')
  const digital = hash === '#/portfolio/digital'
  useEffect(() => {
    document.title = portfolio ? `${digital ? 'Web & Software' : 'Photo & Film'} Portfolio | LionsEvents` : 'LionsEvents | Capture. Create. Connect.'
    if (portfolio) window.scrollTo(0, 0)
    else requestAnimationFrame(() => document.getElementById(hash.slice(1) || 'home')?.scrollIntoView())
  }, [hash, portfolio, digital])
  async function createBrief(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = `LionsEvents project enquiry\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${data.get('service')}\n\n${data.get('message')}`
    setBrief(text)
    try { await navigator.clipboard.writeText(text); setCopied(true) } catch { setCopied(false) }
  }
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="header"><div className="nav-wrap"><Brand /><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="navigation">{menuOpen ? 'Close ×' : 'Menu ☰'}</button><nav id="navigation" className={menuOpen ? 'navigation open' : 'navigation'} aria-label="Main navigation"><a className={hash === '#home' ? 'active' : ''} href="#home">Home</a><a href="#about">About us</a><a href="#services">Services</a><a className={portfolio ? 'active' : ''} href="#work">Our work</a><a className="nav-cta" href="#contact">Let’s talk <span>↗</span></a></nav></div></header>
    <main id="main">
    {portfolio ? <>
      <section className="portfolio-intro section-shell"><a className="back-link" href="#work">← Back to home</a><p className="eyebrow">THE LIONSEVENTS PORTFOLIO</p><h1>{digital ? 'Ideas, built' : 'Life, captured'}<br /><span>{digital ? 'for the real world.' : 'in every frame.'}</span></h1><p className="intro-copy">{digital ? 'A space for our websites, digital products and custom software.' : 'A space for our event photography, cinematic films and visual stories.'}</p><div className="portfolio-switch"><a className={!digital ? 'selected' : ''} href="#/portfolio/visual">Photography & film</a><a className={digital ? 'selected' : ''} href="#/portfolio/digital">Web & software</a></div><Pattern /></section>
      <section className="section-shell portfolio-body"><div className="filter-row" aria-label="Portfolio categories">{(digital ? ['All', 'Websites', 'Software'] : ['All', 'Photography', 'Videography']).map(item => <button key={item} className={filter === item ? 'selected' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="portfolio-placeholder"><span className="eyebrow">{filter === 'All' ? 'PORTFOLIO' : filter.toUpperCase()}</span><h2>Great stories belong here.</h2><p>Our {filter === 'All' ? 'project collection' : filter.toLowerCase()} will be added soon. In the meantime, explore what we can create together.</p><a className="button red" href="#contact">Discuss your project ↗</a></div></section>
    </> : <>
      <section className="hero" id="home"><img className="hero-photo" src="/images/concert.jpg" alt="Audience watching a live concert under red stage lighting" fetchPriority="high" /><div className="hero-shade" /><div className="hero-content section-shell"><p className="eyebrow"><span className="red-dash" /> MOMENTS. STORIES. DIGITAL EXPERIENCES.</p><h1>WE MAKE<br />MOMENTS<br /><span>MATTER.</span></h1><p className="hero-description">From the energy of your event to the impact of your online presence. We capture it. We create it. We bring it to life.</p><div className="hero-actions"><a className="button red" href="#work">Explore our work <span>↗</span></a><a className="button outline" href="#contact">Let’s create together <span>↗</span></a></div></div><div className="hero-art" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit orbit-three" /><span className="hero-star">✳</span></div><div className="hero-bottom section-shell"><a href="#about">SCROLL TO DISCOVER <span>↓</span></a><span>PHOTOGRAPHY & FILM <b> / </b> WEB & SOFTWARE</span></div><span className="photo-note">Preview image · Unsplash</span></section>
      <div className="service-strip" aria-label="Our creative disciplines"><span>PHOTOGRAPHY</span><b>✳</b><span>VIDEOGRAPHY</span><b>✳</b><span>WEB DESIGN</span><b>✳</b><span>SOFTWARE DEVELOPMENT</span><b>✳</b></div>
      <section className="about section-shell" id="about"><div><p className="eyebrow">THIS IS LIONSEVENTS</p><h2>CREATIVE MINDS.<br />ONE <span>BOLD VISION.</span></h2></div><div className="about-copy"><p>Some moments deserve more than a memory.<br />Some ideas deserve more than a sketch.</p><p>We bring visual storytelling and digital craft together. From capturing the atmosphere of an event to building a home for your brand online, we turn what matters to you into something people remember.</p><a className="text-link" href="#services">Discover what we do <span>↗</span></a></div><Pattern className="about-pattern" /></section>
      <section className="services section-shell" id="services"><div className="section-heading"><div><p className="eyebrow">WHAT WE DO</p><h2>YOUR VISION.<br /><span>OUR CREATIVE ENERGY.</span></h2></div><p>Behind the lens. Beyond the screen.<br />A creative partner from start to finish.</p></div><div className="service-grid">{services.map(([number, title, subtitle, description, icon, link]) => <a className="service-card" key={number} href={link}><div className="service-top"><span>{number} /</span><b aria-hidden="true">{icon}</b></div><h3>{title}</h3><h4>{subtitle}</h4><p>{description}</p><span className="service-link">Explore {title.toLowerCase()} <span>↗</span></span></a>)}</div></section>
      <section className="work section-shell" id="work"><div className="section-heading"><div><p className="eyebrow">TWO WORLDS. ONE CREATIVE SPIRIT.</p><h2>SEE WHAT’S <span>POSSIBLE.</span></h2></div><p>Explore our two sides.</p></div><div className="work-grid"><a className="work-card visual-work" href="#/portfolio/visual"><img src="/images/crowd.jpg" alt="A concert crowd illuminated by red stage lights" loading="lazy" /><span className="work-label">THE VISUAL SIDE</span><div className="work-caption"><div><p>PHOTOGRAPHY / VIDEOGRAPHY</p><h3>Stories in motion.<br />Moments in focus.</h3></div><span className="circle-arrow">↗</span></div><span className="sample-label">SAMPLE IMAGERY</span></a><a className="work-card digital-work" href="#/portfolio/digital"><span className="work-label">THE DIGITAL SIDE</span><DigitalArt /><div className="work-caption"><div><p>WEBSITES / SOFTWARE</p><h3>Experiences that click.<br />Ideas that work.</h3></div><span className="circle-arrow">↗</span></div><span className="sample-label">DESIGN CONCEPT</span></a></div></section>
      <section className="process section-shell"><p className="eyebrow">HOW WE BRING IT TO LIFE</p><div className="process-grid"><h2>GOOD WORK.<br /><span>GREAT CONNECTION.</span></h2>{[['01', 'We listen.', 'Your story, your goals, your vision. Every project starts with a conversation.'], ['02', 'We create.', 'We shape the direction and bring every detail together with purpose.'], ['03', 'You shine.', 'A final experience made for you, ready to be seen, shared and remembered.']].map(([n,t,p]) => <div key={n}><span className="process-number">{n}</span><h3>{t}</h3><p>{p}</p></div>)}</div></section>
    </>}
      <section className="contact section-shell" id="contact"><div className="contact-copy"><p className="eyebrow">LET’S MAKE SOMETHING GREAT</p><h2>YOUR NEXT<br />BIG THING<br />STARTS <span>HERE.</span></h2><p>An event to capture? A brand to bring online?<br />Tell us what you have in mind.</p><Pattern className="contact-pattern" /></div><form onSubmit={createBrief}><div className="form-row"><label>Your name<input name="name" autoComplete="name" placeholder="Name" required maxLength={120} /></label><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label></div><label>What can we help you create?<select name="service" defaultValue="" required><option value="" disabled>Select a service</option>{services.map(s => <option key={s[1]}>{s[1]}</option>)}<option>A little of everything</option></select></label><label>Tell us about your project<textarea name="message" placeholder="Your idea, event date, or what you’re looking to build…" rows={4} required maxLength={5000} /></label><button className="button light" type="submit">Prepare project brief <span>↗</span></button><p className="form-note">Preview mode: prepare and copy your brief. Nothing is sent yet.</p>{brief && <div className="brief-result" role="status"><p>{copied ? 'Your brief is copied and ready to share. Nothing has been sent.' : 'Your brief is ready. Select and copy it below.'}</p><textarea aria-label="Prepared project brief" value={brief} readOnly rows={7} onFocus={event => event.target.select()} /></div>}</form></section>
    </main><footer className="footer section-shell"><Brand /><span>© {new Date().getFullYear()} LionsEvents. All rights reserved.</span><a href="#home">BACK TO TOP ↑</a></footer>
  </>
}
export default App

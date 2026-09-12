import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { FaArrowRightFromBracket, FaBars, FaBriefcase, FaCalendarDays, FaCheck, FaHandshake, FaHouse, FaImage, FaPeopleGroup, FaXmark } from 'react-icons/fa6'
import { authConfigured, supabase } from '../lib/supabase.js'
import './DashboardPage.css'

const sections = [
  ['overview', 'Overview', FaHouse], ['bookings', 'Bookings', FaCalendarDays], ['clients', 'Clients', FaPeopleGroup],
  ['team', 'Team', FaPeopleGroup], ['partners', 'Partners', FaHandshake], ['work', 'Our Work', FaImage],
]
const statuses = ['submitted','under_review','quoted','contract_sent','deposit_pending','confirmed','in_production','client_review','completed','cancelled']
const emptyForms = {
  team: { name: '', role: '', photo_url: '', sort_order: 0, active: true },
  partners: { name: '', logo_url: '', knockout: false, sort_order: 0, active: true },
  work: { title: '', external_url: '', image_url: '', categories: 'Photography', sort_order: 0, active: true },
}

export default function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(authConfigured ? undefined : null)
  const [profile, setProfile] = useState(undefined)
  const [section, setSection] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [data, setData] = useState({ bookings: [], team: [], partners: [], work: [] })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [toast, setToast] = useState(location.state?.toast || '')
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  useEffect(() => {
    if (!toast) return undefined
    navigate(location.pathname, { replace: true, state: null })
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast, navigate, location.pathname])

  useEffect(() => {
    if (!accountOpen) return undefined
    const close = event => {
      if (event.key === 'Escape' || !accountRef.current?.contains(event.target)) setAccountOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', close)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', close)
    }
  }, [accountOpen])

  useEffect(() => {
    if (!supabase) return undefined
    supabase.auth.getSession().then(({ data: auth }) => setSession(auth.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: current, error }) => {
      setProfile(error ? null : current)
    })
  }, [session])

  useEffect(() => {
    if (!profile || !['staff', 'admin'].includes(profile.role)) return
    loadAll()
  }, [profile])

  async function loadAll() {
    setLoading(true)
    const [bookings, team, partners, work] = await Promise.all([
      supabase.from('booking_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('website_team').select('*').order('sort_order'),
      supabase.from('website_partners').select('*').order('sort_order'),
      supabase.from('website_work').select('*').order('sort_order'),
    ])
    const error = [bookings, team, partners, work].find(result => result.error)?.error
    if (error) setNotice(error.message)
    setData({ bookings: bookings.data || [], team: team.data || [], partners: partners.data || [], work: work.data || [] })
    setLoading(false)
  }

  async function signOut() { await supabase.auth.signOut() }
  if (!authConfigured) return <DashboardMessage title="Dashboard is not configured" message="Add your public Supabase environment variables, then restart the website." />
  if (session === undefined || (session && profile === undefined)) return <DashboardMessage title="Opening dashboard…" message="Checking your secure session." />
  if (!session) return <Navigate to="/login" replace />
  if (!profile || !['staff', 'admin'].includes(profile.role)) return <DashboardMessage title="Management access required" message="This account is signed in but has not been assigned a staff or admin role." action={<><Link className="portal-button primary" to="/booking">Go to booking</Link><button className="portal-button" onClick={signOut}>Sign out</button></>} />

  const CurrentIcon = sections.find(item => item[0] === section)?.[2] || FaBriefcase
  return <div className="dashboard-page">
    {toast && <div className="dashboard-toast" role="status"><FaCheck aria-hidden="true" /><span>{toast}</span><button type="button" onClick={() => setToast('')} aria-label="Close notification"><FaXmark aria-hidden="true" /></button></div>}
    <aside className={`dashboard-sidebar${menuOpen ? ' open' : ''}`}>
      <div className="dashboard-logo"><img src="/brand/lions-ent-white.png" alt="Lions Entertainment" /><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><FaXmark /></button></div>
      <nav>{sections.map(([id, label, Icon]) => <button className={section === id ? 'active' : ''} key={id} onClick={() => { setSection(id); setMenuOpen(false) }}><Icon /><span>{label}</span></button>)}</nav>
      <div className="dashboard-site-link"><Link to="/"><FaHouse /> View website</Link></div>
    </aside>
    <main className="dashboard-main">
      <header><button className="dashboard-menu" onClick={() => setMenuOpen(true)}><FaBars /> Menu</button><div className="dashboard-title"><p>Lions Entertainment</p><h1><CurrentIcon /> {sections.find(item => item[0] === section)?.[1]}</h1></div><div className="dashboard-account" ref={accountRef}><button className="account-avatar" type="button" aria-label="Open account menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(open => !open)}>{getInitials(profile.full_name || profile.email)}</button>{accountOpen && <div className="account-dropdown"><small>Signed in as</small><strong>{profile.full_name || profile.email}</strong><span>{profile.role}</span><button className="account-signout" onClick={signOut}><FaArrowRightFromBracket /> Sign out</button></div>}</div></header>
      {notice && <p className="dashboard-notice" role="status">{notice}<button onClick={() => setNotice('')}>Dismiss</button></p>}
      {loading ? <p className="dashboard-loading">Loading dashboard…</p> : <DashboardContent section={section} data={data} reload={loadAll} setNotice={setNotice} />}
    </main>
  </div>
}

function getInitials(value = '') {
  const parts = value.includes('@') ? [value.split('@')[0]] : value.trim().split(/\s+/)
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'LE'
}

function DashboardMessage({ title, message, action }) {
  return <main className="portal-page auth-page"><section className="auth-card"><p className="portal-eyebrow">Lions Entertainment Portal</p><h1>{title}</h1><p>{message}</p>{action && <div className="portal-actions">{action}</div>}</section></main>
}

function DashboardContent({ section, data, reload, setNotice }) {
  if (section === 'overview') return <Overview data={data} />
  if (section === 'bookings') return <Bookings items={data.bookings} reload={reload} setNotice={setNotice} />
  if (section === 'clients') return <Clients bookings={data.bookings} />
  return <ContentManager type={section} items={data[section]} reload={reload} setNotice={setNotice} />
}

function Overview({ data }) {
  const pending = data.bookings.filter(item => !['completed','cancelled'].includes(item.status)).length
  const confirmed = data.bookings.filter(item => item.status === 'confirmed').length
  return <><div className="dashboard-stats"><Stat label="Total requests" value={data.bookings.length} /><Stat label="Active bookings" value={pending} /><Stat label="Confirmed" value={confirmed} /><Stat label="Website entries" value={data.team.length + data.partners.length + data.work.length} /></div><section className="dashboard-panel"><div className="panel-heading"><div><p>Latest activity</p><h2>Recent booking requests</h2></div></div><BookingTable items={data.bookings.slice(0, 6)} /></section></>
}
function Stat({ label, value }) { return <article><span>{label}</span><strong>{value}</strong></article> }

function Bookings({ items, reload, setNotice }) {
  async function updateStatus(id, status) { const { error } = await supabase.from('booking_requests').update({ status }).eq('id', id); setNotice(error ? error.message : 'Booking status updated.'); if (!error) reload() }
  return <section className="dashboard-panel"><div className="panel-heading"><div><p>Booking management</p><h2>All booking requests</h2></div><span>{items.length} requests</span></div><BookingTable items={items} updateStatus={updateStatus} /></section>
}

function BookingTable({ items, updateStatus }) {
  return <div className="table-scroll"><table><thead><tr><th>Reference</th><th>Client</th><th>Project</th><th>Date/deadline</th><th>Services</th><th>Status</th></tr></thead><tbody>{items.length ? items.map(item => <tr key={item.id}><td><strong>{item.reference}</strong><small>{new Date(item.created_at).toLocaleDateString()}</small></td><td>{item.client_name}<small>{item.email}<br />{item.phone}</small></td><td>{item.project_name}<small>{item.project_type}</small></td><td>{item.event_date || item.delivery_deadline || '—'}<small>{item.location || ''}</small></td><td>{item.services?.join(', ')}</td><td>{updateStatus ? <select value={item.status} onChange={event => updateStatus(item.id, event.target.value)}>{statuses.map(status => <option value={status} key={status}>{status.replaceAll('_', ' ')}</option>)}</select> : <span className={`status status-${item.status}`}>{item.status?.replaceAll('_', ' ')}</span>}</td></tr>) : <tr><td colSpan="6" className="empty-cell">No booking requests yet.</td></tr>}</tbody></table></div>
}

function Clients({ bookings }) {
  const clients = useMemo(() => Object.values(bookings.reduce((all, item) => { const key=item.email.toLowerCase(); all[key] ||= { email:item.email,name:item.client_name,phone:item.phone,company:item.company,count:0,last:item.created_at }; all[key].count += 1; return all }, {})), [bookings])
  return <section className="dashboard-panel"><div className="panel-heading"><div><p>Client directory</p><h2>Clients from bookings</h2></div><span>{clients.length} clients</span></div><div className="table-scroll"><table><thead><tr><th>Name</th><th>Contact</th><th>Company</th><th>Requests</th></tr></thead><tbody>{clients.length ? clients.map(client => <tr key={client.email}><td><strong>{client.name}</strong></td><td>{client.email}<small>{client.phone}</small></td><td>{client.company || '—'}</td><td>{client.count}</td></tr>) : <tr><td colSpan="4" className="empty-cell">Clients will appear when bookings are submitted.</td></tr>}</tbody></table></div></section>
}

function ContentManager({ type, items, reload, setNotice }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForms[type])
  const labels = { team: 'team member', partners: 'partner', work: 'work item' }
  function start(item) {
    setEditing(item?.id || 'new')
    if (!item) return setForm(emptyForms[type])
    setForm(type === 'work' ? { ...item, categories: item.categories?.join(', ') || '' } : { ...item })
  }
  async function save(event, imageFile) {
    event.preventDefault()
    const table = `website_${type}`
    const payload = { ...form }; delete payload.id; delete payload.created_at; delete payload.updated_at
    if (type !== 'work') delete payload.categories
    if (type === 'team' && imageFile) {
      if (!imageFile.type.startsWith('image/')) return setNotice('Please select an image file.')
      if (imageFile.size > 5 * 1024 * 1024) return setNotice('Team photos must be 5 MB or smaller.')
      const extension = imageFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const objectPath = `team/${crypto.randomUUID()}.${extension}`
      const uploaded = await supabase.storage.from('website-media').upload(objectPath, imageFile, { contentType: imageFile.type, upsert: false })
      if (uploaded.error) return setNotice(uploaded.error.message)
      payload.photo_url = supabase.storage.from('website-media').getPublicUrl(objectPath).data.publicUrl
    }
    if (type === 'team' && editing === 'new' && !payload.photo_url) return setNotice('Please choose a team member photo.')
    if (type === 'work') payload.categories = form.categories.split(',').map(value => value.trim()).filter(Boolean)
    const result = editing === 'new' ? await supabase.from(table).insert(payload) : await supabase.from(table).update(payload).eq('id', editing)
    setNotice(result.error ? result.error.message : `${labels[type]} saved.`)
    if (!result.error) { setEditing(null); reload() }
  }
  async function remove(item) { if (!window.confirm(`Delete ${item.name || item.title}?`)) return; const { error } = await supabase.from(`website_${type}`).delete().eq('id', item.id); setNotice(error ? error.message : `${labels[type]} deleted.`); if (!error) reload() }
  return <section className="dashboard-panel"><div className="panel-heading"><div><p>Website content</p><h2>Manage {type === 'work' ? 'our work' : type}</h2></div><button className="dashboard-primary" onClick={() => start(null)}>Add {labels[type]}</button></div>{editing && <ContentForm type={type} form={form} setForm={setForm} save={save} cancel={() => setEditing(null)} />}<div className="content-list">{items.map(item => <article key={item.id}><div className="content-thumb"><img src={item.photo_url || item.logo_url || item.image_url} alt="" /></div><div><strong>{item.name || item.title}</strong><span>{item.role || item.external_url || 'Partner logo'}</span><small>{item.active ? 'Visible' : 'Hidden'} · Order {item.sort_order}</small></div><div className="row-actions"><button onClick={() => start(item)}>Edit</button><button className="danger" onClick={() => remove(item)}>Delete</button></div></article>)}</div></section>
}

function ContentForm({ type, form, setForm, save, cancel }) {
  const [imageFile, setImageFile] = useState(null)
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))
  return <form className="content-form" onSubmit={event => save(event, imageFile)}>
    <label>{type === 'work' ? 'Title' : 'Name'}<input required name={type === 'work' ? 'title' : 'name'} value={form[type === 'work' ? 'title' : 'name']} onChange={update} /></label>
    {type === 'team' && <label>Role<input name="role" value={form.role} onChange={update} /></label>}
    {type === 'team' ? <label className="dashboard-file-field">Team photo<input required={!form.photo_url} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => setImageFile(event.target.files?.[0] || null)} /><small>{imageFile ? imageFile.name : form.photo_url ? 'Choose a file only when replacing the current photo.' : 'JPG, PNG, WebP or GIF · maximum 5 MB'}</small></label> : <label>{type === 'partners' ? 'Logo URL' : 'Image URL'}<input required name={type === 'partners' ? 'logo_url' : 'image_url'} value={form[type === 'partners' ? 'logo_url' : 'image_url']} onChange={update} /></label>}
    {type === 'work' && <><label>External album URL<input required type="url" name="external_url" value={form.external_url} onChange={update} /></label><label>Categories <small>Separate with commas</small><input name="categories" value={form.categories} onChange={update} /></label></>}
    {type === 'partners' && <label className="check-field"><input type="checkbox" name="knockout" checked={form.knockout} onChange={update} /> Use knockout treatment</label>}
    <label>Display order<input type="number" name="sort_order" value={form.sort_order} onChange={update} /></label>
    <label className="check-field"><input type="checkbox" name="active" checked={form.active} onChange={update} /> Visible on website</label>
    <div className="content-form-actions"><button className="dashboard-primary">Save</button><button type="button" onClick={cancel}>Cancel</button></div>
  </form>
}

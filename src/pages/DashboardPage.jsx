import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { FaArrowRightFromBracket, FaBars, FaBriefcase, FaCalendarDays, FaCheck, FaHandshake, FaHouse, FaImage, FaPeopleGroup, FaTicket, FaUserPlus, FaXmark } from 'react-icons/fa6'
import { api, authApi } from '../lib/api.js'
import './DashboardPage.css'

const sections = [
  ['overview', 'Overview', FaHouse], ['bookings', 'Bookings', FaCalendarDays], ['clients', 'Clients', FaPeopleGroup],
  ['team', 'Team', FaPeopleGroup], ['partners', 'Partners', FaHandshake], ['work', 'Our Work', FaImage],
  ['ticketing', 'Ticketing', FaTicket], ['users', 'Users', FaUserPlus],
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
  const [session, setSession] = useState(undefined)
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
    authApi.session().then(({ user }) => { setSession(user); setProfile(user) }).catch(() => { setSession(null); setProfile(null) })
  }, [])

  useEffect(() => {
    if (!profile || !['staff', 'admin'].includes(profile.role)) return
    loadAll()
  }, [profile])

  async function loadAll() {
    setLoading(true)
    try { setData(await api('/admin/dashboard')) } catch(error) { setNotice(error.message) }
    setLoading(false)
  }

  async function signOut() { await authApi.logout(); setSession(null) }
  if (session === undefined || (session && profile === undefined)) return <DashboardMessage title="Opening dashboard…" message="Checking your secure session." />
  if (!session) return <Navigate to="/login" replace />
  if (!profile || !['staff', 'admin'].includes(profile.role)) return <DashboardMessage title="Management access required" message="This account is signed in but has not been assigned a staff or admin role." action={<><Link className="portal-button primary" to="/booking">Go to booking</Link><button className="portal-button" onClick={signOut}>Sign out</button></>} />

  const navigationSections = profile.role === 'admin' ? sections : sections.filter(item => item[0] !== 'users')
  const CurrentIcon = navigationSections.find(item => item[0] === section)?.[2] || FaBriefcase
  return <div className="dashboard-page">
    {toast && <div className="dashboard-toast" role="status"><FaCheck aria-hidden="true" /><span>{toast}</span><button type="button" onClick={() => setToast('')} aria-label="Close notification"><FaXmark aria-hidden="true" /></button></div>}
    <aside className={`dashboard-sidebar${menuOpen ? ' open' : ''}`}>
      <div className="dashboard-logo"><img src="/brand/lions-ent-white.png" alt="Lions Entertainment" /><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><FaXmark /></button></div>
      <nav>{navigationSections.map(([id, label, Icon]) => <button className={section === id ? 'active' : ''} key={id} onClick={() => { setSection(id); setMenuOpen(false) }}><Icon /><span>{label}</span></button>)}</nav>
      <div className="dashboard-site-link"><Link to="/"><FaHouse /> View website</Link></div>
    </aside>
    <main className="dashboard-main">
      <header><button className="dashboard-menu" onClick={() => setMenuOpen(true)}><FaBars /> Menu</button><div className="dashboard-title"><p>Lions Entertainment</p><h1><CurrentIcon /> {navigationSections.find(item => item[0] === section)?.[1]}</h1></div><div className="dashboard-account" ref={accountRef}><button className="account-avatar" type="button" aria-label="Open account menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(open => !open)}>{getInitials(profile.full_name || profile.email)}</button>{accountOpen && <div className="account-dropdown"><small>Signed in as</small><strong>{profile.full_name || profile.email}</strong><span>{profile.role}</span><button className="account-signout" onClick={signOut}><FaArrowRightFromBracket /> Sign out</button></div>}</div></header>
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
  if (section === 'users') return <Users setNotice={setNotice} />
  if (section === 'ticketing') return <TicketingAdmin setNotice={setNotice} />
  return <ContentManager type={section} items={data[section]} reload={reload} setNotice={setNotice} />
}

function TicketingAdmin({ setNotice }) {
  const [ticketing, setTicketing] = useState({ organizers: [], events: [] })
  const load = () => api('/admin/ticketing').then(setTicketing).catch(error => setNotice(error.message))
  useEffect(() => { let active = true; api('/admin/ticketing').then(data => { if (active) setTicketing(data) }).catch(error => setNotice(error.message)); return () => { active = false } }, [setNotice])
  async function review(id, status) { try { await api(`/admin/ticketing/organizers/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); setNotice(`Organizer ${status}.`); load() } catch (error) { setNotice(error.message) } }
  return <><section className="dashboard-panel"><div className="panel-heading"><div><p>Access requests</p><h2>Ticketing organizers</h2></div><span>{ticketing.organizers.length} applications</span></div><div className="table-scroll"><table><thead><tr><th>Client</th><th>Organization</th><th>Reason</th><th>Status</th><th>Decision</th></tr></thead><tbody>{ticketing.organizers.length ? ticketing.organizers.map(item => <tr key={item.id}><td><strong>{item.full_name || item.email}</strong><small>{item.email}<br />{item.phone || ''}</small></td><td>{item.organization_name}</td><td>{item.reason || '—'}</td><td><span className={`status status-${item.status}`}>{item.status}</span></td><td><div className="row-actions"><button onClick={() => review(item.id, 'approved')}>Approve</button><button onClick={() => review(item.id, 'rejected')} className="danger">Reject</button>{item.status === 'approved' && <button onClick={() => review(item.id, 'suspended')} className="danger">Suspend</button>}</div></td></tr>) : <tr><td colSpan="5" className="empty-cell">No organizer applications yet.</td></tr>}</tbody></table></div></section><section className="dashboard-panel"><div className="panel-heading"><div><p>Event activity</p><h2>Ticketing events</h2></div><span>{ticketing.events.length} events</span></div><div className="table-scroll"><table><thead><tr><th>Event</th><th>Organizer</th><th>Venue</th><th>Start</th><th>Capacity</th><th>Status</th></tr></thead><tbody>{ticketing.events.length ? ticketing.events.map(event => <tr key={event.id}><td><strong>{event.title}</strong></td><td>{event.organization_name}</td><td>{event.venue}</td><td>{new Date(event.starts_at).toLocaleString()}</td><td>{event.registered}/{event.capacity}</td><td><span className={`status status-${event.status}`}>{event.status}</span></td></tr>) : <tr><td colSpan="6" className="empty-cell">No ticketing events yet.</td></tr>}</tbody></table></div></section></>
}

function Users({ setNotice }) {
  const [users,setUsers]=useState([]),[form,setForm]=useState({fullName:'',email:'',password:'',role:'client'})
  const load=()=>api('/admin/users').then(data=>setUsers(data.users)).catch(error=>setNotice(error.message))
  useEffect(()=>{let active=true;api('/admin/users').then(data=>{if(active)setUsers(data.users)}).catch(error=>setNotice(error.message));return()=>{active=false}},[setNotice])
  async function create(event){event.preventDefault();try{await api('/admin/users',{method:'POST',body:JSON.stringify(form)});setNotice('Account created.');setForm({fullName:'',email:'',password:'',role:'client'});load()}catch(error){setNotice(error.message)}}
  return <section className="dashboard-panel"><div className="panel-heading"><div><p>Portal security</p><h2>Manage user accounts</h2></div><span>{users.length} users</span></div><form className="content-form" onSubmit={create}><label>Full name<input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></label><label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Temporary password<input required minLength="8" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="client">Client</option><option value="staff">Staff</option><option value="admin">Admin</option></select></label><div className="content-form-actions"><button className="dashboard-primary">Create account</button></div></form><div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead><tbody>{users.map(user=><tr key={user.id}><td>{user.full_name||'—'}</td><td>{user.email}</td><td><span className="status">{user.role}</span></td><td>{new Date(user.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>
}

function Overview({ data }) {
  const pending = data.bookings.filter(item => !['completed','cancelled'].includes(item.status)).length
  const confirmed = data.bookings.filter(item => item.status === 'confirmed').length
  return <><div className="dashboard-stats"><Stat label="Total requests" value={data.bookings.length} /><Stat label="Active bookings" value={pending} /><Stat label="Confirmed" value={confirmed} /><Stat label="Website entries" value={data.team.length + data.partners.length + data.work.length} /></div><section className="dashboard-panel"><div className="panel-heading"><div><p>Latest activity</p><h2>Recent booking requests</h2></div></div><BookingTable items={data.bookings.slice(0, 6)} /></section></>
}
function Stat({ label, value }) { return <article><span>{label}</span><strong>{value}</strong></article> }

function Bookings({ items, reload, setNotice }) {
  async function updateStatus(id, status) { try { await api(`/admin/bookings/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}); setNotice('Booking status updated.'); reload() } catch(error) { setNotice(error.message) } }
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
    const payload = { ...form }; delete payload.id; delete payload.created_at; delete payload.updated_at
    if (type !== 'work') delete payload.categories
    if (type === 'team' && editing === 'new' && !payload.photo_url && !imageFile) return setNotice('Please choose a team member photo.')
    if (type === 'work') payload.categories = form.categories.split(',').map(value => value.trim()).filter(Boolean)
    const body = new FormData()
    Object.entries(payload).forEach(([key,value])=>body.append(key,Array.isArray(value)?JSON.stringify(value):String(value ?? '')))
    if (imageFile) body.append('image',imageFile)
    try { await api(`/admin/content/${type}${editing==='new'?'':`/${editing}`}`,{method:editing==='new'?'POST':'PUT',body}); setNotice(`${labels[type]} saved.`); setEditing(null); reload() } catch(error) { setNotice(error.message) }
  }
  async function remove(item) { if (!window.confirm(`Delete ${item.name || item.title}?`)) return; try { await api(`/admin/content/${type}/${item.id}`,{method:'DELETE'}); setNotice(`${labels[type]} deleted.`); reload() } catch(error) { setNotice(error.message) } }
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

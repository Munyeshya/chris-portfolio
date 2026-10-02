import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaArrowRightFromBracket, FaBars, FaBriefcase, FaCalendarDays, FaCheck, FaGear, FaHandshake, FaHouse, FaImage, FaPen, FaPeopleGroup, FaTrash, FaUserPlus, FaXmark } from 'react-icons/fa6'
import { api, authApi } from '../lib/api.js'
import { workCategories } from '../content.js'
import './DashboardPage.css'

const sections = [
  ['overview', 'Overview', FaHouse], ['bookings', 'Bookings', FaCalendarDays], ['clients', 'Clients', FaPeopleGroup],
  ['team', 'Team', FaPeopleGroup], ['partners', 'Partners', FaHandshake], ['work', 'Our Work', FaImage],
  ['users', 'Users', FaUserPlus], ['account', 'Account settings', FaGear],
]
const statuses = ['submitted','under_review','quoted','contract_sent','deposit_pending','confirmed','in_production','client_review','completed','cancelled']
const emptyForms = {
  team: { name: '', role: '', photo_url: '', sort_order: 0, active: true },
  partners: { name: '', logo_url: '', knockout: false, sort_order: 0, active: true },
  work: { title: '', external_url: '', image_url: '', video_url: '', categories: 'Photography', sort_order: 0, active: true },
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
    if (!profile || profile.role !== 'admin' || profile.must_change_password) return
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
  if (!profile || profile.role !== 'admin') return <DashboardMessage title="Administrator access required" message="This account does not have access to the management dashboard." action={<button className="portal-button" onClick={signOut}>Sign out</button>} />
  if (profile.must_change_password) return <AccountSettings profile={profile} setProfile={user => { setProfile(user); setSession(user); setToast('Account setup complete. Welcome to the dashboard.') }} required signOut={signOut} />

  const navigationSections = sections
  const CurrentIcon = navigationSections.find(item => item[0] === section)?.[2] || FaBriefcase
  return <div className="dashboard-page">
    {toast && <div className="dashboard-toast" role="status"><FaCheck aria-hidden="true" /><span>{toast}</span><button type="button" onClick={() => setToast('')} aria-label="Close notification"><FaXmark aria-hidden="true" /></button></div>}
    <aside className={`dashboard-sidebar${menuOpen ? ' open' : ''}`}>
      <div className="dashboard-logo"><img src="/brand/lions-plus-white.png" alt="Lions Plus" /><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><FaXmark /></button></div>
      <nav>{navigationSections.map(([id, label, Icon]) => <button className={section === id ? 'active' : ''} key={id} onClick={() => { setSection(id); setMenuOpen(false) }}><Icon /><span>{label}</span></button>)}</nav>
      <div className="dashboard-site-link"><Link to="/"><FaHouse /> View website</Link></div>
    </aside>
    <main className="dashboard-main">
      <header><button className="dashboard-menu" onClick={() => setMenuOpen(true)}><FaBars /> Menu</button><div className="dashboard-title"><p>Lions Plus</p><h1><CurrentIcon /> {navigationSections.find(item => item[0] === section)?.[1]}</h1></div><div className="dashboard-account" ref={accountRef}><button className="account-avatar" type="button" aria-label="Open account menu" aria-expanded={accountOpen} onClick={() => setAccountOpen(open => !open)}>{getInitials(profile.full_name || profile.email)}</button>{accountOpen && <div className="account-dropdown"><small>Signed in as</small><strong>{profile.full_name || profile.email}</strong><span>{profile.role}</span><button className="account-signout" onClick={signOut}><FaArrowRightFromBracket /> Sign out</button></div>}</div></header>
      {notice && <p className="dashboard-notice" role="status">{notice}<button onClick={() => setNotice('')}>Dismiss</button></p>}
      {section === 'account' ? <AccountSettings profile={profile} setProfile={user => { setProfile(user); setSession(user); setToast('Account settings updated.') }} /> : loading ? <p className="dashboard-loading">Loading dashboard…</p> : <DashboardContent section={section} data={data} reload={loadAll} setNotice={setNotice} profile={profile} />}
    </main>
  </div>
}

function getInitials(value = '') {
  const parts = value.includes('@') ? [value.split('@')[0]] : value.trim().split(/\s+/)
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'LE'
}

function DashboardMessage({ title, message, action }) {
  return <main className="portal-page auth-page"><section className="auth-card"><p className="portal-eyebrow">Lions Plus Portal</p><h1>{title}</h1><p>{message}</p>{action && <div className="portal-actions">{action}</div>}</section></main>
}

function DashboardContent({ section, data, reload, setNotice, profile }) {
  if (section === 'overview') return <Overview data={data} />
  if (section === 'bookings') return <Bookings items={data.bookings} reload={reload} setNotice={setNotice} />
  if (section === 'clients') return <Clients bookings={data.bookings} />
  if (section === 'users') return <Users setNotice={setNotice} currentUserId={profile.id} />
  return <ContentManager type={section} items={data[section]} reload={reload} setNotice={setNotice} />
}

function Users({ setNotice, currentUserId }) {
  const [users,setUsers]=useState([]),[email,setEmail]=useState(''),[editing,setEditing]=useState(null),[busy,setBusy]=useState('')
  const load=()=>api('/admin/users').then(data=>setUsers(data.users)).catch(error=>setNotice(error.message))
  useEffect(()=>{let active=true;api('/admin/users').then(data=>{if(active)setUsers(data.users)}).catch(error=>setNotice(error.message));return()=>{active=false}},[setNotice])
  async function create(event){event.preventDefault();setBusy('create');try{await api('/admin/users',{method:'POST',body:JSON.stringify({email})});setNotice('Administrator created. A temporary password was emailed to them.');setEmail('');load()}catch(error){setNotice(error.message)}finally{setBusy('')}}
  async function save(event){event.preventDefault();setBusy(editing.id);try{await api(`/admin/users/${editing.id}`,{method:'PATCH',body:JSON.stringify({email:editing.email,fullName:editing.full_name,active:editing.active})});setNotice('Administrator updated.');setEditing(null);load()}catch(error){setNotice(error.message)}finally{setBusy('')}}
  async function remove(user){if(!window.confirm(`Permanently delete ${user.email}?`))return;setBusy(user.id);try{await api(`/admin/users/${user.id}`,{method:'DELETE'});setNotice('Administrator deleted.');load()}catch(error){setNotice(error.message)}finally{setBusy('')}}
  return <section className="dashboard-panel"><div className="panel-heading"><div><p>Portal security</p><h2>Manage administrators</h2></div><span>{users.length} admins</span></div><form className="content-form admin-invite-form" onSubmit={create}><label>Administrator email<input required type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@example.com" /></label><div className="content-form-actions"><button className="dashboard-primary" disabled={busy==='create'}>{busy==='create'?'Sending invitation…':'Create & email temporary password'}</button></div></form><div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{users.map(user=><tr key={user.id}><td>{user.full_name||'Pending setup'}</td><td>{user.email}{user.id===currentUserId&&<small>You</small>}</td><td><span className={`status ${user.active?'status-confirmed':'status-cancelled'}`}>{!user.active?'disabled':user.must_change_password?'setup required':'active'}</span></td><td>{new Date(user.created_at).toLocaleDateString()}</td><td><div className="row-actions"><button onClick={()=>setEditing({...user,active:Boolean(user.active)})}><FaPen /> Edit</button><button disabled={user.id===currentUserId||busy===user.id} onClick={()=>remove(user)}><FaTrash /> Delete</button></div></td></tr>)}</tbody></table></div>{editing&&<div className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="edit-admin-title"><form className="dashboard-modal-card" onSubmit={save}><button className="dashboard-modal-close" type="button" onClick={()=>setEditing(null)} aria-label="Close"><FaXmark /></button><p>Administrator</p><h2 id="edit-admin-title">Edit account</h2><label>Full name<input value={editing.full_name||''} onChange={event=>setEditing({...editing,full_name:event.target.value})}/></label><label>Email<input required type="email" value={editing.email} onChange={event=>setEditing({...editing,email:event.target.value})}/></label><label className="check-field"><input type="checkbox" checked={editing.active} disabled={editing.id===currentUserId} onChange={event=>setEditing({...editing,active:event.target.checked})}/> Account active</label><div className="content-form-actions"><button className="dashboard-primary" disabled={busy===editing.id}>Save changes</button><button type="button" onClick={()=>setEditing(null)}>Cancel</button></div></form></div>}</section>
}

function AccountSettings({ profile, setProfile, required = false, signOut }) {
  const [form,setForm]=useState({fullName:profile.full_name||'',currentPassword:'',newPassword:'',confirmPassword:''}),[status,setStatus]=useState({state:'idle',message:''})
  async function submit(event){event.preventDefault();if(form.newPassword!==form.confirmPassword)return setStatus({state:'error',message:'The new passwords do not match.'});setStatus({state:'loading',message:'Saving your account…'});try{const {user}=await authApi.updateAccount(form);setProfile(user);setForm({...form,currentPassword:'',newPassword:'',confirmPassword:''});setStatus({state:'success',message:'Your account has been updated.'})}catch(error){setStatus({state:'error',message:error.message})}}
  const content=<section className="account-settings-card"><p className="portal-eyebrow">{required?'First login':'Security'}</p><h1>{required?'Complete your account setup':'Account settings'}</h1><p>{required?'Enter your name and replace the temporary password before continuing.':'Update your name and password.'}</p><form onSubmit={submit}><label>Full name<input required value={form.fullName} onChange={event=>setForm({...form,fullName:event.target.value})} autoComplete="name" /></label><label>Current password<input required type="password" value={form.currentPassword} onChange={event=>setForm({...form,currentPassword:event.target.value})} autoComplete="current-password" /></label><label>New password<input required type="password" minLength="10" value={form.newPassword} onChange={event=>setForm({...form,newPassword:event.target.value})} autoComplete="new-password" /></label><label>Confirm new password<input required type="password" minLength="10" value={form.confirmPassword} onChange={event=>setForm({...form,confirmPassword:event.target.value})} autoComplete="new-password" /></label>{status.message&&<p className={`form-status ${status.state}`} role="status">{status.message}</p>}<button className="dashboard-primary" disabled={status.state==='loading'}>{status.state==='loading'?'Saving…':'Save account settings'}</button>{required&&<button className="account-setup-signout" type="button" onClick={signOut}>Sign out</button>}</form></section>
  return required?<main className="account-setup-page">{content}</main>:content
}

function Overview({ data }) {
  const pending = data.bookings.filter(item => !['completed','cancelled'].includes(item.status)).length
  const confirmed = data.bookings.filter(item => item.status === 'confirmed').length
  return <><div className="dashboard-stats"><Stat label="Total requests" value={data.bookings.length} /><Stat label="Active bookings" value={pending} /><Stat label="Confirmed" value={confirmed} /><Stat label="Website entries" value={data.team.length + data.partners.length + data.work.length} /></div><section className="dashboard-panel"><div className="panel-heading"><div><p>Latest activity</p><h2>Recent booking requests</h2></div></div><BookingTable items={data.bookings.slice(0, 6)} /></section></>
}
function Stat({ label, value }) { return <article><span>{label}</span><strong>{value}</strong></article> }

function Bookings({ items, reload, setNotice }) {
  const [selected, setSelected] = useState(null)
  async function updateStatus(id, status) { try { await api(`/admin/bookings/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}); setNotice('Booking status updated.'); reload() } catch(error) { setNotice(error.message) } }
  if (selected) return <BookingDetails booking={selected} close={() => setSelected(null)} updateStatus={updateStatus} reload={reload} setNotice={setNotice} />
  return <section className="dashboard-panel"><div className="panel-heading"><div><p>Booking management</p><h2>All booking requests</h2></div><span>{items.length} requests</span></div><BookingTable items={items} updateStatus={updateStatus} onView={setSelected} /></section>
}

function BookingTable({ items, updateStatus, onView }) {
  return <div className="table-scroll"><table><thead><tr><th>Reference</th><th>Client</th><th>Project</th><th>Date/deadline</th><th>Services</th><th>Status</th>{onView && <th>Details</th>}</tr></thead><tbody>{items.length ? items.map(item => <tr key={item.id}><td><strong>{item.reference}</strong><small>{new Date(item.created_at).toLocaleDateString()}</small></td><td>{item.client_name}<small>{item.email}<br />{item.phone}</small></td><td>{item.project_name}<small>{item.project_type}</small></td><td>{item.event_date ? `${item.event_date} — ${item.event_end_date || item.event_date}` : item.delivery_deadline || '—'}<small>{item.location || ''}</small></td><td>{item.services?.join(', ')}</td><td>{updateStatus ? <select value={item.status} onChange={event => updateStatus(item.id, event.target.value)}>{statuses.map(status => <option value={status} key={status}>{status.replaceAll('_', ' ')}</option>)}</select> : <span className={`status status-${item.status}`}>{item.status?.replaceAll('_', ' ')}</span>}</td>{onView && <td><button className="table-view-button" onClick={() => onView(item)}>View details</button></td>}</tr>) : <tr><td colSpan={onView ? 7 : 6} className="empty-cell">No booking requests yet.</td></tr>}</tbody></table></div>
}

function BookingDetails({ booking, close, updateStatus, reload, setNotice }) {
  const [quotation,setQuotation]=useState(null),[sending,setSending]=useState(false)
  const detail = (label, value, wide = false) => value ? <div className={wide ? 'wide' : ''}><dt>{label}</dt><dd>{value}</dd></div> : null
  async function sendQuotation(event){event.preventDefault();if(!quotation)return;setSending(true);const body=new FormData();body.append('quotation',quotation);try{const result=await api(`/admin/bookings/${booking.id}/quotation`,{method:'POST',body});setNotice(result.emailSent?'Quotation uploaded and emailed to the client.':'Quotation uploaded, but the email could not be delivered.');await reload();close()}catch(error){setNotice(error.message)}finally{setSending(false)}}
  return <section className="booking-detail-page"><button className="booking-detail-back" onClick={close}><FaArrowLeft /> Back to all bookings</button><article className="booking-detail-card"><header><p>{booking.reference}</p><h2>{booking.project_name}</h2><span>Submitted {new Date(booking.created_at).toLocaleString()}</span></header><div className="booking-detail-status"><label>Status<select value={booking.status} onChange={event => { updateStatus(booking.id, event.target.value); close() }}>{statuses.map(status => <option value={status} key={status}>{status.replaceAll('_',' ')}</option>)}</select></label></div><section className="quotation-panel"><div><p>Quotation</p><h3>Upload and send to client</h3><span>The booking will be marked as quoted when the document is uploaded.</span></div><form onSubmit={sendQuotation}><label>Quotation document · PDF, DOC or DOCX · maximum 4 MB<input required type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event=>setQuotation(event.target.files?.[0]||null)}/></label><button className="dashboard-primary" disabled={sending}>{sending?'Sending…':'Upload & send quotation'}</button></form>{booking.quotation_file_name&&<a className="quotation-download" href={`${import.meta.env.VITE_API_URL||'/api'}/admin/bookings/${booking.id}/quotation`}>Download current quotation: {booking.quotation_file_name}</a>}</section><dl className="booking-detail-grid">{detail('Client',booking.client_name)}{detail('Email',booking.email)}{detail('Phone',booking.phone)}{detail('Company',booking.company)}{detail('Project type',booking.project_type?.replace('-', ' '))}{detail('Services',booking.services?.join(', '),true)}{detail('From date',booking.event_date)}{detail('To date',booking.event_end_date)}{detail('Start time',booking.start_time)}{detail('End time',booking.end_time)}{detail('Location',booking.location,true)}{detail('Delivery deadline',booking.delivery_deadline)}{detail('Package or option',booking.package_choice)}{detail('Estimated budget',booking.estimated_budget)}{detail('Project brief',booking.brief,true)}{detail('Custom requirements',booking.custom_requirements,true)}{detail('Additional notes',booking.notes,true)}</dl></article></section>
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
    setForm(type === 'work' ? { ...item, categories: item.categories?.[0] || 'Photography' } : { ...item })
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
    {type === 'team' || type === 'partners' ? <label className="dashboard-file-field">{type === 'team' ? 'Team photo' : 'Partner logo'}<input required={type === 'team' ? !form.photo_url : !form.logo_url} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" onChange={event => setImageFile(event.target.files?.[0] || null)} /><small>{imageFile ? imageFile.name : (form.photo_url || form.logo_url) ? 'Choose a file only when replacing the current image.' : 'JPG, PNG, WebP, GIF or SVG · maximum 4 MB'}</small></label> : <label>Image URL<input required name="image_url" value={form.image_url} onChange={update} /></label>}
    {type === 'work' && <><label>External project or album URL<input required type="url" name="external_url" value={form.external_url} onChange={update} /></label><label>Video link <small>For AV Production &amp; Livestreaming or Videography &amp; Documentaries. YouTube and Vimeo links are supported.</small><input type="url" name="video_url" value={form.video_url || ''} onChange={update} placeholder="https://www.youtube.com/watch?v=..." /></label><label>Category<select required name="categories" value={form.categories} onChange={update}>{workCategories.map(category => <option key={category.title} value={category.title}>{category.title}</option>)}</select></label></>}
    {type === 'partners' && <label className="check-field"><input type="checkbox" name="knockout" checked={form.knockout} onChange={update} /> Use knockout treatment</label>}
    <label>Display order<input type="number" name="sort_order" value={form.sort_order} onChange={update} /></label>
    <label className="check-field"><input type="checkbox" name="active" checked={form.active} onChange={update} /> Visible on website</label>
    <div className="content-form-actions"><button className="dashboard-primary">Save</button><button type="button" onClick={cancel}>Cancel</button></div>
  </form>
}

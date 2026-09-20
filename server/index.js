import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { clearSession, createSession, readSession, requireAdmin, requireAuth, requireStaff } from './auth.js'
import { databaseConfigured, pool, query } from './database.js'
import { sendBookingEmails } from './mailer.js'

export const app = express()
const port = Number(process.env.PORT || 8787)
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(v => v.trim())
const bookingUpload = multer({ storage: multer.memoryStorage(), limits: { files: 5, fileSize: 4 * 1024 * 1024 } })
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: 4 * 1024 * 1024 } })
app.use(cors({ origin: origins, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_req, res) => {
  if (!databaseConfigured) return res.status(503).json({ ok: false, error: 'Database is not configured.' })
  try { await query('select 1'); res.json({ ok: true, database: 'aiven-mysql' }) } catch { res.status(503).json({ ok: false, error: 'Database is unavailable.' }) }
})

app.post('/api/auth/login', async (req,res) => {
  const users=await query('select id,email,password_hash,full_name,role from users where email=? limit 1',[req.body.email?.trim().toLowerCase()])
  if (!users.length || !await bcrypt.compare(req.body.password||'',users[0].password_hash)) return res.status(401).json({ error:'Incorrect email or password.' })
  const { password_hash:_hash,...user }=users[0]; createSession(res,user); res.json({ user })
})
app.get('/api/auth/session', async (req,res) => {
  const session=readSession(req); if (!session) return res.status(401).json({ user:null })
  const users=await query('select id,email,full_name,role from users where id=? limit 1',[session.sub]); if (!users.length) return res.status(401).json({ user:null })
  res.json({ user:users[0] })
})
app.post('/api/auth/logout',(_req,res)=>{ clearSession(res); res.status(204).end() })
app.post('/api/auth/reset-password',(_req,res)=>res.status(501).json({ error:'Password reset email delivery is not configured yet. Contact an administrator.' }))

app.get('/api/content', async (_req,res) => {
  const [team,partners,work]=await Promise.all([query('select * from website_team where active=true order by sort_order,id'),query('select * from website_partners where active=true order by sort_order,id'),query('select * from website_work where active=true order by sort_order,id')])
  res.json({ team:team.map(teamRow),partners:partners.map(boolRow),work:work.map(workRow) })
})
app.get('/api/media/:id', async (req,res) => {
  const rows=await query('select mime_type,contents from media where id=? limit 1',[req.params.id]); if (!rows.length) return res.status(404).end()
  res.set('Content-Type',rows[0].mime_type).set('Cache-Control','public, max-age=31536000, immutable').send(rows[0].contents)
})

app.get('/api/ticketing/events',async (_req,res)=>{
  const events=await query(`select e.id,e.title,e.description,e.venue,e.starts_at,e.ends_at,e.capacity,e.registration_deadline,e.registration_fields,o.organization_name,
    (select count(*) from event_attendees a where a.event_id=e.id and a.status<>'cancelled') registered
    from ticketing_events e join organizer_accounts o on o.id=e.organizer_id where e.status='published' and e.starts_at>=now() order by e.starts_at`)
  res.json({events:events.map(ticketingEventRow)})
})
app.get('/api/ticketing/events/:id',async (req,res)=>{
  const rows=await query(`select e.*,o.organization_name,(select count(*) from event_attendees a where a.event_id=e.id and a.status<>'cancelled') registered from ticketing_events e join organizer_accounts o on o.id=e.organizer_id where e.id=? and e.status='published' limit 1`,[req.params.id])
  if(!rows.length)return res.status(404).json({error:'Event not found.'});res.json({event:ticketingEventRow(rows[0])})
})
app.post('/api/ticketing/events/:id/register',async (req,res)=>{
  const name=req.body.fullName?.trim(),email=req.body.email?.trim().toLowerCase();if(!name||!email)return res.status(400).json({error:'Full name and email are required.'})
  const connection=await pool.getConnection()
  try{await connection.beginTransaction();const [events]=await connection.execute("select id,title,capacity,status,starts_at,registration_deadline,registration_fields from ticketing_events where id=? for update",[req.params.id]);if(!events.length||events[0].status!=='published')throw publicError('Registration is not available.',400)
    if(events[0].registration_deadline&&new Date(events[0].registration_deadline)<new Date())throw publicError('Registration has closed.',400)
    const registrationFields=jsonValue(events[0].registration_fields),submittedData=req.body.registrationData&&typeof req.body.registrationData==='object'?req.body.registrationData:{},registrationData=Object.fromEntries(registrationFields.map(field=>[field.id,field.type==='checkbox'?Boolean(submittedData[field.id]):String(submittedData[field.id]??'').trim().slice(0,2000)]))
    const missingFields=registrationFields.filter(field=>field.required&&(field.type==='checkbox'?!registrationData[field.id]:!registrationData[field.id])).map(field=>field.label);if(missingFields.length)throw publicError(`Please complete: ${missingFields.join(', ')}.`,400)
    const [[count]]=await connection.execute("select count(*) total from event_attendees where event_id=? and status<>'cancelled'",[req.params.id]);if(count.total>=events[0].capacity)throw publicError('This event has reached its capacity.',409)
    const id=randomUUID(),qrToken=randomUUID().replaceAll('-','')+randomUUID().slice(0,8),ticketCode=`LE-T-${randomUUID().slice(0,8).toUpperCase()}`
    await connection.execute('insert into event_attendees (id,event_id,ticket_code,qr_token,full_name,email,phone,registration_data) values (?,?,?,?,?,?,?,?)',[id,req.params.id,ticketCode,qrToken,name,email,empty(req.body.phone),JSON.stringify(registrationData)])
    await connection.commit();res.status(201).json({ticket:{ticketCode,qrToken,fullName:name,eventTitle:events[0].title,startsAt:events[0].starts_at}})
  }catch(error){await connection.rollback();if(error.code==='ER_DUP_ENTRY')return res.status(409).json({error:'This email is already registered for the event.'});if(error.public)return res.status(error.status).json({error:error.message});throw error}finally{connection.release()}
})
app.get('/api/ticketing/tickets/:token',async (req,res)=>{
  const rows=await query(`select a.ticket_code,a.full_name,a.status,e.title,e.venue,e.starts_at from event_attendees a join ticketing_events e on e.id=a.event_id where a.qr_token=? limit 1`,[req.params.token]);if(!rows.length)return res.status(404).json({error:'Ticket not found.'});res.json({ticket:rows[0]})
})

app.get('/api/ticketing/organizer',requireAuth,async (req,res)=>{
  const rows=await query('select * from organizer_accounts where user_id=? limit 1',[req.user.sub]);res.json({organizer:rows[0]||null})
})
app.post('/api/ticketing/organizer/apply',requireAuth,async (req,res)=>{
  if(!req.body.organizationName?.trim())return res.status(400).json({error:'Organization name is required.'})
  if((await query('select id from organizer_accounts where user_id=? limit 1',[req.user.sub])).length)return res.status(409).json({error:'An organizer application already exists.'})
  await query('insert into organizer_accounts (id,user_id,organization_name,phone,reason) values (?,?,?,?,?)',[randomUUID(),req.user.sub,req.body.organizationName.trim(),empty(req.body.phone),empty(req.body.reason)]);res.status(201).json({ok:true})
})
app.get('/api/ticketing/organizer/events',requireAuth,approvedOrganizer,async (req,res)=>{
  const events=await query(`select e.*,(select count(*) from event_attendees a where a.event_id=e.id and a.status<>'cancelled') registered from ticketing_events e where e.organizer_id=? order by e.starts_at desc`,[req.organizer.id]);res.json({events:events.map(ticketingEventRow)})
})
app.post('/api/ticketing/organizer/events',requireAuth,approvedOrganizer,async (req,res)=>{
  if(!req.body.title?.trim()||!req.body.venue?.trim()||!req.body.startsAt||Number(req.body.capacity)<1)return res.status(400).json({error:'Title, venue, date and a valid capacity are required.'})
  const registrationFields=normalizeRegistrationFields(req.body.registrationFields)
  const id=randomUUID();await query('insert into ticketing_events (id,organizer_id,title,description,venue,starts_at,ends_at,capacity,registration_deadline,registration_fields,status) values (?,?,?,?,?,?,?,?,?,?,?)',[id,req.organizer.id,req.body.title.trim(),empty(req.body.description),req.body.venue.trim(),req.body.startsAt,empty(req.body.endsAt),Number(req.body.capacity),empty(req.body.registrationDeadline),JSON.stringify(registrationFields),req.body.publish?'published':'draft']);res.status(201).json({id})
})
app.get('/api/ticketing/organizer/events/:id/attendees',requireAuth,approvedOrganizer,organizerEvent,async (req,res)=>{
  const attendees=await query('select id,ticket_code,qr_token,full_name,email,phone,registration_data,status,checked_in_at,created_at from event_attendees where event_id=? order by full_name',[req.params.id]);res.json({event:ticketingEventRow(req.event),attendees:attendees.map(attendeeRow)})
})
app.post('/api/ticketing/organizer/events/:id/check-in',requireAuth,approvedOrganizer,organizerEvent,async (req,res)=>{
  const search=req.body.query?.trim();if(!search)return res.status(400).json({error:'Enter a guest name, ticket code or QR value.'})
  const rows=await query('select * from event_attendees where event_id=? and (qr_token=? or ticket_code=? or lower(full_name)=lower(?)) limit 1',[req.params.id,search,search,search]);if(!rows.length)return res.status(404).json({error:'Guest not found.'})
  const guest=rows[0];if(guest.status==='cancelled')return res.status(409).json({error:'This registration was cancelled.'});if(guest.status==='checked_in')return res.status(409).json({error:`${guest.full_name} already entered.`})
  await query("update event_attendees set status='checked_in',checked_in_at=now(),checked_in_by=? where id=?",[req.user.sub,guest.id]);res.json({guest:{...guest,status:'checked_in'}})
})

app.get('/api/admin/ticketing',requireAdmin,async (_req,res)=>{
  const [organizers,events]=await Promise.all([query(`select o.*,u.email,u.full_name from organizer_accounts o join users u on u.id=o.user_id order by o.created_at desc`),query(`select e.*,o.organization_name,(select count(*) from event_attendees a where a.event_id=e.id and a.status<>'cancelled') registered from ticketing_events e join organizer_accounts o on o.id=e.organizer_id order by e.created_at desc`)]);res.json({organizers,events})
})
app.patch('/api/admin/ticketing/organizers/:id',requireAdmin,async (req,res)=>{
  if(!['approved','rejected','suspended'].includes(req.body.status))return res.status(400).json({error:'Invalid approval status.'});await query('update organizer_accounts set status=?,reviewed_by=?,reviewed_at=now() where id=?',[req.body.status,req.user.sub,req.params.id]);res.json({ok:true})
})

app.post('/api/bookings',bookingUpload.array('references',5),async (req,res) => {
  const services=arrayValue(req.body.services), required=['clientName','phone','email','projectName','projectType','brief'], missing=required.filter(f=>!req.body[f]?.trim())
  if (!services.length) missing.push('services')
  if (req.body.projectType==='event' && (!req.body.eventDate||!req.body.startTime||!req.body.endTime||!req.body.location)) missing.push('event schedule')
  if (req.body.projectType==='non-event' && !req.body.deadline) missing.push('delivery deadline')
  if (missing.length) return res.status(400).json({ error:`Please complete: ${[...new Set(missing)].join(', ')}.` })
  const id=randomUUID(), reference=`LE-${new Date().getFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`, connection=await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute('insert into booking_requests (id,reference,client_name,phone,email,company,project_name,project_type,services,brief,event_date,start_time,end_time,location,delivery_deadline,package_choice,custom_requirements,estimated_budget,notes) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[id,reference,req.body.clientName.trim(),req.body.phone.trim(),req.body.email.trim().toLowerCase(),empty(req.body.company),req.body.projectName.trim(),req.body.projectType,JSON.stringify(services),req.body.brief.trim(),empty(req.body.eventDate),empty(req.body.startTime),empty(req.body.endTime),empty(req.body.location),empty(req.body.deadline),empty(req.body.packageChoice),empty(req.body.customRequirements),empty(req.body.budget),empty(req.body.notes)])
    for (const file of req.files||[]) await connection.execute('insert into booking_files (id,booking_id,original_name,mime_type,size_bytes,contents) values (?,?,?,?,?,?)',[randomUUID(),id,file.originalname,file.mimetype,file.size,file.buffer])
    await connection.commit()
    const email=await sendBookingEmails({reference,clientName:req.body.clientName.trim(),phone:req.body.phone.trim(),email:req.body.email.trim().toLowerCase(),projectName:req.body.projectName.trim(),projectType:req.body.projectType,services,brief:req.body.brief.trim(),eventDate:req.body.eventDate,startTime:req.body.startTime,endTime:req.body.endTime,location:req.body.location,deadline:req.body.deadline})
    res.status(201).json({ reference, emailSent:email.sent })
  } catch(error) { await connection.rollback(); throw error } finally { connection.release() }
})

app.get('/api/admin/dashboard',requireStaff,async (_req,res) => {
  const [bookings,team,partners,work]=await Promise.all([query('select * from booking_requests order by created_at desc'),query('select * from website_team order by sort_order,id'),query('select * from website_partners order by sort_order,id'),query('select * from website_work order by sort_order,id')])
  res.json({ bookings:bookings.map(bookingRow),team:team.map(teamRow),partners:partners.map(boolRow),work:work.map(workRow) })
})
app.patch('/api/admin/bookings/:id/status',requireStaff,async (req,res) => {
  const allowed=['submitted','under_review','quoted','contract_sent','deposit_pending','confirmed','in_production','client_review','completed','cancelled']
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error:'Invalid booking status.' })
  await query('update booking_requests set status=? where id=?',[req.body.status,req.params.id]); res.json({ ok:true })
})
app.get('/api/admin/users',requireAdmin,async (_req,res)=>res.json({ users:await query('select id,email,full_name,role,created_at from users order by created_at desc') }))
app.post('/api/admin/users',requireAdmin,async (req,res)=>{
  const email=req.body.email?.trim().toLowerCase(),password=req.body.password,role=['client','staff','admin'].includes(req.body.role)?req.body.role:'client'
  if(!email||!password||password.length<8)return res.status(400).json({error:'A valid email and an 8-character password are required.'})
  if((await query('select id from users where email=? limit 1',[email])).length)return res.status(409).json({error:'An account with this email already exists.'})
  await query('insert into users (id,email,password_hash,full_name,role) values (?,?,?,?,?)',[randomUUID(),email,await bcrypt.hash(password,12),req.body.fullName?.trim()||null,role])
  res.status(201).json({ok:true})
})
app.post('/api/admin/content/:type',requireStaff,imageUpload.single('image'),contentHandler('insert'))
app.put('/api/admin/content/:type/:id',requireStaff,imageUpload.single('image'),contentHandler('update'))
app.delete('/api/admin/content/:type/:id',requireStaff,async (req,res) => { const table=contentTable(req.params.type); if (!table) return res.status(404).json({ error:'Unknown content type.' }); await query(`delete from ${table} where id=?`,[req.params.id]); res.status(204).end() })

function contentHandler(operation) { return async (req,res) => {
  const table=contentTable(req.params.type); if (!table) return res.status(404).json({ error:'Unknown content type.' })
  const b=req.body; let photoUrl=b.photo_url||null,mediaId=null
  if (req.file) { if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error:'Please select an image file.' }); mediaId=randomUUID(); await query('insert into media (id,file_name,mime_type,size_bytes,contents) values (?,?,?,?,?)',[mediaId,req.file.originalname,req.file.mimetype,req.file.size,req.file.buffer]); photoUrl=`/api/media/${mediaId}` }
  if (req.params.type==='team') {
    if (!b.name || (!photoUrl&&operation==='insert')) return res.status(400).json({ error:'Name and photo are required.' })
    if (operation==='insert') await query('insert into website_team (id,name,role,photo_media_id,photo_url,sort_order,active) values (?,?,?,?,?,?,?)',[randomUUID(),b.name,b.role||'',mediaId,photoUrl,Number(b.sort_order)||0,toBool(b.active)])
    else await query('update website_team set name=?,role=?,photo_media_id=coalesce(?,photo_media_id),photo_url=coalesce(?,photo_url),sort_order=?,active=? where id=?',[b.name,b.role||'',mediaId,photoUrl,Number(b.sort_order)||0,toBool(b.active),req.params.id])
  } else if (req.params.type==='partners') {
    const values=[b.name,b.logo_url,toBool(b.knockout),Number(b.sort_order)||0,toBool(b.active)]
    if (operation==='insert') await query('insert into website_partners (id,name,logo_url,knockout,sort_order,active) values (?,?,?,?,?,?)',[randomUUID(),...values]); else await query('update website_partners set name=?,logo_url=?,knockout=?,sort_order=?,active=? where id=?',[...values,req.params.id])
  } else {
    const values=[b.title,b.external_url,b.image_url,JSON.stringify(arrayValue(b.categories)),Number(b.sort_order)||0,toBool(b.active)]
    if (operation==='insert') await query('insert into website_work (id,title,external_url,image_url,categories,sort_order,active) values (?,?,?,?,?,?,?)',[randomUUID(),...values]); else await query('update website_work set title=?,external_url=?,image_url=?,categories=?,sort_order=?,active=? where id=?',[...values,req.params.id])
  }
  res.status(operation==='insert'?201:200).json({ ok:true })
} }

app.use((error,_req,res,_next)=>{ console.error(error); if (error instanceof multer.MulterError) return res.status(400).json({ error:error.code==='LIMIT_FILE_SIZE'?'Files must be 4 MB or smaller.':error.message }); res.status(500).json({ error:'Unexpected server error.' }) })
if (process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url) app.listen(port,()=>console.log(`Lions API listening on http://localhost:${port}`))
export default app

function contentTable(type){ return ({team:'website_team',partners:'website_partners',work:'website_work'})[type] }
function empty(value){ return value?.trim()||null }
function toBool(value){ return value===true||value==='true'||value==='1'?1:0 }
function arrayValue(value){ if(Array.isArray(value))return value; try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[]}catch{return typeof value==='string'?value.split(',').map(v=>v.trim()).filter(Boolean):[]} }
function jsonValue(value){ if(Array.isArray(value))return value;try{return JSON.parse(value||'[]')}catch{return[]} }
function boolRow(row){return{...row,active:Boolean(row.active),knockout:Boolean(row.knockout)}}
function teamRow(row){return{...row,active:Boolean(row.active)}}
function workRow(row){return{...row,active:Boolean(row.active),categories:jsonValue(row.categories)}}
function bookingRow(row){return{...row,services:jsonValue(row.services)}}
function ticketingEventRow(row){return{...row,registration_fields:jsonValue(row.registration_fields)}}
function attendeeRow(row){return{...row,registration_data:jsonObject(row.registration_data)}}
function jsonObject(value){if(value&&typeof value==='object'&&!Array.isArray(value))return value;try{const parsed=JSON.parse(value||'{}');return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{}}catch{return{}}}
function normalizeRegistrationFields(value){const fields=Array.isArray(value)?value:[];return fields.slice(0,20).map((field,index)=>({id:String(field.id||`field_${index+1}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50),label:String(field.label||'').trim().slice(0,120),type:['text','email','tel','number','date','select','textarea','checkbox'].includes(field.type)?field.type:'text',required:Boolean(field.required),options:field.type==='select'&&Array.isArray(field.options)?field.options.map(option=>String(option).trim()).filter(Boolean).slice(0,30):[]})).filter(field=>field.id&&field.label)}
async function approvedOrganizer(req,res,next){const rows=await query("select * from organizer_accounts where user_id=? and status='approved' limit 1",[req.user.sub]);if(!rows.length)return res.status(403).json({error:'Your organizer account has not been approved.'});req.organizer=rows[0];next()}
async function organizerEvent(req,res,next){const rows=await query('select * from ticketing_events where id=? and organizer_id=? limit 1',[req.params.id,req.organizer.id]);if(!rows.length)return res.status(404).json({error:'Event not found.'});req.event=rows[0];next()}
function publicError(message,status){const error=new Error(message);error.public=true;error.status=status;return error}

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { clearSession, createSession, readSession, requireStaff } from './auth.js'
import { databaseConfigured, pool, query } from './database.js'

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

app.post('/api/auth/register', async (req, res) => {
  const email=req.body.email?.trim().toLowerCase(), password=req.body.password
  if (!email || !password || password.length<8) return res.status(400).json({ error:'A valid email and an 8-character password are required.' })
  if ((await query('select id from users where email=? limit 1',[email])).length) return res.status(409).json({ error:'An account with this email already exists.' })
  const id=randomUUID(), role=process.env.ADMIN_EMAIL?.trim().toLowerCase()===email?'admin':'client'
  await query('insert into users (id,email,password_hash,full_name,role) values (?,?,?,?,?)',[id,email,await bcrypt.hash(password,12),req.body.fullName?.trim()||null,role])
  const user={ id,email,full_name:req.body.fullName?.trim()||null,role }; createSession(res,user); res.status(201).json({ user })
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
    await connection.commit(); res.status(201).json({ reference })
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

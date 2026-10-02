import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { clearSession, createSession, readSession, requireAdmin, requireAuth } from './auth.js'
import { databaseConfigured, pool, query } from './database.js'
import { sendAccountInvitation, sendBookingEmails, sendPasswordResetEmail, sendQuotationEmail } from './mailer.js'

export const app = express()
const port = Number(process.env.PORT || 8787)
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(v => v.trim())
const bookingUpload = multer({ storage: multer.memoryStorage(), limits: { files: 5, fileSize: 4 * 1024 * 1024 } })
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: 4 * 1024 * 1024 } })
const quotationUpload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: 4 * 1024 * 1024 } })
app.use(cors({ origin: origins, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_req, res) => {
  if (!databaseConfigured) return res.status(503).json({ ok: false, error: 'Database is not configured.' })
  try { await query('select 1'); res.json({ ok: true, database: 'mysql' }) } catch { res.status(503).json({ ok: false, error: 'Database is unavailable.' }) }
})

app.post('/api/auth/login', async (req,res) => {
  const users=await query('select id,email,password_hash,full_name,role,must_change_password,active from users where email=? limit 1',[req.body.email?.trim().toLowerCase()])
  if (!users.length || !users[0].active || !await bcrypt.compare(req.body.password||'',users[0].password_hash)) return res.status(401).json({ error:'Incorrect email or password.' })
  const { password_hash:_hash,...user }=users[0]; createSession(res,user); res.json({ user })
})
app.post('/api/auth/forgot-password', async (req,res) => {
  const email=req.body.email?.trim().toLowerCase()
  const response={message:'If an active account exists for that email, a password reset link has been sent.'}
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.json(response)
  const users=await query("select id,email from users where email=? and active=true and role='admin' limit 1",[email])
  if(!users.length)return res.json(response)
  const token=randomBytes(32).toString('base64url'),tokenHash=createHash('sha256').update(token).digest('hex')
  await query('delete from password_reset_tokens where user_id=? or expires_at<now()',[users[0].id])
  await query('insert into password_reset_tokens (id,user_id,token_hash,expires_at) values (?,?,?,date_add(now(),interval 1 hour))',[randomUUID(),users[0].id,tokenHash])
  const delivery=await sendPasswordResetEmail({email:users[0].email,token})
  if(!delivery.sent)await query('delete from password_reset_tokens where token_hash=?',[tokenHash])
  res.json(response)
})
app.post('/api/auth/reset-password', async (req,res) => {
  const token=req.body.token||'',newPassword=req.body.newPassword||''
  if(!token)return res.status(400).json({error:'This password reset link is invalid.'})
  if(newPassword.length<10)return res.status(400).json({error:'Your new password must contain at least 10 characters.'})
  const tokenHash=createHash('sha256').update(token).digest('hex')
  const rows=await query(`select pr.id token_id,u.id user_id from password_reset_tokens pr join users u on u.id=pr.user_id where pr.token_hash=? and pr.used_at is null and pr.expires_at>now() and u.active=true and u.role='admin' limit 1`,[tokenHash])
  if(!rows.length)return res.status(400).json({error:'This password reset link is invalid or has expired.'})
  const claimed=await query('update password_reset_tokens set used_at=now() where id=? and used_at is null',[rows[0].token_id])
  if(!claimed.affectedRows)return res.status(400).json({error:'This password reset link has already been used.'})
  await query('update users set password_hash=?,must_change_password=false where id=?',[await bcrypt.hash(newPassword,12),rows[0].user_id])
  clearSession(res)
  res.json({message:'Your password has been reset. You can now sign in.'})
})
app.get('/api/auth/session', async (req,res) => {
  const session=readSession(req); if (!session) return res.status(401).json({ user:null })
  const users=await query('select id,email,full_name,role,must_change_password,active from users where id=? limit 1',[session.sub]); if (!users.length || !users[0].active) return res.status(401).json({ user:null })
  res.json({ user:users[0] })
})
app.post('/api/auth/logout',(_req,res)=>{ clearSession(res); res.status(204).end() })
app.patch('/api/account',requireAuth,async(req,res)=>{
  const fullName=req.body.fullName?.trim(),currentPassword=req.body.currentPassword||'',newPassword=req.body.newPassword||''
  if(!fullName)return res.status(400).json({error:'Your full name is required.'})
  if(newPassword.length<10)return res.status(400).json({error:'Your new password must contain at least 10 characters.'})
  const users=await query('select id,email,password_hash,role from users where id=? and active=true limit 1',[req.user.sub])
  if(!users.length||!await bcrypt.compare(currentPassword,users[0].password_hash))return res.status(401).json({error:'Your current password is incorrect.'})
  await query('update users set full_name=?,password_hash=?,must_change_password=false where id=?',[fullName,await bcrypt.hash(newPassword,12),req.user.sub])
  const user={id:users[0].id,email:users[0].email,full_name:fullName,role:users[0].role,must_change_password:0,active:1}
  createSession(res,user);res.json({user})
})

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
  if (req.body.projectType==='event' && (!req.body.eventDateFrom||!req.body.eventDateTo||!req.body.startTime||!req.body.endTime||!req.body.location)) missing.push('event schedule')
  if (req.body.projectType==='event' && req.body.eventDateFrom && req.body.eventDateTo && req.body.eventDateTo<req.body.eventDateFrom) return res.status(400).json({error:'The event To date cannot be before the From date.'})
  if (req.body.projectType==='non-event' && !req.body.deadline) missing.push('delivery deadline')
  if (missing.length) return res.status(400).json({ error:`Please complete: ${[...new Set(missing)].join(', ')}.` })
  const id=randomUUID(), reference=`LE-${new Date().getFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`, connection=await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute('insert into booking_requests (id,reference,client_name,phone,email,company,project_name,project_type,services,brief,event_date,event_end_date,start_time,end_time,location,delivery_deadline,package_choice,custom_requirements,estimated_budget,notes) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[id,reference,req.body.clientName.trim(),req.body.phone.trim(),req.body.email.trim().toLowerCase(),empty(req.body.company),req.body.projectName.trim(),req.body.projectType,JSON.stringify(services),req.body.brief.trim(),empty(req.body.eventDateFrom),empty(req.body.eventDateTo),empty(req.body.startTime),empty(req.body.endTime),empty(req.body.location),empty(req.body.deadline),empty(req.body.packageChoice),empty(req.body.customRequirements),empty(req.body.budget),empty(req.body.notes)])
    for (const file of req.files||[]) await connection.execute('insert into booking_files (id,booking_id,original_name,mime_type,size_bytes,contents) values (?,?,?,?,?,?)',[randomUUID(),id,file.originalname,file.mimetype,file.size,file.buffer])
    await connection.commit()
    const email=await sendBookingEmails({reference,clientName:req.body.clientName.trim(),phone:req.body.phone.trim(),email:req.body.email.trim().toLowerCase(),projectName:req.body.projectName.trim(),projectType:req.body.projectType,services,brief:req.body.brief.trim(),eventDateFrom:req.body.eventDateFrom,eventDateTo:req.body.eventDateTo,startTime:req.body.startTime,endTime:req.body.endTime,location:req.body.location,deadline:req.body.deadline})
    res.status(201).json({ reference, emailSent:email.sent })
  } catch(error) { await connection.rollback(); throw error } finally { connection.release() }
})

app.get('/api/admin/dashboard',requireAdmin,async (_req,res) => {
  const [bookings,team,partners,work]=await Promise.all([query('select b.*,q.file_name quotation_file_name,q.sent_at quotation_sent_at from booking_requests b left join booking_quotations q on q.booking_id=b.id order by b.created_at desc'),query('select * from website_team order by sort_order,id'),query('select * from website_partners order by sort_order,id'),query('select * from website_work order by sort_order,id')])
  res.json({ bookings:bookings.map(bookingRow),team:team.map(teamRow),partners:partners.map(boolRow),work:work.map(workRow) })
})
app.patch('/api/admin/bookings/:id/status',requireAdmin,async (req,res) => {
  const allowed=['submitted','under_review','quoted','contract_sent','deposit_pending','confirmed','in_production','client_review','completed','cancelled']
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error:'Invalid booking status.' })
  await query('update booking_requests set status=? where id=?',[req.body.status,req.params.id]); res.json({ ok:true })
})
app.post('/api/admin/bookings/:id/quotation',requireAdmin,quotationUpload.single('quotation'),async (req,res)=>{
  if(!req.file)return res.status(400).json({error:'Choose a quotation document.'})
  const allowed=['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];if(!allowed.includes(req.file.mimetype))return res.status(400).json({error:'Quotation must be a PDF, DOC or DOCX file.'})
  const bookings=await query('select id,reference,client_name,email,project_name from booking_requests where id=? limit 1',[req.params.id]);if(!bookings.length)return res.status(404).json({error:'Booking not found.'})
  await query('insert into booking_quotations (booking_id,file_name,mime_type,size_bytes,contents,uploaded_by) values (?,?,?,?,?,?) on duplicate key update file_name=values(file_name),mime_type=values(mime_type),size_bytes=values(size_bytes),contents=values(contents),uploaded_by=values(uploaded_by),sent_at=null',[req.params.id,req.file.originalname,req.file.mimetype,req.file.size,req.file.buffer,req.user.sub])
  await query("update booking_requests set status='quoted' where id=?",[req.params.id])
  const email=await sendQuotationEmail(bookings[0],req.file);if(email.sent)await query('update booking_quotations set sent_at=now() where booking_id=?',[req.params.id])
  res.json({ok:true,emailSent:email.sent,fileName:req.file.originalname})
})
app.get('/api/admin/bookings/:id/quotation',requireAdmin,async (req,res)=>{
  const rows=await query('select file_name,mime_type,contents from booking_quotations where booking_id=? limit 1',[req.params.id]);if(!rows.length)return res.status(404).json({error:'Quotation not found.'})
  res.set('Content-Type',rows[0].mime_type).set('Content-Disposition',`attachment; filename="${rows[0].file_name.replace(/["\r\n]/g,'')}"`).send(rows[0].contents)
})
app.get('/api/admin/users',requireAdmin,async (_req,res)=>res.json({ users:await query('select id,email,full_name,role,must_change_password,active,created_at from users order by created_at desc') }))
app.post('/api/admin/users',requireAdmin,async (req,res)=>{
  const email=req.body.email?.trim().toLowerCase(),temporaryPassword=randomBytes(12).toString('base64url'),role='admin'
  if(!email||!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'A valid email address is required.'})
  if((await query('select id from users where email=? limit 1',[email])).length)return res.status(409).json({error:'An account with this email already exists.'})
  const id=randomUUID()
  await query('insert into users (id,email,password_hash,role,must_change_password,active) values (?,?,?,?,true,true)',[id,email,await bcrypt.hash(temporaryPassword,12),role])
  const delivery=await sendAccountInvitation({email,temporaryPassword})
  if(!delivery.sent){await query('delete from users where id=?',[id]);return res.status(502).json({error:'The invitation email could not be sent, so the account was not created.'})}
  res.status(201).json({ok:true})
})
app.patch('/api/admin/users/:id',requireAdmin,async(req,res)=>{
  const email=req.body.email?.trim().toLowerCase(),fullName=req.body.fullName?.trim()||null,active=toBool(req.body.active)
  if(!email||!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'A valid email address is required.'})
  if(req.params.id===req.user.sub&&!active)return res.status(400).json({error:'You cannot disable your own account.'})
  if(!active){const activeAdmins=await query("select count(*) count from users where role='admin' and active=true");if(Number(activeAdmins[0].count)<=1)return res.status(400).json({error:'At least one active administrator is required.'})}
  if((await query('select id from users where email=? and id<>? limit 1',[email,req.params.id])).length)return res.status(409).json({error:'Another account already uses this email.'})
  const result=await query('update users set email=?,full_name=?,active=? where id=?',[email,fullName,active,req.params.id])
  if(!result.affectedRows)return res.status(404).json({error:'User not found.'})
  res.json({ok:true})
})
app.post('/api/admin/users/:id/reset-password',requireAdmin,async(req,res)=>{
  if(req.params.id===req.user.sub)return res.status(400).json({error:'Use Account settings to change your own password.'})
  const users=await query('select id,email from users where id=? limit 1',[req.params.id]);if(!users.length)return res.status(404).json({error:'User not found.'})
  const temporaryPassword=randomBytes(12).toString('base64url'),delivery=await sendAccountInvitation({email:users[0].email,temporaryPassword,reset:true})
  if(!delivery.sent)return res.status(502).json({error:'The temporary password email could not be sent.'})
  await query('update users set password_hash=?,must_change_password=true,active=true where id=?',[await bcrypt.hash(temporaryPassword,12),req.params.id])
  res.json({ok:true})
})
app.delete('/api/admin/users/:id',requireAdmin,async(req,res)=>{
  if(req.params.id===req.user.sub)return res.status(400).json({error:'You cannot delete your own account.'})
  const users=await query('select active from users where id=? limit 1',[req.params.id]);if(!users.length)return res.status(404).json({error:'User not found.'})
  if(users[0].active){const activeAdmins=await query("select count(*) count from users where role='admin' and active=true");if(Number(activeAdmins[0].count)<=1)return res.status(400).json({error:'At least one active administrator is required.'})}
  const result=await query('delete from users where id=?',[req.params.id]);if(!result.affectedRows)return res.status(404).json({error:'User not found.'})
  res.status(204).end()
})
app.post('/api/admin/content/:type',requireAdmin,imageUpload.single('image'),contentHandler('insert'))
app.put('/api/admin/content/:type/:id',requireAdmin,imageUpload.single('image'),contentHandler('update'))
app.delete('/api/admin/content/:type/:id',requireAdmin,async (req,res) => { const table=contentTable(req.params.type); if (!table) return res.status(404).json({ error:'Unknown content type.' }); await query(`delete from ${table} where id=?`,[req.params.id]); res.status(204).end() })

function contentHandler(operation) { return async (req,res) => {
  const table=contentTable(req.params.type); if (!table) return res.status(404).json({ error:'Unknown content type.' })
  const b=req.body; let photoUrl=b.photo_url||null,mediaId=null
  if (req.file) { if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error:'Please select an image file.' }); mediaId=randomUUID(); await query('insert into media (id,file_name,mime_type,size_bytes,contents) values (?,?,?,?,?)',[mediaId,req.file.originalname,req.file.mimetype,req.file.size,req.file.buffer]); photoUrl=`/api/media/${mediaId}` }
  if (req.params.type==='team') {
    if (!b.name || (!photoUrl&&operation==='insert')) return res.status(400).json({ error:'Name and photo are required.' })
    if (operation==='insert') await query('insert into website_team (id,name,role,photo_media_id,photo_url,sort_order,active) values (?,?,?,?,?,?,?)',[randomUUID(),b.name,b.role||'',mediaId,photoUrl,Number(b.sort_order)||0,toBool(b.active)])
    else await query('update website_team set name=?,role=?,photo_media_id=coalesce(?,photo_media_id),photo_url=coalesce(?,photo_url),sort_order=?,active=? where id=?',[b.name,b.role||'',mediaId,photoUrl,Number(b.sort_order)||0,toBool(b.active),req.params.id])
  } else if (req.params.type==='partners') {
    if(!b.name||(!photoUrl&&operation==='insert'))return res.status(400).json({error:'Name and logo are required.'})
    if (operation==='insert') await query('insert into website_partners (id,name,logo_url,knockout,sort_order,active) values (?,?,?,?,?,?)',[randomUUID(),b.name,photoUrl,toBool(b.knockout),Number(b.sort_order)||0,toBool(b.active)]); else await query('update website_partners set name=?,logo_url=coalesce(?,logo_url),knockout=?,sort_order=?,active=? where id=?',[b.name,photoUrl,toBool(b.knockout),Number(b.sort_order)||0,toBool(b.active),req.params.id])
  } else {
    const values=[b.title,b.external_url,b.image_url,empty(b.video_url),JSON.stringify(arrayValue(b.categories)),Number(b.sort_order)||0,toBool(b.active)]
    if (operation==='insert') await query('insert into website_work (id,title,external_url,image_url,video_url,categories,sort_order,active) values (?,?,?,?,?,?,?,?)',[randomUUID(),...values]); else await query('update website_work set title=?,external_url=?,image_url=?,video_url=?,categories=?,sort_order=?,active=? where id=?',[...values,req.params.id])
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

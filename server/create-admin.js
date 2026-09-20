import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { query, pool } from './database.js'

const email=process.env.ADMIN_EMAIL?.trim().toLowerCase(),password=process.env.ADMIN_PASSWORD
if(!email||!password||password.length<8)throw new Error('ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters are required.')
const existing=await query('select id from users where email=? limit 1',[email])
if(existing.length)await query('update users set password_hash=?,role=? where id=?',[await bcrypt.hash(password,12),'admin',existing[0].id])
else await query('insert into users (id,email,password_hash,role) values (?,?,?,?)',[randomUUID(),email,await bcrypt.hash(password,12),'admin'])
console.log(`Administrator ready: ${email}`)
await pool.end()

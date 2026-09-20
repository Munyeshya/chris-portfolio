import 'dotenv/config'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import mysql from 'mysql2/promise'

const connectionUri = process.env.AIVEN_MYSQL_URI || process.env.MYSQL_URL
if (!connectionUri) throw new Error('AIVEN_MYSQL_URI is required.')

const parsed = new URL(connectionUri)
const connection = await mysql.createConnection({ host:parsed.hostname,port:Number(parsed.port||3306),user:decodeURIComponent(parsed.username),password:decodeURIComponent(parsed.password),database:parsed.pathname.slice(1),ssl:{rejectUnauthorized:true},multipleStatements:true })
await connection.query('create table if not exists schema_migrations (name varchar(255) primary key, checksum char(64) not null, applied_at timestamp not null default current_timestamp)')
const directory = resolve('migrations/mysql')
const files = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()

for (const name of files) {
  const sql = await readFile(resolve(directory, name), 'utf8')
  const checksum = createHash('sha256').update(sql).digest('hex')
  const [existing] = await connection.execute('select checksum from schema_migrations where name=?', [name])
  if (existing.length) {
    if (existing[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`)
    continue
  }
  await connection.beginTransaction()
  try {
    await connection.query(sql)
    await connection.execute('insert into schema_migrations (name, checksum) values (?,?)', [name, checksum])
    await connection.commit()
    console.log(`Applied ${name}`)
  } catch (error) {
    await connection.rollback()
    throw error
  }
}
await connection.end()

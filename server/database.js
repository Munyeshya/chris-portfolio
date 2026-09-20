import mysql from 'mysql2/promise'

const connectionUri = process.env.AIVEN_MYSQL_URI || process.env.MYSQL_URL

export const databaseConfigured = Boolean(connectionUri)
export const mysqlConfig = databaseConfigured ? connectionConfig(connectionUri) : null
export const pool = databaseConfigured ? mysql.createPool({
  ...mysqlConfig,
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 6,
  queueLimit: 0,
  enableKeepAlive: true,
}) : null

export async function query(sql, values = []) {
  if (!pool) throw new Error('Database is not configured.')
  const [rows] = await pool.execute(sql, values)
  return rows
}

function connectionConfig(value) {
  const parsed = new URL(value)
  return { host: parsed.hostname, port: Number(parsed.port || 3306), user: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password), database: parsed.pathname.slice(1) }
}

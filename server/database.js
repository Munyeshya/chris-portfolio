import mysql from 'mysql2/promise'
import { mysqlConnectionConfig } from './mysql-config.js'

const connectionUri = process.env.AIVEN_MYSQL_URI || process.env.MYSQL_URL

export const databaseConfigured = Boolean(connectionUri)
export const mysqlConfig = databaseConfigured ? mysqlConnectionConfig(connectionUri) : null
export const pool = databaseConfigured ? mysql.createPool({
  ...mysqlConfig,
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

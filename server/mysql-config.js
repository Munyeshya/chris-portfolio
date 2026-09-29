export function mysqlConnectionConfig(connectionUri) {
  const parsed = new URL(connectionUri)
  const ca = getCaCertificate()
  const sslMode = parsed.searchParams.get('ssl-mode')?.toLowerCase()
  const sslRequired = ['required', 'verify-ca', 'verify-identity'].includes(sslMode)
  const config = {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
  }

  if (ca) config.ssl = { ca, rejectUnauthorized: true }
  else if (sslRequired) config.ssl = { rejectUnauthorized: true }

  return config
}

function getCaCertificate() {
  if (process.env.MYSQL_CA_CERT_BASE64) return Buffer.from(process.env.MYSQL_CA_CERT_BASE64.trim(), 'base64').toString('utf8')
  if (process.env.MYSQL_CA_CERT) return process.env.MYSQL_CA_CERT.replace(/\\n/g, '\n')
  return null
}

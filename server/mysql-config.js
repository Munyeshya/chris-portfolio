export function mysqlConnectionConfig(connectionUri) {
  const parsed = new URL(connectionUri)
  const ca = getCaCertificate()
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true },
  }
}

function getCaCertificate() {
  if (process.env.AIVEN_CA_CERT_BASE64) return Buffer.from(process.env.AIVEN_CA_CERT_BASE64.trim(), 'base64').toString('utf8')
  if (process.env.AIVEN_CA_CERT) return process.env.AIVEN_CA_CERT.replace(/\\n/g, '\n')
  return null
}

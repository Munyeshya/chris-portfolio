import jwt from 'jsonwebtoken'
import { query } from './database.js'

const cookieName = 'lions_session'
const secret = process.env.JWT_SECRET

export function createSession(response, user) {
  if (!secret) throw new Error('JWT_SECRET is not configured.')
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, secret, { expiresIn: '7d' })
  response.cookie(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' })
}

export function clearSession(response) {
  response.clearCookie(cookieName, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
}

export function readSession(request) {
  if (!secret || !request.cookies?.[cookieName]) return null
  try { return jwt.verify(request.cookies[cookieName], secret) } catch { return null }
}

export function requireAuth(request, response, next) {
  const session = readSession(request)
  if (!session) return response.status(401).json({ error: 'Authentication required.' })
  request.user = session
  next()
}

export async function requireAdmin(request, response, next) {
  const session = readSession(request)
  if (!session) return response.status(401).json({ error: 'Authentication required.' })
  const users = await query('select role,active,must_change_password from users where id=? limit 1', [session.sub])
  if (!users.length || !users[0].active) return response.status(401).json({ error: 'This account is no longer active.' })
  if (users[0].role !== 'admin') return response.status(403).json({ error: 'Administrator access required.' })
  if (users[0].must_change_password) return response.status(403).json({ error: 'Complete your account setup before using the dashboard.' })
  request.user = session
  next()
}

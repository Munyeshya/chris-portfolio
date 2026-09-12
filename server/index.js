import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { supabase } from './supabase.js'

export const app = express()
const port = Number(process.env.PORT || 8787)
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(value => value.trim())
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 5, fileSize: 10 * 1024 * 1024 } })

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => response.json({ ok: true }))

app.post('/api/bookings', upload.array('references', 5), async (request, response) => {
  if (!supabase) return response.status(503).json({ error: 'Booking storage is not configured yet.' })

  const services = parseServices(request.body.services)
  const required = ['clientName', 'phone', 'email', 'projectName', 'projectType', 'brief']
  const missing = required.filter(field => !request.body[field]?.trim())
  if (services.length === 0) missing.push('services')
  if (request.body.projectType === 'event' && (!request.body.eventDate || !request.body.startTime || !request.body.endTime || !request.body.location)) missing.push('event schedule')
  if (request.body.projectType === 'non-event' && !request.body.deadline) missing.push('delivery deadline')
  if (missing.length) return response.status(400).json({ error: `Please complete: ${[...new Set(missing)].join(', ')}.` })

  const reference = `LE-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`
  const payload = {
    reference,
    client_name: request.body.clientName.trim(),
    phone: request.body.phone.trim(),
    email: request.body.email.trim().toLowerCase(),
    company: emptyToNull(request.body.company),
    project_name: request.body.projectName.trim(),
    project_type: request.body.projectType,
    services,
    brief: request.body.brief.trim(),
    event_date: emptyToNull(request.body.eventDate),
    start_time: emptyToNull(request.body.startTime),
    end_time: emptyToNull(request.body.endTime),
    location: emptyToNull(request.body.location),
    delivery_deadline: emptyToNull(request.body.deadline),
    package_choice: emptyToNull(request.body.packageChoice),
    custom_requirements: emptyToNull(request.body.customRequirements),
    estimated_budget: emptyToNull(request.body.budget),
    notes: emptyToNull(request.body.notes),
    status: 'submitted'
  }

  const { data: booking, error } = await supabase.from('booking_requests').insert(payload).select('id, reference').single()
  if (error) return response.status(500).json({ error: 'The booking request could not be saved.' })

  for (const file of request.files || []) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const objectPath = `${booking.id}/${randomUUID()}-${safeName}`
    const uploaded = await supabase.storage.from('booking-references').upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false })
    if (!uploaded.error) await supabase.from('booking_files').insert({ booking_id: booking.id, object_path: objectPath, original_name: file.originalname, mime_type: file.mimetype, size_bytes: file.size })
  }

  return response.status(201).json({ reference: booking.reference })
})

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) return response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Each file must be 10 MB or smaller.' : error.message })
  return response.status(500).json({ error: 'Unexpected server error.' })
})

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  app.listen(port, () => console.log(`Lions booking API listening on http://localhost:${port}`))
}

function parseServices(value) {
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [] } catch { return [] }
}

function emptyToNull(value) { return value?.trim() || null }

export default app

import 'dotenv/config'
import mysql from 'mysql2/promise'
import { mysqlConnectionConfig } from './mysql-config.js'

const connectionUri = process.env.AIVEN_MYSQL_URI || process.env.MYSQL_URL
if (!connectionUri) throw new Error('AIVEN_MYSQL_URI is required.')

const connection = await mysql.createConnection(mysqlConnectionConfig(connectionUri))

try {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const [admins] = adminEmail
    ? await connection.execute("select id,email from users where email=? and role='admin' limit 1", [adminEmail])
    : await connection.execute("select id,email from users where role='admin' order by created_at limit 1")
  if (!admins.length) throw new Error('No administrator account exists. Run npm run create-admin first.')

  await connection.beginTransaction()
  const [existingOrganizers] = await connection.execute('select id from organizer_accounts where user_id=? limit 1', [admins[0].id])
  const organizerId = existingOrganizers[0]?.id || '10000000-0000-4000-8000-000000000001'
  if (!existingOrganizers.length) {
    await connection.execute("insert into organizer_accounts (id,user_id,organization_name,phone,reason,status,reviewed_by,reviewed_at) values (?,?,?,'+250 788 000 000',?,'approved',?,now())", [organizerId, admins[0].id, 'Lions Entertainment', 'Official sample organizer account', admins[0].id])
  }

  const events = [
    ['20000000-0000-4000-8000-000000000001','Africa Creative Leaders Forum','A full-day gathering for creative, production and technology leaders.','Kigali Convention Centre','2027-03-20 09:00:00','2027-03-20 17:00:00',350,'2027-03-19 18:00:00'],
    ['20000000-0000-4000-8000-000000000002','Future of Live Events Meetup','An evening of conversations, demonstrations and industry networking.','Mundi Center, Kigali','2027-04-17 17:30:00','2027-04-17 21:00:00',120,'2027-04-17 12:00:00'],
    ['20000000-0000-4000-8000-000000000003','Production Masterclass','A practical session covering event production, broadcast and audience experience.','Lions Entertainment Studio','2027-05-08 10:00:00','2027-05-08 15:00:00',60,'2027-05-07 18:00:00'],
  ]
  for (const event of events) {
    await connection.execute("insert ignore into ticketing_events (id,organizer_id,title,description,venue,starts_at,ends_at,capacity,registration_deadline,status) values (?,?,?,?,?,?,?,?,?,'published')", [event[0], organizerId, ...event.slice(1)])
  }

  const attendees = [
    ['30000000-0000-4000-8000-000000000001',events[0][0],'LE-T-DEMO001','demo-qr-token-001','Aline Uwase','aline.demo@example.com','+250 788 111 001','registered'],
    ['30000000-0000-4000-8000-000000000002',events[0][0],'LE-T-DEMO002','demo-qr-token-002','Patrick Mugabo','patrick.demo@example.com','+250 788 111 002','checked_in'],
    ['30000000-0000-4000-8000-000000000003',events[1][0],'LE-T-DEMO003','demo-qr-token-003','Diane Ishimwe','diane.demo@example.com','+250 788 111 003','registered'],
    ['30000000-0000-4000-8000-000000000004',events[2][0],'LE-T-DEMO004','demo-qr-token-004','Eric Niyonsenga','eric.demo@example.com','+250 788 111 004','registered'],
  ]
  for (const attendee of attendees) {
    await connection.execute("insert ignore into event_attendees (id,event_id,ticket_code,qr_token,full_name,email,phone,status,checked_in_at,checked_in_by) values (?,?,?,?,?,?,?,?,if(?='checked_in',now(),null),if(?='checked_in',?,null))", [...attendee, attendee[7], attendee[7], admins[0].id])
  }
  await connection.commit()

  const [[counts]] = await connection.execute('select (select count(*) from organizer_accounts) organizers,(select count(*) from ticketing_events) events,(select count(*) from event_attendees) attendees')
  console.log(`Ticketing seed complete: ${counts.organizers} organizer(s), ${counts.events} event(s), ${counts.attendees} attendee(s).`)
} catch (error) {
  await connection.rollback().catch(() => {})
  throw error
} finally {
  await connection.end()
}

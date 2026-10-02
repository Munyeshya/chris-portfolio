import nodemailer from 'nodemailer'

const user = process.env.EMAIL_USER
const password = process.env.EMAIL_APP_PASSWORD
const transporter = user && password ? nodemailer.createTransport({ service:'gmail', auth:{ user, pass:password } }) : null

export async function sendAccountInvitation({ email, temporaryPassword }) {
  if (!transporter) return { sent:false, reason:'Email is not configured.' }
  const siteUrl=(process.env.CLIENT_ORIGIN||'').split(',')[0]||'https://lionsplus.rw'
  try {
    await transporter.sendMail({
      from:`Lions Plus <${user}>`,to:email,
      subject:'Your Lions Plus portal account',
      html:`<div style="font-family:Arial,sans-serif;color:#1b1b1b;line-height:1.65;max-width:640px;margin:auto"><h1 style="color:#d51f27">Portal access created</h1><p>Use the temporary password below to sign in:</p><p style="padding:16px;background:#f2f2f2;font-family:monospace;font-size:18px"><strong>${escapeHtml(temporaryPassword)}</strong></p><p><a href="${escapeHtml(siteUrl)}/login">Sign in to Lions Plus</a></p><p>You will be required to enter your full name and choose a new password immediately after signing in. Do not share this temporary password.</p></div>`,
    })
    return {sent:true}
  } catch(error){console.error('Account email delivery failed:',error.message);return{sent:false,reason:'Email delivery failed.'}}
}

export async function sendPasswordResetEmail({ email, token }) {
  if (!transporter) return { sent:false, reason:'Email is not configured.' }
  const siteUrl=(process.env.CLIENT_ORIGIN||'').split(',')[0]||'https://lionsplus.rw'
  const resetUrl=`${siteUrl}/reset-password?token=${encodeURIComponent(token)}`
  try {
    await transporter.sendMail({
      from:`Lions Plus <${user}>`,to:email,
      subject:'Reset your Lions Plus password',
      html:`<div style="font-family:Arial,sans-serif;color:#1b1b1b;line-height:1.65;max-width:640px;margin:auto"><h1 style="color:#d51f27">Reset your password</h1><p>We received a request to reset the password for your Lions Plus administrator account.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:13px 20px;background:#d51f27;color:#fff;text-decoration:none;font-weight:bold">Choose a new password</a></p><p>This link expires in one hour and can only be used once. If you did not request this change, you can safely ignore this email.</p></div>`,
    })
    return {sent:true}
  } catch(error){console.error('Password reset email delivery failed:',error.message);return{sent:false,reason:'Email delivery failed.'}}
}

export async function sendBookingEmails(booking) {
  if (!transporter) return { sent:false, reason:'Email is not configured.' }
  const clientName = escapeHtml(booking.clientName)
  const projectName = escapeHtml(booking.projectName)
  const reference = escapeHtml(booking.reference)
  const services = booking.services.map(escapeHtml).join(', ')
  const schedule = booking.projectType === 'event'
    ? `${escapeHtml(booking.eventDateFrom)} to ${escapeHtml(booking.eventDateTo)}, from ${escapeHtml(booking.startTime)} to ${escapeHtml(booking.endTime)} at ${escapeHtml(booking.location)}`
    : `Delivery requested by ${escapeHtml(booking.deadline)}`
  const sharedStyle = 'font-family:Arial,sans-serif;color:#1b1b1b;line-height:1.65;max-width:640px;margin:auto'
  try {
    await Promise.all([
      transporter.sendMail({
        from:`Lions Plus <${user}>`, to:booking.email,
        subject:`We received your booking request — ${booking.reference}`,
        html:`<div style="${sharedStyle}"><h1 style="color:#d51f27">Booking request received</h1><p>Hello ${clientName},</p><p>Thank you for contacting Lions Plus. We received your request for <strong>${projectName}</strong>.</p><p><strong>Reference:</strong> ${reference}<br><strong>Services:</strong> ${services}<br><strong>Schedule:</strong> ${schedule}</p><p>Our team will review the scope, availability and requirements, then contact you with feedback and a quotation. This message confirms receipt only; the booking is confirmed after the quotation, contract and deposit process.</p><p>Lions Plus</p></div>`,
      }),
      transporter.sendMail({
        from:`Lions Plus Website <${user}>`, to:process.env.EMAIL_NOTIFY_TO || user, replyTo:booking.email,
        subject:`New booking request: ${booking.reference} — ${booking.projectName}`,
        html:`<div style="${sharedStyle}"><h1>New booking request</h1><p><strong>Reference:</strong> ${reference}<br><strong>Client:</strong> ${clientName}<br><strong>Email:</strong> ${escapeHtml(booking.email)}<br><strong>Phone:</strong> ${escapeHtml(booking.phone)}<br><strong>Project:</strong> ${projectName}<br><strong>Services:</strong> ${services}<br><strong>Schedule:</strong> ${schedule}</p><p><strong>Brief</strong><br>${escapeHtml(booking.brief)}</p><p>Sign in to the management dashboard to review the complete request and update its status.</p></div>`,
      }),
    ])
    return { sent:true }
  } catch (error) {
    console.error('Booking email delivery failed:', error.message)
    return { sent:false, reason:'Email delivery failed.' }
  }
}

export async function sendQuotationEmail(booking, file) {
  if (!transporter) return { sent:false, reason:'Email is not configured.' }
  try {
    await transporter.sendMail({
      from:`Lions Plus <${user}>`, to:booking.email,
      subject:`Quotation for ${booking.project_name} — ${booking.reference}`,
      html:`<div style="font-family:Arial,sans-serif;color:#1b1b1b;line-height:1.65;max-width:640px;margin:auto"><h1 style="color:#d51f27">Your quotation is ready</h1><p>Hello ${escapeHtml(booking.client_name)},</p><p>Please find attached the quotation for <strong>${escapeHtml(booking.project_name)}</strong>.</p><p><strong>Booking reference:</strong> ${escapeHtml(booking.reference)}</p><p>Review the attached document and reply to this email if you have questions or would like revisions. Your booking is not confirmed until the quotation, contract and deposit requirements have been completed.</p><p>Lions Plus</p></div>`,
      attachments:[{ filename:file.originalname, content:file.buffer, contentType:file.mimetype }],
    })
    return { sent:true }
  } catch (error) {
    console.error('Quotation email delivery failed:', error.message)
    return { sent:false, reason:'Email delivery failed.' }
  }
}

function escapeHtml(value='') { return String(value??'').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character])) }

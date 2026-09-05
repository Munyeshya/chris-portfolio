// Approved wording: Lions_ENT_One_Page_Website_Final_Layout.pdf.
// Empty values intentionally remain unconfigured until supplied by the owner.
export const company = {
  name: 'Lions ENT',
  phone: '',
  whatsapp: '',
  email: '',
  location: 'Kigali, Rwanda',
  portalUrl: '',
  socials: { Instagram: '', Facebook: '', LinkedIn: '', YouTube: '' },
}

export const services = [
  { id: 'av-production', title: 'AV & Event Production', description: 'Professional livestreaming, live feed production, LED screens & TV screens, event production, and technical AV support.', icon: 'broadcast' },
  { id: 'photography-videography', title: 'Photography & Videography', description: 'Creative photography, videography, event coverage, documentaries, interviews, commercials, and branded content.', icon: 'camera' },
  { id: 'web-development', title: 'Web Design & Development', description: 'Modern websites and custom web applications built for businesses, organizations, and digital platforms.', icon: 'screen' },
  { id: 'creative-digital', title: 'Creative & Digital Solutions', description: 'Graphic design, branding, digital content, and other creative solutions tailored to your needs.', icon: 'creative' },
]

export const eventSolutions = [
  'Event Planning & Coordination',
  'Online Registration & Booking',
  'Ticketing & Guest Management',
  'Check-In & Accreditation',
  'Registration Desk Staff',
  'Guest Lists & Attendance Tracking',
  'Event Access Management',
  'Custom Registration & Booking Platforms',
  'On-Site Event & Technical Support',
]

export const workCategories = [
  { title: 'AV Production & Livestreaming', icon: 'broadcast' },
  { title: 'Photography', icon: 'camera' },
  { title: 'Videography & Documentaries', icon: 'film' },
  { title: 'Events & LED Displays', icon: 'led' },
  { title: 'Websites & Web Applications', icon: 'screen' },
  { title: 'Creative & Digital Projects', icon: 'creative' },
]

// Replace with approved client names/logos and team profiles when available.
export const clients = Array.from({ length: 8 }, () => ({ name: '', logo: '' }))
export const team = Array.from({ length: 4 }, () => ({ name: '', role: '', photo: '' }))

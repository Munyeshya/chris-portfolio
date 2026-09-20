const base = import.meta.env.VITE_API_URL || '/api'

export async function api(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    credentials: 'include', ...options,
    headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || 'The request could not be completed.')
  return body
}

export const authApi = {
  session: () => api('/auth/session'),
  login: (email,password) => api('/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
  register: (email,password) => api('/auth/register',{method:'POST',body:JSON.stringify({email,password})}),
  logout: () => api('/auth/logout',{method:'POST'}),
  reset: email => api('/auth/reset-password',{method:'POST',body:JSON.stringify({email})}),
}

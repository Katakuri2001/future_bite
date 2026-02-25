const API_BASE = '' // same origin; worker routes mounted under /api

async function request(path: string, opts: RequestInit = {}){
  const token = localStorage.getItem('token')
  const headers = new Headers(opts.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json')

  const res = await fetch(`/api${path}`, { ...opts, headers })
  if (res.status === 401) {
    // simple logout on 401
    localStorage.removeItem('token')
    localStorage.removeItem('me')
    throw new Error('Unauthorized')
  }
  const text = await res.text()
  try { return JSON.parse(text) } catch (e) { return text }
}

export const Api = {
  getDishes: () => request('/dishes', { method: 'GET' }),
  createOrder: (payload: any) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getOrders: () => request('/orders', { method: 'GET' }),
  login: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  signup: (payload: any) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/me', { method: 'GET' }),
  createBooking: (payload:any) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
}

export default Api

import { supabase } from './supabase'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

async function request(path, options = {}) {
  // Get the logged-in user's token and send it, like test_api.py did
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    // some replies have no body
  }

  if (!response.ok) {
    const detail = body?.detail
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(', ')
          : 'Something went wrong'
    throw new Error(message)
  }
  return body
}

export const tripsAPI = {
  create: (data) => request('/trips', { method: 'POST', body: JSON.stringify(data) }),
  list: () => request('/trips'),
  get: (id) => request(`/trips/${id}`),
  regenerate: (id, data) =>
    request(`/trips/${id}/regenerate`, { method: 'POST', body: JSON.stringify(data) }),
  remove: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
  recommend: (data) =>
    request('/trips/recommend', { method: 'POST', body: JSON.stringify(data) }),
}
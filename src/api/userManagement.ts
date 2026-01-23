const API_BASE = import.meta.env.VITE_API_BASE_URL

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` })

const buildUrl = (path: string, params: Record<string, any> = {}) => {
  const url = new URL(`${API_BASE}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      url.searchParams.set(key, String(value))
  })
  return url.toString()
}

export const listUsers = async (token: string, params: Record<string, any> = {}) => {
  const res = await fetch(buildUrl('/users', params), {
    headers: { ...authHeader(token) },
  })
  if (!res.ok)
    throw new Error(await res.text())
  return res.json()
}

export const getUser = async (token: string, id: number | string) => {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    headers: { ...authHeader(token) },
  })
  if (!res.ok)
    throw new Error(await res.text())
  return res.json()
}

export const createUser = async (token: string, payload: Record<string, any>) => {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  })
  if (!res.ok)
    throw new Error(await res.text())
  return res.json()
}

export const updateUser = async (token: string, id: number | string, payload: Record<string, any>) => {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  })
  if (!res.ok)
    throw new Error(await res.text())
  return res.json()
}

export const deleteUser = async (token: string, id: number | string) => {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: { ...authHeader(token) },
  })
  if (!res.ok)
    throw new Error(await res.text())
  return res.json()
}

export const updateUserRole = async (token: string, id: number | string, role: 'user' | 'admin') => {
  const res = await fetch(`${API_BASE}/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ role }),
  })
  if (!res.ok)
    throw new Error(await res.text())
  return res.json()
}

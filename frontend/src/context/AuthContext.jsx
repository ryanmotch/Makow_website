import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('makow_token'))
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('makow_token')
    if (!t) return null
    try { return JSON.parse(atob(t.split('.')[1])) } catch { return null }
  })

  const login = useCallback((tok, usr) => {
    localStorage.setItem('makow_token', tok)
    setToken(tok)
    setUser(usr)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('makow_token')
    setToken(null)
    setUser(null)
  }, [])

  const apiFetch = useCallback(async (method, path, body = null, isForm = false) => {
    const opts = {
      method,
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    }
    if (body && !isForm) {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    } else if (body && isForm) {
      opts.body = body
    }
    const res = await fetch(API + path, opts)
    const json = await res.json()
    if (!res.ok) throw Object.assign(new Error(json.error || 'Request failed'), { status: res.status })
    return json
  }, [token])

  // Pull a fresh token so is_paid reflects the DB (e.g. after paying or cancelling).
  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch('POST', '/token/refresh')
      login(res.token, res.user)
    } catch (ex) {
      if (ex.status === 401) logout()
    }
  }, [apiFetch, login, logout])

  // Refresh once on load. Depends only on whether a token exists, so the new
  // token from refresh() doesn't trigger another round.
  const hasToken = !!token
  useEffect(() => { if (hasToken) refresh() }, [hasToken]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, token, login, logout, apiFetch, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

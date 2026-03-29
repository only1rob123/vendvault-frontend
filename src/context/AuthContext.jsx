import { createContext, useContext, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

// Helper: read from localStorage first, fall back to sessionStorage
function readStorage(key) {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(readStorage('vv_user')) } catch { return null }
  })

  const login = async (email, password, remember = false) => {
    const { data } = await api.post('/auth/login', { email, password })
    const store = remember ? localStorage : sessionStorage
    store.setItem('vv_token', data.token)
    store.setItem('vv_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (company_name, name, email, password) => {
    const { data } = await api.post('/auth/register', { company_name, name, email, password })
    localStorage.setItem('vv_token', data.token)
    localStorage.setItem('vv_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('vv_token')
    localStorage.removeItem('vv_user')
    sessionStorage.removeItem('vv_token')
    sessionStorage.removeItem('vv_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

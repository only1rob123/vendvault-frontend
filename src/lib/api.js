import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Token may live in localStorage (remember me) or sessionStorage (session only)
function getToken() {
  return localStorage.getItem('vv_token') ?? sessionStorage.getItem('vv_token')
}

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Clear both storages on auth failure
      localStorage.removeItem('vv_token')
      localStorage.removeItem('vv_user')
      sessionStorage.removeItem('vv_token')
      sessionStorage.removeItem('vv_user')
      // Only redirect if this isn't the login request itself (avoids redirect loop)
      if (!err.config?.url?.includes('/auth/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

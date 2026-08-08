/**
 * GRADSKOOL — API Client
 *
 * Axios instance with:
 * - Base URL from env
 * - JWT Bearer token injection on every request
 * - Automatic token refresh on 401 (single retry)
 * - Redirect to /login on refresh failure
 * - Consistent error shape from backend
 */
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────────────
// Attach access token from localStorage on every request

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────────
// On 401 → try refresh once → retry original request → else logout

let isRefreshing = false
let refreshQueue = []   // Pending requests waiting for refresh

const processQueue = (error, token = null) => {
  refreshQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/token/refresh/')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(Promise.reject)
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        forceLogout()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })
        setAccessToken(data.access)
        if (data.refresh) setRefreshToken(data.refresh)

        processQueue(null, data.access)
        originalRequest.headers['Authorization'] = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        forceLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── TOKEN STORAGE ─────────────────────────────────────────────────────────────
// Access token in memory (more secure), refresh in localStorage

let _accessToken = null

export const getAccessToken = () => _accessToken
export const setAccessToken = (token) => { _accessToken = token }

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('gs_refresh')
}
export const setRefreshToken = (token) => {
  if (typeof window !== 'undefined') localStorage.setItem('gs_refresh', token)
}
export const clearTokens = () => {
  _accessToken = null
  if (typeof window !== 'undefined') localStorage.removeItem('gs_refresh')
}

export const forceLogout = () => {
  clearTokens()
  // Import authStore lazily to avoid circular dependency
  import('../store/authStore').then(({ useAuthStore }) => {
    useAuthStore.getState().clearAuth()
  })
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
    window.location.href = '/auth/login?session=expired'
  }
}

export default api

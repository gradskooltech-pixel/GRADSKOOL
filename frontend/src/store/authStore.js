/**
 * GRADSKOOL — Auth Store (Zustand)
 *
 * Manages:
 * - Current user object (persisted across page reloads via localStorage)
 * - Login / logout / register actions
 * - Token hydration on app mount
 * - Google OAuth exchange
 *
 * Access tokens live in memory (api.js).
 * Refresh tokens live in localStorage (api.js).
 * User profile lives here (localStorage via zustand/persist).
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api, {
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getRefreshToken,
} from '../lib/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      // ── REGISTER ────────────────────────────────────────────────────────────
      register: async ({ firstName, lastName, email, password, passwordConfirm, targetExam, phone, redirect }) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/register/', {
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            password_confirm: passwordConfirm,
            target_exam: targetExam,
            phone,
            redirect,
          })
          set({ isLoading: false })
          return { success: true, email, detail: data.detail }
        } catch (err) {
          const error = extractError(err)
          set({ isLoading: false, error })
          return { success: false, error }
        }
      },

      // ── LOGIN ────────────────────────────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/login/', { email, password })
          _hydrateAuth(data)
          set({ user: data.user, isLoading: false, error: null })
          return { success: true, user: data.user }
        } catch (err) {
          const error = extractError(err)
          set({ isLoading: false, error })
          return {
            success: false,
            error,
            code: err.response?.data?.code || err.response?.data?.error?.code,
            email: err.response?.data?.email,
          }
        }
      },

      // ── GOOGLE AUTH ──────────────────────────────────────────────────────────
      googleAuth: async (credential) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/google/', { credential })
          _hydrateAuth(data)
          set({ user: data.user, isLoading: false, error: null })
          return { success: true, user: data.user, isNewUser: data.is_new_user }
        } catch (err) {
          const error = extractError(err)
          set({ isLoading: false, error })
          return { success: false, error }
        }
      },

      // ── LOGOUT ───────────────────────────────────────────────────────────────
      logout: async () => {
        const refreshToken = getRefreshToken()
        try {
          if (refreshToken) {
            await api.post('/auth/logout/', { refresh: refreshToken })
          }
        } catch (_) {
          // Ignore — clear local state regardless
        }
        clearTokens()
        set({ user: null, error: null })
      },

      // ── VERIFY EMAIL ─────────────────────────────────────────────────────────
      verifyEmail: async (token) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/verify-email/', { token })
          _hydrateAuth(data)
          set({ user: data.user, isLoading: false })
          return { success: true }
        } catch (err) {
          const error = extractError(err)
          set({ isLoading: false, error })
          return { success: false, error }
        }
      },

      // ── RESEND VERIFICATION ──────────────────────────────────────────────────
      resendVerification: async (email) => {
        try {
          await api.post('/auth/resend-verification/', { email })
          return { success: true }
        } catch (err) {
          return { success: false, error: extractError(err) }
        }
      },

      // ── PASSWORD RESET ───────────────────────────────────────────────────────
      requestPasswordReset: async (email) => {
        try {
          await api.post('/auth/password-reset/', { email })
          return { success: true }
        } catch (err) {
          return { success: false, error: extractError(err) }
        }
      },

      confirmPasswordReset: async ({ token, newPassword, newPasswordConfirm }) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/password-reset/confirm/', {
            token,
            new_password: newPassword,
            new_password_confirm: newPasswordConfirm,
          })
          set({ isLoading: false })
          return { success: true }
        } catch (err) {
          const error = extractError(err)
          set({ isLoading: false, error })
          return { success: false, error }
        }
      },

      // ── PASSWORD CHANGE ──────────────────────────────────────────────────────
      changePassword: async ({ currentPassword, newPassword, newPasswordConfirm }) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/password-change/', {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirm: newPasswordConfirm,
          })
          set({ isLoading: false })
          return { success: true }
        } catch (err) {
          const error = extractError(err)
          set({ isLoading: false, error })
          return { success: false, error }
        }
      },

      // ── UPDATE PROFILE ───────────────────────────────────────────────────────
      updateProfile: async (updates) => {
        try {
          const { data } = await api.patch('/auth/me/', updates)
          set({ user: data })
          return { success: true, user: data }
        } catch (err) {
          return { success: false, error: extractError(err) }
        }
      },

      // ── HYDRATE ON APP MOUNT ─────────────────────────────────────────────────
      // Called once in _app.jsx to restore session if refresh token exists
      hydrateSession: async () => {
        const refreshToken = getRefreshToken()
        if (!refreshToken) return

        try {
          const { data } = await api.post('/auth/token/refresh/', { refresh: refreshToken })
          setAccessToken(data.access)
          if (data.refresh) setRefreshToken(data.refresh)

          // Fetch fresh user profile
          const { data: user } = await api.get('/auth/me/')
          set({ user })
        } catch (_) {
          clearTokens()
          set({ user: null })
        }
      },

      // ── CLEAR AUTH (called by api.js on force logout) ─────────────────────────
      clearAuth: () => {
        clearTokens()
        set({ user: null, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'gs-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the user object — tokens are managed separately
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// ── HELPERS ────────────────────────────────────────────────────────────────────

function _hydrateAuth(data) {
  setAccessToken(data.access)
  if (data.refresh) setRefreshToken(data.refresh)
}

function extractError(err) {
  if (!err.response) return 'Network error — is the backend running at localhost:8000?'
  const data = err.response.data
  if (!data) return `Server error (${err.response.status}). Please try again.`

  // Our custom exception handler: { error: { message, fields } }
  if (data.error) {
    if (typeof data.error === 'string') return data.error
    if (data.error.fields) return data.error.fields
    if (data.error.message) return data.error.message
    return data.error
  }

  // DRF validation errors: { email: ["..."], password: ["..."] }
  if (typeof data === 'object' && !data.detail) {
    const firstKey = Object.keys(data)[0]
    if (firstKey) {
      const val = data[firstKey]
      const msg = Array.isArray(val) ? val[0] : val
      if (firstKey === 'non_field_errors') return String(msg)
      return data  // return object for field-level display
    }
  }

  // DRF standard: { detail: "..." }
  if (data.detail) return String(data.detail)

  return `Something went wrong (${err.response.status}). Please try again.`
}

export { useAuthStore }
export default useAuthStore
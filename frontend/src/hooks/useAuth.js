/**
 * GRADSKOOL — useAuth Hook
 *
 * Thin convenience hook over the auth store.
 * Components import this instead of useAuthStore directly.
 *
 * Usage:
 *   const { user, isLoggedIn, login, logout } = useAuth()
 */
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const store = useAuthStore()

  return {
    // State
    user: store.user,
    isLoading: store.isLoading,
    error: store.error,
    isLoggedIn: !!store.user,
    sessionReady: store.sessionReady,
    isVerified: store.user?.is_verified ?? false,
    isAdmin: store.user?.role === 'admin',
    isInstructor: store.user?.role === 'instructor',
    isStudent: store.user?.role === 'student',

    // Actions
    login: store.login,
    logout: store.logout,
    register: store.register,
    googleAuth: store.googleAuth,
    verifyEmail: store.verifyEmail,
    resendVerification: store.resendVerification,
    requestPasswordReset: store.requestPasswordReset,
    confirmPasswordReset: store.confirmPasswordReset,
    changePassword: store.changePassword,
    updateProfile: store.updateProfile,
    hydrateSession: store.hydrateSession,
    clearError: store.clearError,
  }
}
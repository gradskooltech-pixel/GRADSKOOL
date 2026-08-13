/**
 * GRADSKOOL — ProtectedRoute
 *
 * Wraps any page that requires authentication.
 * Redirects to /auth/login with ?redirect= param if not logged in.
 * Shows a loading state while session is being hydrated.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute({ children, requireRole = null }) {
  const { isLoggedIn, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !router.isReady) return

    if (!isLoggedIn) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`)
      return
    }

    if (requireRole && user?.role !== requireRole) {
      router.replace('/')
    }
  }, [isLoggedIn, isLoading, requireRole, user, router, router.isReady])

  if (isLoading || !isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gray-50)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="gs-spinner" />
          <p style={{
            marginTop: '1rem',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            color: 'var(--gray-400)',
          }}>
            Loading…
          </p>
        </div>
      </div>
    )
  }

  return children
}
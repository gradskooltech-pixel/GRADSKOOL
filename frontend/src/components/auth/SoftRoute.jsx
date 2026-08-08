/**
 * GRADSKOOL — SoftRoute
 * Like ProtectedRoute but doesn't redirect unauthenticated users.
 * Used for learn portal pages that have free preview content.
 * Unauthenticated users can browse — sign-in prompt shown instead of interactive features.
 */
import { useAuth } from '../../hooks/useAuth'

export function SoftRoute({ children }) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Georgia,serif', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Loading…</p>
      </div>
    )
  }

  return children
}

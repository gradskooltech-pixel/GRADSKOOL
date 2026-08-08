/**
 * GRADSKOOL — Verify Email Page
 * Route: /auth/verify-email?token=<uuid>
 *
 * Automatically submits the token on mount.
 * On success: redirects to dashboard (user is logged in).
 * On failure: shows error + resend option.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { useAuth } from '../../hooks/useAuth'

const STATE = { loading: 'loading', success: 'success', error: 'error', noToken: 'no-token' }

export default function VerifyEmailPage() {
  const router = useRouter()
  const { verifyEmail, resendVerification } = useAuth()
  const [state, setState] = useState(STATE.loading)
  const [errorMessage, setErrorMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    const { token } = router.query
    if (!token) { setState(STATE.noToken); return }

    ;(async () => {
      const result = await verifyEmail(token)
      if (result.success) {
        setState(STATE.success)
        // Redirect after brief success flash
        setTimeout(() => router.push('/dashboard'), 1800)
      } else {
        setState(STATE.error)
        setErrorMessage(typeof result.error === 'string' ? result.error : 'Verification failed.')
      }
    })()
  }, [router.isReady, router.query.token]) // eslint-disable-line

  const handleResend = async () => {
    if (!resendEmail) return
    await resendVerification(resendEmail)
    setResendSent(true)
  }

  return (
    <AuthLayout title="Verify email">
      <div style={styles.container}>
        {state === STATE.loading && (
          <>
            <div style={styles.spinner} />
            <h2 style={styles.heading}>Verifying your email…</h2>
            <p style={styles.sub}>This will just take a moment.</p>
          </>
        )}

        {state === STATE.success && (
          <>
            <div style={styles.iconSuccess}>✓</div>
            <h2 style={styles.heading}>Email verified!</h2>
            <p style={styles.sub}>
              Your account is now active. Redirecting you to your dashboard…
            </p>
          </>
        )}

        {state === STATE.error && (
          <>
            <div style={styles.iconError}>✕</div>
            <h2 style={styles.heading}>Verification failed</h2>
            <p style={styles.errorText}>{errorMessage}</p>

            {!resendSent ? (
              <div style={styles.resendSection}>
                <p style={styles.resendLabel}>Request a new verification link:</p>
                <div style={styles.resendRow}>
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    style={styles.resendInput}
                  />
                  <button
                    onClick={handleResend}
                    style={styles.resendBtn}
                    disabled={!resendEmail}
                  >
                    Resend
                  </button>
                </div>
              </div>
            ) : (
              <p style={styles.resendConfirm}>
                ✓ New verification link sent. Check your inbox.
              </p>
            )}

            <Link href="/auth/login" style={styles.backLink}>← Back to login</Link>
          </>
        )}

        {state === STATE.noToken && (
          <>
            <div style={styles.iconError}>⚠</div>
            <h2 style={styles.heading}>Invalid link</h2>
            <p style={styles.sub}>
              This verification link is missing a token. Please check your email
              and click the original link.
            </p>
            <Link href="/auth/login" style={styles.backLink}>← Back to login</Link>
          </>
        )}
      </div>
    </AuthLayout>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '2rem 0',
    gap: '1rem',
    minHeight: '320px',
    justifyContent: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--gray-200)',
    borderTop: '3px solid var(--red)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '0.5rem',
  },
  iconSuccess: {
    width: '56px',
    height: '56px',
    background: '#dcfce7',
    color: '#16a34a',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
  },
  iconError: {
    width: '56px',
    height: '56px',
    background: 'var(--red-light)',
    color: 'var(--red)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
  },
  heading: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--black)',
  },
  sub: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    color: 'var(--gray-600)',
    lineHeight: '1.6',
    maxWidth: '320px',
  },
  errorText: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    color: 'var(--red-dark)',
    background: 'var(--red-light)',
    border: '1px solid var(--red-border)',
    borderRadius: 'var(--radius)',
    padding: '0.6rem 1rem',
    maxWidth: '340px',
    lineHeight: '1.5',
  },
  resendSection: { width: '100%', maxWidth: '340px' },
  resendLabel: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    color: 'var(--gray-600)',
    marginBottom: '0.5rem',
    textAlign: 'left',
  },
  resendRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  resendInput: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  resendBtn: {
    padding: '0.6rem 1rem',
    background: 'var(--black)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  resendConfirm: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    color: '#16a34a',
  },
  backLink: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    color: 'var(--red)',
    borderBottom: '1px solid var(--red-border)',
    marginTop: '0.5rem',
  },
}

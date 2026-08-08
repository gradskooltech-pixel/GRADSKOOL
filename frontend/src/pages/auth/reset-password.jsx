/**
 * GRADSKOOL — Reset Password Page
 * Route: /auth/reset-password?token=<uuid>
 */
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { useAuth } from '../../hooks/useAuth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { confirmPasswordReset, isLoading } = useAuth()
  const { token } = router.query

  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.')
      return
    }

    const result = await confirmPasswordReset({ token, newPassword, newPasswordConfirm })

    if (result.success) {
      setDone(true)
    } else {
      if (typeof result.error === 'object') {
        setFieldErrors(result.error)
      } else {
        setError(result.error)
      }
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password reset">
        <div style={styles.success}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.heading}>Password reset!</h2>
          <p style={styles.sub}>
            Your password has been updated. You can now log in with your new password.
          </p>
          <Link href="/auth/login" style={styles.btn}>Log in →</Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset password">
      <div style={styles.header}>
        <p style={styles.eyebrow}>Account security</p>
        <h1 style={styles.heading}>Set a new password</h1>
        <p style={styles.sub}>Choose a strong password of at least 8 characters.</p>
      </div>

      {error && <div style={styles.errorBanner} role="alert">{error}</div>}

      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <div style={styles.fieldWrap}>
          <label style={styles.label} htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setFieldErrors({}) }}
            required
            autoFocus
            autoComplete="new-password"
            style={{ ...styles.input, ...(fieldErrors.new_password ? styles.inputErr : {}) }}
          />
          {fieldErrors.new_password && (
            <p style={styles.fieldErr}>{fieldErrors.new_password}</p>
          )}
        </div>

        <div style={styles.fieldWrap}>
          <label style={styles.label} htmlFor="newPasswordConfirm">Confirm new password</label>
          <input
            id="newPasswordConfirm"
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => { setNewPasswordConfirm(e.target.value); setFieldErrors({}) }}
            required
            autoComplete="new-password"
            style={{ ...styles.input, ...(fieldErrors.new_password_confirm ? styles.inputErr : {}) }}
          />
          {fieldErrors.new_password_confirm && (
            <p style={styles.fieldErr}>{fieldErrors.new_password_confirm}</p>
          )}
        </div>

        <button type="submit" style={styles.btn} disabled={isLoading || !token}>
          {isLoading ? 'Updating…' : 'Update password →'}
        </button>
      </form>
    </AuthLayout>
  )
}

const styles = {
  header: { marginBottom: '2rem' },
  eyebrow: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.72rem',
    fontWeight: '500',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--red)',
    marginBottom: '0.4rem',
  },
  heading: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--black)',
    marginBottom: '0.5rem',
  },
  sub: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    color: 'var(--gray-600)',
  },
  errorBanner: {
    background: 'var(--red-light)',
    border: '1px solid var(--red-border)',
    borderRadius: 'var(--radius)',
    padding: '0.75rem 1rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    color: 'var(--red-dark)',
    marginBottom: '1.25rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: 'var(--gray-700)',
  },
  input: {
    padding: '0.7rem 0.75rem',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    outline: 'none',
  },
  inputErr: { borderColor: 'var(--red)' },
  fieldErr: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    color: 'var(--red)',
  },
  btn: {
    display: 'inline-block',
    width: '100%',
    padding: '0.85rem',
    background: 'var(--black)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '0.5rem',
  },
  success: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '1rem',
    padding: '2rem 0',
  },
  successIcon: {
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
  },
}

/**
 * GRADSKOOL — Login Page
 * Route: /auth/login
 */
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton'
import { useAuth } from '../../hooks/useAuth'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#ffffff',
  gray700: '#3a3a3a', gray500: '#666', gray400: '#999',
  gray200: '#e8e8e6', gray50: '#fafaf9', border: '#e8e8e6',
}

export default function LoginPage() {
  const router = useRouter()
  const { login, googleAuth, resendVerification, isLoading } = useAuth()
  const { redirect, session } = router.query

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPwd, setShowPwd]           = useState(false)
  const [error, setError]               = useState('')
  const [unverifiedEmail, setUnverified]= useState(null)
  const [resendSent, setResendSent]     = useState(false)
  const [focusedField, setFocused]      = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUnverified(null)
    const result = await login(email.trim().toLowerCase(), password)
    if (result.success) {
      router.push(redirect || '/dashboard')
    } else {
      if (result.code === 'email_not_verified') {
        setUnverified(result.email)
      } else {
        setError(typeof result.error === 'string' ? result.error : 'Login failed. Check your email and password.')
      }
    }
  }

  const handleGoogle = async (credential) => {
    const result = await googleAuth(credential)
    if (result.success) {
      router.push(redirect || '/dashboard')
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Google sign-in failed.')
    }
  }

  const handleResend = async () => {
    if (!unverifiedEmail) return
    await resendVerification(unverifiedEmail)
    setResendSent(true)
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '0.8rem 0.875rem',
    border: `1px solid ${focusedField === field ? C.black : C.border}`,
    borderRadius: '3px',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
    color: C.black, background: C.white,
    outline: 'none', transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  })

  return (
    <AuthLayout title="Log in" description="Log in to your GRADSKOOL account.">

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={s.eyebrow}>Welcome back</p>
        <h1 style={s.heading}>Log in to GRADSKOOL</h1>
        <p style={s.subtext}>
          New here?{' '}
          <Link href="/auth/register" style={s.textLink}>Create a free account →</Link>
        </p>
      </div>

      {/* Session expired */}
      {session === 'expired' && (
        <div style={s.warnBanner}>Your session has expired. Please log in again.</div>
      )}

      {/* Google OAuth — only shown when configured */}
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <div style={{ marginBottom: '1.75rem' }}>
          <GoogleOAuthButton onSuccess={handleGoogle} onError={setError} />
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or continue with email</span>
            <div style={s.dividerLine} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div style={s.errorBanner}>{error}</div>}

      {/* Unverified email */}
      {unverifiedEmail && (
        <div style={s.warnBanner}>
          <strong>Email not verified.</strong>{' '}
          {resendSent
            ? '✓ Verification email sent. Check your inbox.'
            : <>
                Please verify your email before logging in.{' '}
                <button style={s.inlineBtn} onClick={handleResend}>
                  Resend verification →
                </button>
              </>
          }
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div>
          <label style={s.label} htmlFor="email">Email address</label>
          <input
            id="email" type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            required autoComplete="email" autoFocus
            style={inputStyle('email')}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={s.label} htmlFor="password">Password</label>
            <Link href="/auth/forgot-password" style={s.forgotLink}>Forgot password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              required autoComplete="current-password"
              style={{ ...inputStyle('password'), paddingRight: '2.75rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              style={s.pwdToggle}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          style={{ ...s.submitBtn, opacity: isLoading ? 0.7 : 1 }}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in…' : 'Log in →'}
        </button>

      </form>

    </AuthLayout>
  )
}

const s = {
  eyebrow: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '500',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: C.red, marginBottom: '0.4rem',
  },
  heading: {
    fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: '700',
    color: C.black, lineHeight: '1.1', marginBottom: '0.5rem',
  },
  subtext: {
    fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: C.gray500,
  },
  textLink: {
    color: C.red, textDecoration: 'none',
    borderBottom: '1px solid #ffd0d0',
  },
  forgotLink: {
    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
    color: C.gray400, textDecoration: 'none',
    borderBottom: '1px solid #e8e8e6',
  },
  label: {
    display: 'block', fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem', fontWeight: '500',
    color: C.gray700, marginBottom: '0.35rem',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '0.875rem', margin: '1.25rem 0 0',
  },
  dividerLine: { flex: 1, height: '1px', background: C.gray200 },
  dividerText: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
    color: C.gray400, whiteSpace: 'nowrap',
  },
  errorBanner: {
    background: '#fff0f0', border: '1px solid #ffd0d0',
    borderRadius: '3px', padding: '0.75rem 1rem',
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    color: '#cc3a3b', marginBottom: '1.25rem', lineHeight: '1.5',
  },
  warnBanner: {
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: '3px', padding: '0.75rem 1rem',
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    color: '#92400e', marginBottom: '1.25rem', lineHeight: '1.5',
  },
  pwdToggle: {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '1rem', lineHeight: '1', opacity: 0.5,
  },
  submitBtn: {
    width: '100%', padding: '0.9rem',
    background: C.black, color: C.white, border: 'none',
    borderRadius: '3px', fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem', fontWeight: '600',
    letterSpacing: '0.03em', cursor: 'pointer',
    marginTop: '0.25rem',
  },
  inlineBtn: {
    background: 'none', border: 'none',
    borderBottom: '1px solid currentColor',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem', color: 'inherit', padding: 0,
  },
}

/**
 * GRADSKOOL — Register Page
 * Route: /auth/register
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton'
import { useAuth } from '../../hooks/useAuth'

const EXAM_OPTIONS = [
  { value: '',         label: 'Target exam (optional)' },
  { value: 'cat',      label: 'CAT' },
  { value: 'xat',      label: 'XAT' },
  { value: 'snap',     label: 'SNAP' },
  { value: 'nmat',     label: 'NMAT' },
  { value: 'gmat',     label: 'GMAT' },
  { value: 'gre',      label: 'GRE' },
  { value: 'ipmat',    label: 'IPMAT' },
  { value: 'cmat',     label: 'CMAT' },
  { value: 'mhcet',    label: 'MH CET' },
  { value: 'clat',     label: 'CLAT / AILET' },
  { value: 'cuet',     label: 'CUET' },
  { value: 'pi-wat-gd',label: 'PI WAT GD' },
  { value: 'other',    label: 'Other' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register, login, googleAuth, isLoading } = useAuth()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    targetExam: '',
    password: '',
    passwordConfirm: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState(false)

  // Prefill from ?email= — e.g. the "No account found, create one?" link on
  // the login page passes the email they already typed there, so they don't
  // have to retype it. router.query is empty on first render (populates
  // after hydration), so this fires once it's actually available.
  useEffect(() => {
    if (router.query.email) {
      setForm((prev) => ({ ...prev, email: decodeURIComponent(String(router.query.email)) }))
    }
  }, [router.query.email])

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    if (globalError) setGlobalError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError('')

    try {
      const result = await register({ ...form, redirect: router.query.redirect })
      console.log('[REGISTER DEBUG] register() result:', result)
      if (result.success) {
        // Auto-login after registration (works in dev since email is auto-verified)
        const loginResult = await login(form.email, form.password)
        console.log('[REGISTER DEBUG] login() result:', loginResult)
        if (loginResult.success) {
          const redirect = router.query.redirect || '/'
          console.log('[REGISTER DEBUG] Auto-login succeeded, redirecting to:', redirect)
          router.push(redirect)
        } else {
          // Email verification required (production) — show success screen
          console.log('[REGISTER DEBUG] Auto-login failed (expected if unverified) — showing success screen')
          setSuccess(true)
        }
      } else {
        console.log('[REGISTER DEBUG] register() failed:', result.error)
        if (typeof result.error === 'object') {
          // Field-level errors from DRF
          const mapped = {}
          for (const [key, val] of Object.entries(result.error)) {
            mapped[snakeToCamel(key)] = Array.isArray(val) ? val[0] : val
          }
          setFieldErrors(mapped)
        } else {
          setGlobalError(result.error)
        }
      }
    } catch (err) {
      // Defensive: if anything above throws unexpectedly, surface it
      // instead of silently leaving the user stuck on the form with no
      // feedback at all.
      console.error('[REGISTER DEBUG] Unexpected error in handleSubmit:', err)
      setGlobalError('Something went wrong creating your account. Please try again, or contact us if this keeps happening.')
    }
  }

  const handleGoogle = async (credential) => {
    const result = await googleAuth(credential)
    if (result.success) {
      const redirect = router.query.redirect || '/'
      router.push(redirect)
    } else {
      setGlobalError(typeof result.error === 'string' ? result.error : 'Google sign-in failed.')
    }
  }

  // ── POST-SUBMIT SUCCESS STATE ─────────────────────────────────────────────
  const [focused, setFocused] = useState(null)

  const inp = (field) => ({
    width: '100%', padding: '0.8rem 0.875rem',
    border: `1px solid ${focused === field ? '#0f0f0f' : '#e8e8e6'}`,
    borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
    color: '#0f0f0f', background: fieldErrors[field] ? '#fff8f8' : '#ffffff',
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
  })

  if (success) {
    return (
      <AuthLayout title="Check your email" quoteIndex={1}>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1.5rem' }}>✓</div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', marginBottom: '0.5rem' }}>Account Created</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', fontWeight: '700', color: '#0f0f0f', marginBottom: '0.75rem' }}>Check your email</h2>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: '#555', lineHeight: '1.75', maxWidth: '320px', margin: '0 auto 2rem' }}>
            We sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.
          </p>
          <Link href="/auth/login" style={{ display: 'inline-block', background: '#0f0f0f', color: '#fff', padding: '0.8rem 2rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none' }}>
            Go to Login →
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create account" description="Create your free GRADSKOOL account." quoteIndex={1}>

      <div style={{ marginBottom: '2.5rem' }}>
        <p style={s.eyebrow}>Get started</p>
        <h1 style={s.heading}>Create your account</h1>
        <p style={s.subtext}>
          Already have an account?{' '}
          <Link href="/auth/login" style={s.textLink}>Log in →</Link>
        </p>
      </div>

      {/* Google */}
      <div style={{ marginBottom: '1.75rem' }}>
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <GoogleOAuthButton onSuccess={handleGoogle} onError={setGlobalError} />
          )}
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>or continue with email</span>
          <div style={s.dividerLine} />
        </div>
      </div>

      {globalError && <div style={s.errorBanner}>{globalError}</div>}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={s.label} htmlFor="firstName">First name *</label>
            <input id="firstName" type="text" value={form.firstName}
              onChange={set('firstName')}
              onFocus={() => setFocused('firstName')} onBlur={() => setFocused(null)}
              required autoComplete="given-name" autoFocus style={inp('firstName')} />
            {fieldErrors.firstName && <p style={s.fieldErr}>{fieldErrors.firstName}</p>}
          </div>
          <div>
            <label style={s.label} htmlFor="lastName">Last name *</label>
            <input id="lastName" type="text" value={form.lastName}
              onChange={set('lastName')}
              onFocus={() => setFocused('lastName')} onBlur={() => setFocused(null)}
              required autoComplete="family-name" style={inp('lastName')} />
            {fieldErrors.lastName && <p style={s.fieldErr}>{fieldErrors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={s.label} htmlFor="email">Email address *</label>
          <input id="email" type="email" value={form.email}
            onChange={set('email')}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
            required autoComplete="email" style={inp('email')}
            placeholder="you@example.com" />
          {fieldErrors.email && <p style={s.fieldErr}>{fieldErrors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label style={s.label} htmlFor="phone">Phone number (WhatsApp)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: '#999' }}>+91</span>
            <input id="phone" type="tel" value={form.phone}
              onChange={set('phone')}
              onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
              autoComplete="tel" style={{ ...inp('phone'), paddingLeft: '2.75rem' }}
              placeholder="9999999999" />
          </div>
          {fieldErrors.phone && <p style={s.fieldErr}>{fieldErrors.phone}</p>}
        </div>

        {/* Target exam */}
        <div>
          <label style={s.label} htmlFor="targetExam">Target exam</label>
          <select id="targetExam" value={form.targetExam} onChange={set('targetExam')}
            style={{ ...inp('targetExam'), cursor: 'pointer' }}>
            {EXAM_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div>
          <label style={s.label} htmlFor="password">Password *</label>
          <input id="password" type="password" value={form.password}
            onChange={set('password')}
            onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
            required autoComplete="new-password" style={inp('password')}
            placeholder="Min 8 characters" />
          {fieldErrors.password && <p style={s.fieldErr}>{fieldErrors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label style={s.label} htmlFor="passwordConfirm">Confirm password *</label>
          <input id="passwordConfirm" type="password" value={form.passwordConfirm}
            onChange={set('passwordConfirm')}
            onFocus={() => setFocused('passwordConfirm')} onBlur={() => setFocused(null)}
            required autoComplete="new-password" style={inp('passwordConfirm')} />
          {fieldErrors.passwordConfirm && <p style={s.fieldErr}>{fieldErrors.passwordConfirm}</p>}
        </div>

        <button type="submit"
          style={{ ...s.submitBtn, opacity: isLoading ? 0.7 : 1, marginTop: '0.5rem' }}
          disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account →'}
        </button>

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#999', textAlign: 'center', lineHeight: '1.6' }}>
          By creating an account, you agree to our{' '}
          <Link href="/terms" style={{ color: '#555', textDecoration: 'none', borderBottom: '1px solid #e8e8e6' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy-policy" style={{ color: '#555', textDecoration: 'none', borderBottom: '1px solid #e8e8e6' }}>Privacy Policy</Link>.
        </p>

      </form>
    </AuthLayout>
  )
}

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

const s = {
  eyebrow: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '500',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#ff5e5f', marginBottom: '0.4rem',
  },
  heading: {
    fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: '700',
    color: '#0f0f0f', lineHeight: '1.1', marginBottom: '0.5rem',
  },
  subtext: { fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: '#666' },
  textLink: { color: '#ff5e5f', textDecoration: 'none', borderBottom: '1px solid #ffd0d0' },
  label: {
    display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    fontWeight: '500', color: '#3a3a3a', marginBottom: '0.35rem',
  },
  fieldErr: { fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#cc3a3b', marginTop: '0.25rem' },
  divider: { display: 'flex', alignItems: 'center', gap: '0.875rem', margin: '1.25rem 0 0' },
  dividerLine: { flex: 1, height: '1px', background: '#e8e8e6' },
  dividerText: { fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#999', whiteSpace: 'nowrap' },
  errorBanner: {
    background: '#fff0f0', border: '1px solid #ffd0d0', borderRadius: '3px',
    padding: '0.75rem 1rem', fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    color: '#cc3a3b', marginBottom: '1.25rem', lineHeight: '1.5',
  },
  submitBtn: {
    width: '100%', padding: '0.9rem', background: '#0f0f0f', color: '#ffffff',
    border: 'none', borderRadius: '3px', fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.03em', cursor: 'pointer',
  },
}
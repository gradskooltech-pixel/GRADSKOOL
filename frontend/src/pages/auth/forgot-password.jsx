/**
 * GRADSKOOL — Forgot Password Page
 * Route: /auth/forgot-password
 */
import { useState } from 'react'
import Link from 'next/link'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { RecaptchaWidget } from '../../components/auth/RecaptchaWidget'
import { useAuth } from '../../hooks/useAuth'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await requestPasswordReset(email.trim().toLowerCase(), recaptchaToken)
    setLoading(false)
    setSubmitted(true)   // Always show success — no email enumeration
  }

  const [focused, setFocused] = useState(null)

  return (
    <AuthLayout title="Reset password" description="Reset your GRADSKOOL account password.">

      {submitted ? (
        <div style={{ textAlign:'center', padding:'2rem 0' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#f0fdf4', border:'1px solid #86efac', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', margin:'0 auto 1.5rem' }}>✉️</div>
          <p style={s.eyebrow}>Email Sent</p>
          <h2 style={s.heading}>Check your inbox</h2>
          <p style={{ fontFamily:'Georgia, serif', fontSize:'0.95rem', color:'#555', lineHeight:'1.75', maxWidth:'320px', margin:'0 auto 2rem' }}>
            If an account exists for <strong>{email}</strong>, we sent a password reset link. Check your spam folder too.
          </p>
          <Link href="/auth/login" style={{ display:'inline-block', background:'#0f0f0f', color:'#fff', padding:'0.8rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'600', textDecoration:'none' }}>
            Back to Login →
          </Link>
        </div>
      ) : (
        <>
          <div style={{ marginBottom:'2.5rem' }}>
            <p style={s.eyebrow}>Forgot password?</p>
            <h1 style={s.heading}>Reset your password</h1>
            <p style={s.subtext}>Enter your email and we'll send a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div>
              <label style={s.label} htmlFor="email">Email address</label>
              <input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                required autoComplete="email" autoFocus
                style={{ width:'100%', padding:'0.8rem 0.875rem', border:`1px solid ${focused === 'email' ? '#0f0f0f' : '#e8e8e6'}`, borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', color:'#0f0f0f', background:'#fff', outline:'none', transition:'border-color 0.15s', boxSizing:'border-box' }}
                placeholder="you@example.com"
              />
            </div>

            <button type="submit"
              style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link →'}
            </button>

            <RecaptchaWidget onVerify={setRecaptchaToken} />

            <p style={{ textAlign:'center' }}>
              <Link href="/auth/login" style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#999', textDecoration:'none', borderBottom:'1px solid #e8e8e6' }}>
                ← Back to login
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthLayout>
  )
}

const s = {
  eyebrow: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:'#ff5e5f', marginBottom:'0.4rem' },
  heading: { fontFamily:'Georgia, serif', fontSize:'2rem', fontWeight:'700', color:'#0f0f0f', lineHeight:'1.1', marginBottom:'0.5rem' },
  subtext: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'#666' },
  label:   { display:'block', fontFamily:'var(--font-sans)', fontSize:'0.8rem', fontWeight:'500', color:'#3a3a3a', marginBottom:'0.35rem' },
  submitBtn: { width:'100%', padding:'0.9rem', background:'#0f0f0f', color:'#fff', border:'none', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'600', letterSpacing:'0.03em', cursor:'pointer' },
}

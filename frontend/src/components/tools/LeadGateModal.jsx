/**
 * GRADSKOOL — LeadGateModal
 *
 * Shown when a user tries to access a gated tool without a token.
 * Submits name + email + target_exam → receives signed JWT → unlocks tool.
 */
import { useState } from 'react'
import { useToolGate } from '../../hooks/useToolsBlogDashboard'

const EXAM_OPTIONS = [
  { value: '',      label: 'Select your target exam' },
  { value: 'CAT',   label: 'CAT' },
  { value: 'GMAT',  label: 'GMAT' },
  { value: 'GRE',   label: 'GRE' },
  { value: 'IPMAT', label: 'IPMAT' },
  { value: 'XAT',   label: 'XAT' },
  { value: 'CLAT',  label: 'CLAT / Law' },
  { value: 'OTHER', label: 'Other' },
]

export function LeadGateModal({ toolSlug, toolName, onSuccess }) {
  const { submitGate, loading, error } = useToolGate(toolSlug)
  const [form, setForm] = useState({ name: '', email: '', targetExam: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())  errs.name  = 'Please enter your name.'
    if (!form.email.trim()) errs.email = 'Please enter your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await submitGate(form)
    if (result.success) onSuccess()
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div style={styles.header}>
          <p style={styles.eyebrow}>Free Access</p>
          <h2 style={styles.title}>Unlock {toolName}</h2>
          <p style={styles.sub}>
            This tool is completely free. Leave your name and email to get instant access.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          <Field
            label="Your name"
            id="gate-name"
            value={form.name}
            onChange={set('name')}
            error={fieldErrors.name}
            autoFocus
            placeholder="Keshav Mundra"
          />
          <Field
            label="Email address"
            id="gate-email"
            type="email"
            value={form.email}
            onChange={set('email')}
            error={fieldErrors.email}
            placeholder="you@example.com"
            autocomplete="email"
          />
          <div style={styles.fieldWrap}>
            <label style={styles.label} htmlFor="gate-exam">
              Target exam <span style={styles.optional}>(optional)</span>
            </label>
            <select
              id="gate-exam"
              value={form.targetExam}
              onChange={set('targetExam')}
              style={styles.select}
            >
              {EXAM_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p style={styles.error} role="alert">{error}</p>
          )}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Getting access…' : 'Get Free Access →'}
          </button>

          <p style={styles.privacy}>
            No spam. No password. We'll only send you relevant study resources.
          </p>
        </form>

        {/* Social proof */}
        <div style={styles.proof}>
          <span style={styles.proofStat}>100K+</span>
          <span style={styles.proofLabel}> students have used these tools</span>
        </div>
      </div>
    </div>
  )
}

function Field({ label, id, type = 'text', value, onChange, error,
                  placeholder, autoFocus, autocomplete }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label} htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autocomplete}
        style={{ ...styles.input, ...(error ? styles.inputErr : {}) }}
        aria-invalid={!!error}
      />
      {error && <p style={styles.fieldErr} role="alert">{error}</p>}
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
    backdropFilter: 'blur(2px)',
  },
  modal: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    width: '100%',
    maxWidth: '440px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    background: 'var(--black)',
    padding: '2rem 2rem 1.75rem',
  },
  eyebrow: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.68rem', fontWeight: '700',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--red)', marginBottom: '0.4rem',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.75rem', fontWeight: '700',
    color: 'var(--white)', lineHeight: '1.1', marginBottom: '0.6rem',
  },
  sub: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5',
  },
  form: {
    padding: '1.75rem 2rem',
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem', fontWeight: '500', color: 'var(--gray-700)',
  },
  optional: { color: 'var(--gray-400)', fontWeight: '400' },
  input: {
    padding: '0.7rem 0.75rem',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem', color: 'var(--black)',
    outline: 'none', transition: 'border-color 0.15s',
  },
  inputErr: { borderColor: 'var(--red)' },
  select: {
    padding: '0.7rem 0.75rem',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem', color: 'var(--black)',
    background: 'var(--white)',
    outline: 'none', appearance: 'none',
  },
  error: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem', color: 'var(--red-dark)',
    background: 'var(--red-light)', border: '1px solid var(--red-border)',
    borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem',
  },
  fieldErr: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--red)',
  },
  btn: {
    width: '100%', padding: '0.85rem',
    background: 'var(--red)', color: 'var(--white)',
    border: 'none', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem', fontWeight: '700',
    cursor: 'pointer', transition: 'background 0.2s',
    letterSpacing: '0.02em',
  },
  privacy: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
    color: 'var(--gray-400)', textAlign: 'center', lineHeight: '1.5',
  },
  proof: {
    padding: '1rem 2rem',
    background: 'var(--gray-50)',
    borderTop: '1px solid var(--gray-200)',
    display: 'flex', alignItems: 'baseline', gap: '0.3rem',
  },
  proofStat: {
    fontFamily: 'var(--font-serif)', fontSize: '1.2rem',
    fontWeight: '700', color: 'var(--black)',
  },
  proofLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gray-500)',
  },
}

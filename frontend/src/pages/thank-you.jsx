import Link from 'next/link'
import Head from 'next/head'

export default function ThankYouPage() {
  return (
    <>
      <Head>
        <title>Payment Confirmed — Welcome to GRADSKOOL</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={s.page}>
        <div style={s.card}>
          <div style={s.checkCircle}>✓</div>
          <p style={s.tag}>Payment Confirmed</p>
          <h1 style={s.title}>You're in.<br />Welcome to GRADSKOOL.</h1>
          <p style={s.sub}>
            Your payment was successful. You'll receive confirmation and
            onboarding details on WhatsApp within a few hours.
          </p>

          <div style={s.steps}>
            <h2 style={s.stepsTitle}>What happens next</h2>
            {[
              'Save our WhatsApp number — +91 63605 97966',
              "You'll receive a WhatsApp message with your access details and cohort start date",
              'Check your email for the payment receipt from Razorpay',
              "If you don't hear from us within 24 hours, WhatsApp us directly",
            ].map((step, i) => (
              <div key={i} style={s.step}>
                <span style={s.stepNum}>{i + 1}</span>
                <p style={s.stepText}>{step}</p>
              </div>
            ))}
          </div>

          <div style={s.actions}>
            <a
              href="https://wa.me/916360597966"
              target="_blank"
              rel="noreferrer"
              style={s.btnPrimary}
            >
              💬 WhatsApp Us
            </a>
            <Link href="/" style={s.btnSecondary}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

const s = {
  page: {
    minHeight: '100vh', background: 'var(--gray-50)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: 'var(--white)', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)', padding: '3rem',
    maxWidth: '520px', width: '100%', textAlign: 'center',
  },
  checkCircle: {
    width: '64px', height: '64px', borderRadius: '50%',
    background: '#dcfce7', color: '#166534',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.75rem', fontWeight: '700',
    margin: '0 auto 1.5rem',
  },
  tag: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: '#166534', marginBottom: '0.5rem',
  },
  title: {
    fontFamily: 'var(--font-serif)', fontSize: '2.2rem',
    fontWeight: '700', color: 'var(--black)', lineHeight: '1.15',
    marginBottom: '1rem',
  },
  sub: {
    fontFamily: 'var(--font-serif)', fontSize: '1rem',
    color: 'var(--gray-600)', lineHeight: '1.75',
    marginBottom: '2rem',
  },
  steps: {
    background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '1.5rem',
    textAlign: 'left', marginBottom: '2rem',
  },
  stepsTitle: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--gray-400)', marginBottom: '1rem',
  },
  step: {
    display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
    marginBottom: '0.875rem',
  },
  stepNum: {
    width: '22px', height: '22px', borderRadius: '50%',
    background: 'var(--black)', color: 'var(--white)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700',
    flexShrink: 0,
  },
  stepText: {
    fontFamily: 'var(--font-serif)', fontSize: '0.9rem',
    color: 'var(--gray-700)', lineHeight: '1.6',
  },
  actions: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: {
    display: 'inline-block', background: '#25d366', color: 'var(--white)',
    padding: '0.8rem 1.75rem', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '700',
    textDecoration: 'none',
  },
  btnSecondary: {
    display: 'inline-block', background: 'none',
    border: '1px solid var(--gray-200)',
    color: 'var(--gray-500)', padding: '0.8rem 1.75rem',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', textDecoration: 'none',
  },
}

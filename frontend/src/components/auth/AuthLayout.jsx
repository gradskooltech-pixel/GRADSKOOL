/**
 * GRADSKOOL — AuthLayout
 *
 * Two-column layout for all auth pages.
 * Left:  Black brand panel — logo, tagline, proof points, quote
 * Right: White form panel — centered, max-width 420px
 *
 * Design tokens: Georgia serif + system sans, #ff5e5f red, #0f0f0f black
 */
import Link from 'next/link'
import Head from 'next/head'

const C = {
  red:    '#ff5e5f',
  black:  '#0f0f0f',
  white:  '#ffffff',
  gray400:'#999',
  gray300:'#bbb',
  border: '#1e1e1e',
}

const PROOF = [
  { val: '27',     label: "Students per cohort — always" },
  { val: '5,000+', label: 'IIM & top B-school calls' },
  { val: '99.93',  label: "ALP Sir's CAT percentile" },
  { val: '770',    label: "ALP Sir's GMAT score" },
]

const QUOTES = [
  { text: "The structure and execution are unlike anything I've experienced before. Two-way live classes changed how I think about problems.", author: 'Vanshaj Jaiman', detail: 'CAT 2026 Cohort' },
  { text: 'Being part of GRADSKOOL is something special. Every class is structured so a topic feels truly completed.', author: 'Keshav Mundra', detail: 'GMAT Cohort' },
]

export function AuthLayout({ children, title, description, quoteIndex = 0 }) {
  const quote = QUOTES[quoteIndex % QUOTES.length]

  return (
    <>
      <Head>
        <title>{title ? `${title} — GRADSKOOL` : 'GRADSKOOL'}</title>
        {description && <meta name="description" content={description} />}
        <meta name="robots" content="noindex" />
        <style>{`
          .auth-root {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .auth-brand { display: flex; }
          .auth-mobile-logo { display: none !important; }
          @media (max-width: 768px) {
            .auth-root  { grid-template-columns: 1fr; }
            .auth-brand { display: none !important; }
            .auth-mobile-logo { display: block !important; }
          }
        `}</style>
      </Head>

      <div className="auth-root">

        {/* LEFT — Brand panel */}
        <div className="auth-brand" style={s.brand}>
          <div style={s.brandInner}>

            <Link href="/" style={s.logo}>
              GRAD<span style={{ color: C.red }}>SKOOL</span>
            </Link>

            <div>
              <p style={s.eyebrow}>India's most structured</p>
              <h2 style={s.tagline}>
                CAT · GMAT · GRE<br />
                MBA entrance prep.
              </h2>
            </div>

            <div style={s.proofGrid}>
              {PROOF.map((p, i) => (
                <div key={i} style={s.proofItem}>
                  <span style={s.proofVal}>{p.val}</span>
                  <span style={s.proofLabel}>{p.label}</span>
                </div>
              ))}
            </div>

            <div style={s.quoteWrap}>
              <div style={s.quoteAccent} />
              <div style={s.quoteBody}>
                <p style={s.quoteText}>{quote.text}</p>
                <div>
                  <p style={s.quoteAuthorName}>{quote.author}</p>
                  <p style={s.quoteAuthorDetail}>{quote.detail}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT — Form panel */}
        <div style={s.formPanel}>
          <div style={s.formInner}>
            <Link href="/" className="auth-mobile-logo" style={s.mobileLogo}>
              GRAD<span style={{ color: C.red }}>SKOOL</span>
            </Link>
            {children}
          </div>
        </div>

      </div>
    </>
  )
}

const s = {
  brand: {
    background: C.black,
    alignItems: 'center',
    padding: '3.5rem',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflow: 'hidden',
  },
  brandInner: {
    display: 'flex', flexDirection: 'column',
    gap: '3rem', maxWidth: '420px',
  },
  logo: {
    fontFamily: 'Georgia, serif', fontSize: '1.6rem',
    fontWeight: '700', letterSpacing: '0.04em',
    color: C.white, textDecoration: 'none',
  },
  eyebrow: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
    fontWeight: '500', letterSpacing: '0.1em',
    textTransform: 'uppercase', color: C.red, marginBottom: '0.6rem',
  },
  tagline: {
    fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
    fontWeight: '700', color: C.white, lineHeight: '1.2',
  },
  proofGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
    padding: '1.75rem', background: '#111',
    borderRadius: '4px', border: `1px solid ${C.border}`,
  },
  proofItem: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  proofVal:  { fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontWeight: '700', color: C.white, lineHeight: '1' },
  proofLabel:{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: C.gray400, lineHeight: '1.4' },
  quoteWrap: { display: 'flex', gap: '1.25rem' },
  quoteAccent:{ width: '2px', background: C.red, flexShrink: 0, borderRadius: '2px' },
  quoteBody: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  quoteText: {
    fontFamily: 'Georgia, serif', fontSize: '0.9rem',
    color: C.gray300, fontStyle: 'italic', lineHeight: '1.75',
  },
  quoteAuthorName:  { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '600', color: C.white, marginBottom: '0.1rem' },
  quoteAuthorDetail:{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: C.gray400 },
  formPanel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '3rem 2rem', background: '#ffffff',
    overflowY: 'auto', minHeight: '100vh',
  },
  formInner: {
    width: '100%', maxWidth: '420px',
    display: 'flex', flexDirection: 'column',
  },
  mobileLogo: {
    fontFamily: 'Georgia, serif', fontSize: '1.4rem',
    fontWeight: '700', letterSpacing: '0.04em',
    color: C.black, textDecoration: 'none', marginBottom: '2.5rem',
  },
}

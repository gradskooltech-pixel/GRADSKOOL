import Head from 'next/head'
import Link from 'next/link'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found — GRADSKOOL</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={s.page}>
        <div style={s.card}>
          <p style={s.num}>404</p>
          <p style={s.tag}>Page Not Found</p>
          <h1 style={s.title}>
            This page doesn't exist.<br />
            <em style={s.em}>But your prep does.</em>
          </h1>
          <p style={s.sub}>
            The link may have moved or the URL might be wrong.
            Head back and find what you were looking for.
          </p>

          <Link href="/" style={s.btnPrimary}>Back to Home →</Link>

          <div style={s.links}>
            <p style={s.linksLabel}>Quick links</p>
            <div style={s.linksGrid}>
              {QUICK_LINKS.map(l => (
                <Link key={l.href} href={l.href} style={s.quickLink}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const QUICK_LINKS = [
  { href: '/courses/cat',   label: 'CAT 2026' },
  { href: '/courses/gmat',  label: 'GMAT' },
  { href: '/courses/gre',   label: 'GRE' },
  { href: '/courses/xat',   label: 'XAT' },
  { href: '/courses/ipmat', label: 'IPMAT' },
  { href: '/courses/clat',  label: 'Law UG' },
  { href: '/tools',         label: 'Free Tools' },
  { href: '/blog',          label: 'Blog' },
]

const s = {
  page: {
    minHeight: '100vh', background: 'var(--black)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    maxWidth: '520px', width: '100%', textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center',
  },
  num: {
    fontFamily: 'var(--font-serif)', fontSize: '6rem',
    fontWeight: '700', color: 'var(--red)', lineHeight: '1',
  },
  tag: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
  },
  title: {
    fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
    fontWeight: '700', color: 'var(--white)', lineHeight: '1.2',
  },
  em: { fontStyle: 'italic', fontWeight: '400', color: 'rgba(255,255,255,0.6)' },
  sub: {
    fontFamily: 'var(--font-serif)', fontSize: '1rem',
    color: 'rgba(255,255,255,0.45)', lineHeight: '1.7',
  },
  btnPrimary: {
    display: 'inline-block', background: 'var(--white)', color: 'var(--black)',
    padding: '0.875rem 2rem', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: '700',
    textDecoration: 'none', marginTop: '0.5rem',
  },
  links: {
    marginTop: '2rem', width: '100%',
    borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem',
  },
  linksLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.65rem', fontWeight: '700',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.25)', marginBottom: '1rem',
  },
  linksGrid: {
    display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center',
  },
  quickLink: {
    fontFamily: 'var(--font-sans)', fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '0.4rem 0.875rem', borderRadius: '100px',
    textDecoration: 'none',
  },
}

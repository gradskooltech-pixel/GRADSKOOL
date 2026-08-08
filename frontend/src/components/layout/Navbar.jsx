/**
 * GRADSKOOL — Navbar
 * Matches gradskool.in exactly:
 * Logo | Courses dropdown | Free Classes & Courses | Blog | About | FAQs | All Courses btn | Enrol Now btn
 * Mobile: hamburger → fullscreen overlay
 *
 * CHANGE (promotion shift): CAThlete is now the featured product — leads the
 * Courses dropdown, and the primary "Enrol Now" CTA points at it directly.
 * CATalysis 2026 → CATalysis 2027 (still open, just secondary now). Foundations
 * (free XAT/SNAP/NMAT classes) got its own top-level nav entry rather than
 * being buried in the Courses dropdown, since it's a different kind of
 * product (free, not a paid course) and needs its own visibility.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const COURSES_DROP = [
  { href:'/courses/cat/cathlete', label:'CAThlete — Crash Course' },
  { href:'/courses/cat/catalysis', label:'CATalysis 2027' },
  { href:'/courses/gmat',         label:'GMAT Focus Edition' },
  { href:'/courses/xat',          label:'XAT' },
  { href:'/courses/snap',         label:'SNAP Mocks' },
  { href:'/courses/nmat',         label:'NMAT Mocks' },
  { href:'/courses/nmat-snap',    label:'SNAP + NMAT Bundle' },
  { href:'/courses/mhcet',        label:'MH CET' },
  { href:'/courses/pi-wat-gd',    label:'PI WAT GD' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  // Close mobile nav on route change
  useEffect(() => {
    const close = () => setMobileOpen(false)
    router.events.on('routeChangeStart', close)
    return () => router.events.off('routeChangeStart', close)
  }, [router])

  // Lock body scroll when mobile nav open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <style>{`
        .gs-nav { position:sticky; top:0; z-index:100; background:rgba(255,255,255,.97); backdrop-filter:blur(10px); border-bottom:var(--border); height:62px; }
        .gs-nav-inner { display:flex; align-items:center; justify-content:space-between; height:100%; max-width:1200px; margin:0 auto; padding:0 40px; }
        .gs-logo { font-family:var(--font-serif); font-size:19px; font-weight:400; letter-spacing:.04em; color:var(--black); text-decoration:none; }
        .gs-nav-links { display:flex; align-items:center; gap:28px; }
        .gs-nav-link { font-family:var(--font-sans); font-size:13px; font-weight:500; color:var(--g700); transition:color var(--t); text-decoration:none; cursor:pointer; }
        .gs-nav-link:hover { color:var(--black); }
        /* Dropdown */
        .gs-drop { position:relative; }
        .gs-drop:hover .gs-drop-menu, .gs-drop:focus-within .gs-drop-menu { opacity:1; visibility:visible; transform:translateY(0); }
        .gs-drop-menu { position:absolute; top:calc(100% + 10px); left:50%; transform:translateX(-50%) translateY(-6px); background:#fff; border:var(--border); border-radius:4px; padding:6px 0; min-width:210px; box-shadow:var(--shadow); opacity:0; visibility:hidden; transition:all var(--t); z-index:200; }
        .gs-drop-item { display:block; padding:9px 16px; font-family:var(--font-sans); font-size:13px; color:var(--g700); transition:color var(--t),background var(--t); text-decoration:none; }
        .gs-drop-item:hover { color:var(--black); background:var(--off); }
        .gs-drop-divider { margin:6px 0; border-top:var(--border); }
        /* Buttons */
        .gs-btn { display:inline-flex; align-items:center; font-family:var(--font-sans); font-size:13px; font-weight:600; padding:10px 22px; border-radius:var(--radius); transition:all var(--t); text-decoration:none; border:2px solid transparent; white-space:nowrap; }
        .gs-btn-outline { background:transparent; color:var(--black); border-color:var(--g300); }
        .gs-btn-outline:hover { border-color:var(--black); }
        .gs-btn-red { background:var(--red); color:#fff; border-color:var(--red); }
        .gs-btn-red:hover { background:var(--red-hover); border-color:var(--red-hover); transform:translateY(-1px); }
        /* Burger */
        .gs-burger { display:none; flex-direction:column; gap:5px; cursor:pointer; padding:6px; background:none; border:none; }
        .gs-burger span { display:block; width:22px; height:2px; background:var(--black); border-radius:1px; transition:all var(--t); }
        /* Mobile nav */
        .gs-mob-nav { display:none; position:fixed; inset:0; background:#fff; z-index:99; padding:80px 32px 48px; flex-direction:column; overflow-y:auto; }
        .gs-mob-nav.open { display:flex; }
        .gs-mob-close { position:absolute; top:18px; right:24px; font-size:26px; color:var(--g500); padding:4px; cursor:pointer; background:none; border:none; font-family:inherit; }
        .gs-mob-label { font-family:var(--font-sans); font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--g500); margin-bottom:10px; }
        .gs-mob-section { margin-bottom:32px; }
        .gs-mob-link { display:block; font-family:var(--font-serif); font-size:22px; font-weight:400; color:var(--black); padding:8px 0; border-bottom:var(--border); text-decoration:none; }
        .gs-mob-link:last-child { border-bottom:none; }
        @media(max-width:960px) {
          .gs-nav-links, .gs-nav-actions-outline { display:none!important; }
          .gs-burger { display:flex; }
          .gs-nav-inner { padding:0 24px; }
        }
      `}</style>

      <nav className="gs-nav">
        <div className="gs-nav-inner">
          <Link href="/" className="gs-logo">GRADSKOOL</Link>

          <div className="gs-nav-links">
            {/* Courses dropdown */}
            <div className="gs-drop">
              <span className="gs-nav-link" tabIndex={0}>Courses ↓</span>
              <div className="gs-drop-menu">
                {COURSES_DROP.map(c => (
                  <Link key={c.href} href={c.href} className="gs-drop-item">{c.label}</Link>
                ))}
                <div className="gs-drop-divider" />
                <Link href="/pdfs" className="gs-drop-item">Digital PDFs — Notes &amp; Formula Sheets</Link>
              </div>
            </div>
            <Link href="/blog"  className="gs-nav-link">Blog</Link>
            <Link href="/free" className="gs-nav-link">Free Classes &amp; Courses</Link>
            <Link href="/fyqs" className="gs-nav-link">FYQs</Link>
            <Link href="/about" className="gs-nav-link">About</Link>
            <Link href="/faqs"  className="gs-nav-link">FAQs</Link>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px' }} className="gs-nav-actions">
            <Link href="/courses"  className="gs-btn gs-btn-outline gs-nav-actions-outline">All Courses</Link>
            <Link href="/checkout?course=cathlete" className="gs-btn gs-btn-red">Enrol Now →</Link>
          </div>

          <button className="gs-burger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className={`gs-mob-nav${mobileOpen ? ' open' : ''}`}>
        <button className="gs-mob-close" onClick={() => setMobileOpen(false)}>✕</button>
        <div className="gs-mob-section">
          <div className="gs-mob-label">Courses</div>
          {COURSES_DROP.map(c => (
            <Link key={c.href} href={c.href} className="gs-mob-link">{c.label}</Link>
          ))}
          <Link href="/pdfs" className="gs-mob-link">Digital PDFs</Link>
        </div>
        <div className="gs-mob-section">
          <div className="gs-mob-label">More</div>
          <Link href="/blog"   className="gs-mob-link">Blog</Link>
          <Link href="/free" className="gs-mob-link">Free Classes &amp; Courses</Link>
          <Link href="/fyqs" className="gs-mob-link">FYQs</Link>
          <Link href="/about"  className="gs-mob-link">About ALP Sir</Link>
          <Link href="/faqs"   className="gs-mob-link">FAQs</Link>
        </div>
        <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:'10px', paddingTop:'24px' }}>
          <Link href="/checkout?course=cathlete" className="gs-btn gs-btn-red" style={{ justifyContent:'center' }}>Enrol Now →</Link>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20more%20about%20GRADSKOOL"
            target="_blank" rel="noopener noreferrer" className="gs-btn gs-btn-outline" style={{ justifyContent:'center' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#25D366', flexShrink:0, marginRight:6 }} />
            WhatsApp ALP Sir
          </a>
        </div>
      </div>
    </>
  )
}
/**
 * GRADSKOOL — OMETs Hub Page
 * Route: /omets (also omets.gradskool.in root)
 * All non-CAT MBA entrance exams: XAT, NMAT, SNAP, MAHCET, CMAT, GMAT, NMAT+SNAP bundle
 */
import Head from 'next/head'
import Link from 'next/link'

const R = { color:'var(--red)' }

const COURSES = [
  {
    href:    '/courses/xat',
    tag:     'XAT 2026 · Live + Self-Paced',
    name:    'XAT',
    full:    'Xavier Aptitude Test',
    price:   '₹5,999',
    desc:    'XLRI Jamshedpur, XIM University, IMT Ghaziabad. Includes Decision Making — the section that separates XAT from every other exam.',
    colleges:['XLRI Jamshedpur','XIM University','IMT Ghaziabad','SP Jain'],
    freeUrl: '/foundations/xat',
  },
  {
    href:    '/courses/nmat',
    tag:     'NMAT 2026 · Mocks',
    name:    'NMAT',
    full:    'NMAT by GMAC',
    price:   '₹2,999',
    desc:    'NMIMS Mumbai, Bangalore, Hyderabad. 3 attempts allowed per cycle. No negative marking.',
    colleges:['NMIMS Mumbai','NMIMS Bangalore','NMIMS Hyderabad','Alliance'],
    freeUrl: '/courses/nmat/live',
  },
  {
    href:    '/courses/snap',
    tag:     'SNAP 2026 · Mocks',
    name:    'SNAP',
    full:    'Symbiosis National Aptitude Test',
    price:   '₹2,999',
    desc:    'All 15+ Symbiosis institutes including SCMHRD, SIBM, SIIB. Shorter format, no negative marking.',
    colleges:['SCMHRD Pune','SIBM Pune','SIIB Pune','SCIT Pune'],
    freeUrl: '/courses/snap/live',
  },
  {
    href:    '/courses/nmat-snap',
    tag:     'Bundle · Mocks',
    name:    'SNAP + NMAT',
    full:    'Both together — save ₹1,499',
    price:   '₹4,499',
    desc:    'Both exams share significant content. Take both at one price.',
    colleges:['NMIMS Mumbai','SCMHRD Pune','SIBM Pune','NMIMS Bangalore'],
  },
  {
    href:    '/courses/mhcet',
    tag:     'MAHCET 2026 · Live + Self-Paced',
    name:    'MAHCET',
    full:    'Maharashtra MBA CET',
    price:   '₹7,999',
    desc:    'JBIMS Mumbai, SIMSREE, KJ Somaiya, WeSchool. The gateway to Maharashtra\'s best MBA colleges.',
    colleges:['JBIMS Mumbai','SIMSREE','KJ Somaiya','WeSchool'],
    foundation: false,
  },
  {
    href:    '/courses/gmat',
    tag:     'GMAT · Self-Paced',
    name:    'GMAT Focus',
    full:    'GMAT Focus Edition',
    price:   '₹19,999',
    desc:    'ISB Hyderabad, IIM PGPX, global MBAs. Taught by ALP Sir — 770 GMAT scorer.',
    colleges:['ISB Hyderabad','IIM Ahmedabad PGPX','IIM Bangalore PGPX','INSEAD'],
    foundation: false,
  },
  {
    href:    '/courses/cmat',
    tag:     'CMAT 2026 · Self-Paced',
    name:    'CMAT',
    full:    'Common Management Admission Test',
    price:   'Coming soon',
    desc:    'AICTE-approved MBA colleges. Covers QA, LR, Language Comprehension, General Awareness.',
    colleges:['JBIMS Mumbai','K J Somaiya','SIES','Great Lakes'],
    foundation: false,
  },
]

export default function OMETsHub() {
  return (
    <>
      <Head>
        <title>OMETs Preparation — GRADSKOOL | XAT · NMAT · SNAP · MAHCET · CMAT · GMAT</title>
        <meta name="description" content="GRADSKOOL OMETs preparation — XAT, NMAT, SNAP, MAHCET, CMAT, GMAT. Live sessions and self-paced courses by ALP Sir." />
        <link rel="canonical" href="https://gradskool.in/omets" />
      </Head>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:var(--font-sans);color:var(--black);background:#fff;-webkit-font-smoothing:antialiased;overflow-x:hidden}
        a{text-decoration:none;color:inherit}
        .container{max-width:1200px;margin:0 auto;padding:0 40px}
        .eyebrow{font-family:var(--font-sans);font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--g500);display:flex;align-items:center;gap:8px}
        .eyebrow .dot{width:5px;height:5px;border-radius:50%;background:var(--red);flex-shrink:0}
        .d-xl{font-family:var(--font-serif);font-size:clamp(36px,5vw,60px);font-weight:400;line-height:1.03;letter-spacing:-.02em;color:var(--black)}
        .d-lg{font-family:var(--font-serif);font-size:clamp(26px,3.2vw,38px);font-weight:400;line-height:1.12;letter-spacing:-.015em;color:var(--black)}
        .btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-sans);font-size:13px;font-weight:600;padding:12px 26px;border-radius:var(--radius);transition:all var(--t);text-decoration:none;border:2px solid transparent;white-space:nowrap}
        .btn-red{background:var(--red);color:#fff;border-color:var(--red)}
        .btn-red:hover{background:var(--red-hover);transform:translateY(-1px)}
        .btn-ghost{background:transparent;color:#fff;border-color:#444}
        .btn-ghost:hover{border-color:#fff}
        .btn-outline{background:transparent;color:var(--black);border-color:var(--g300)}
        .btn-outline:hover{border-color:var(--black)}
        .wa-dot{width:8px;height:8px;border-radius:50%;background:#25D366;flex-shrink:0}
        .wa-float{position:fixed;bottom:28px;right:28px;z-index:999;display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;font-family:var(--font-sans);font-size:13px;font-weight:600;padding:13px 22px;border-radius:50px;box-shadow:0 4px 20px rgba(37,211,102,.38);text-decoration:none}
        .wa-float:hover{transform:translateY(-2px)}
        @media(max-width:960px){.container{padding:0 24px}}
      `}</style>

      {/* ── HERO ── */}
      <section style={{ background:'var(--black)', padding:'72px 0 64px', borderBottom:'1px solid #333' }}>
        <div className="container">
          <div className="eyebrow" style={{ marginBottom:20, color:'var(--g500)' }}>
            <span className="dot" />XAT · NMAT · SNAP · MAHCET · CMAT · GMAT
          </div>
          <h1 className="d-xl" style={{ color:'#fff', marginBottom:20 }}>
            OMETs.<br /><em style={R}>Beyond CAT.</em>
          </h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g500)', lineHeight:1.85, maxWidth:540, marginBottom:36 }}>
            All non-CAT MBA entrance exams. Live courses, self-paced courses, and free Foundation classes for XAT, NMAT, and SNAP — taught by ALP Sir.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20want%20to%20know%20about%20OMETs%20preparation"
              target="_blank" rel="noopener noreferrer" className="btn btn-red">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
            <Link href="#courses" className="btn btn-ghost">View all courses →</Link>
          </div>
        </div>
      </section>

      {/* ── COURSES GRID ── */}
      <section id="courses" style={{ padding:'72px 0', borderBottom:'1px solid var(--g200)' }}>
        <div className="container">
          <div style={{ marginBottom:40 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />All OMETs courses</div>
            <h2 className="d-lg">Pick your exam.<br /><em style={R}>We have it covered.</em></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:1, background:'var(--g200)', border:'1px solid var(--g200)', borderRadius:4, overflow:'hidden' }}>
            {COURSES.map(c => (
              <div key={c.href} style={{ background:'#fff', padding:'28px 28px 24px' }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginBottom:8 }}>{c.tag}</div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)', marginBottom:2, lineHeight:1.2 }}>{c.name}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)', marginBottom:12 }}>{c.full}</div>
                <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.75, marginBottom:16 }}>{c.desc}</p>
                {/* Mini college list */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:20 }}>
                  {c.colleges.map(col => (
                    <span key={col} style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:500, padding:'2px 7px', border:'1px solid var(--g200)', borderRadius:2, color:'var(--g700)', background:'var(--off)' }}>{col}</span>
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid var(--g200)' }}>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)' }}>{c.price}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {c.freeUrl && (
                      <Link href={c.freeUrl}
                        style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:600, padding:'7px 12px', border:'1px solid var(--g300)', borderRadius:2, color:'var(--g700)', background:'#fff' }}>
                        Free classes
                      </Link>
                    )}
                    <Link href={c.href} className="btn btn-red" style={{ padding:'8px 18px', fontSize:12 }}>
                      View course →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUNDATIONS STRIP ── */}
      <section style={{ padding:'48px 0', borderBottom:'1px solid var(--g200)', background:'var(--off)' }}>
        <div className="container">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom:12 }}><span className="dot" />Free on YouTube</div>
              <h2 className="d-lg" style={{ marginBottom:8 }}>Foundations — <em style={R}>start here.</em></h2>
              <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', maxWidth:480, lineHeight:1.8 }}>
                XAT Foundations to get you started, and the complete NMAT and SNAP courses — taught live by ALP Sir, entirely free.
              </p>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {[['XAT Foundations', '/foundations/xat'], ['NMAT — Complete Course, Free', '/courses/nmat/live'], ['SNAP — Complete Course, Free', '/courses/snap/live']].map(([label, href]) => (
                <Link key={href} href={href} className="btn btn-outline" style={{ fontSize:12, padding:'10px 18px' }}>
                  {label} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background:'var(--black)', padding:'72px 0', textAlign:'center' }}>
        <div className="container">
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(26px,4vw,44px)', fontWeight:400, color:'#fff', marginBottom:14 }}>
            Not sure which exam?<br /><em style={R}>Ask ALP Sir directly.</em>
          </h2>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g500)', lineHeight:1.8, maxWidth:400, margin:'0 auto 32px' }}>
            Tell him your target colleges and profile. He'll tell you which exams to take and which courses make sense.
          </p>
          <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20I%20am%20not%20sure%20which%20OMETs%20to%20take"
            target="_blank" rel="noopener noreferrer" className="btn btn-red" style={{ display:'inline-flex' }}>
            <span className="wa-dot" />WhatsApp ALP Sir
          </a>
        </div>
      </section>

      <a href="https://wa.me/917838737388?text=Hi%20ALP%20Sir%2C%20about%20OMETs" target="_blank" rel="noopener noreferrer" className="wa-float">
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width:19,height:19,flexShrink:0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp ALP Sir
      </a>
    </>
  )
}

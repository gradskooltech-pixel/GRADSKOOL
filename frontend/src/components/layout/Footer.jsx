/**
 * GRADSKOOL — Footer
 * Matches gradskool.in exactly
 */
import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ padding:'60px 0 32px', background:'#1a1a18' }}>
      <style>{`
        .gs-footer-inner { max-width:1200px; margin:0 auto; padding:0 40px; }
        .gs-footer-top { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:48px; padding-bottom:40px; border-bottom:1px solid #333; margin-bottom:24px; }
        .gs-footer-col h4 { font-family:var(--font-sans); font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:#666; margin-bottom:14px; }
        .gs-footer-col a { display:block; font-family:var(--font-sans); font-size:13px; color:#888; margin-bottom:9px; transition:color var(--t); text-decoration:none; }
        .gs-footer-col a:hover { color:#fff; }
        .gs-footer-soc { width:32px; height:32px; border:1px solid #333; display:flex; align-items:center; justify-content:center; font-family:var(--font-sans); font-size:10px; font-weight:600; color:#888; border-radius:2px; transition:all var(--t); text-decoration:none; }
        .gs-footer-soc:hover { border-color:#fff; color:#fff; }
        .gs-eco-link { font-family:var(--font-sans); font-size:13px; font-weight:500; color:#888; transition:color var(--t); text-decoration:none; display:block; margin-bottom:7px; }
        .gs-eco-link:hover { color:#fff; }
        @media(max-width:960px) { .gs-footer-inner{padding:0 24px;} .gs-footer-top{grid-template-columns:1fr 1fr;gap:32px;} }
        @media(max-width:600px) { .gs-footer-top{grid-template-columns:1fr;} }
      `}</style>
      <div className="gs-footer-inner">
        <div className="gs-footer-top">
          {/* Brand col */}
          <div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:19, letterSpacing:'.04em', color:'#fff', marginBottom:10 }}>GRADSKOOL</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#7a7974', lineHeight:1.75, maxWidth:220, marginBottom:20 }}>
              India's most structured preparation for CAT and GMAT. Live two-way sessions. 27 students per cohort.
            </p>
            <div style={{ display:'flex', gap:6, marginBottom:24 }}>
              {[
                ['IG',   'https://www.instagram.com/gradskool_mba/'],
                ['YT',   'https://www.youtube.com/@GRADSKOOLCAT'],
                ['LI',   'https://www.linkedin.com/company/109993184/'],
                ['FB',   'https://www.facebook.com/groups/2450369525365242'],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="gs-footer-soc">{label}</a>
              ))}
            </div>
            <div style={{ paddingTop:20, borderTop:'1px solid #333' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#666', marginBottom:8 }}>Free Learning Ecosystem</p>
              <a href="https://gradflix.in" target="_blank" rel="noopener noreferrer" className="gs-eco-link">GRADFLIX — Essays &amp; RC Practice ↗</a>
              <a href="https://www.gradscale.in" target="_blank" rel="noopener noreferrer" className="gs-eco-link">GRADSCALE — Daily Quizzes ↗</a>
            </div>
          </div>

          {/* Courses */}
          <div className="gs-footer-col">
            <h4>Courses</h4>
            <Link href="/courses/cat/cathlete">CAThlete — Crash Course</Link>
            <Link href="/courses/cat/catalysis">CATalysis 2027</Link>
            <Link href="/courses/cat/alpgebra">ALPgebra</Link>
            <Link href="/courses/gmat">GMAT</Link>
            <Link href="/courses/xat">XAT</Link>
            <Link href="/courses/snap">SNAP</Link>
            <Link href="/courses/nmat">NMAT</Link>
            <Link href="/courses/nmat-snap">SNAP + NMAT Bundle</Link>
            <Link href="/courses/mhcet">MH CET</Link>
            <Link href="/courses/pi-wat-gd">PI WAT GD</Link>
          </div>

          {/* Resources */}
          <div className="gs-footer-col">
            <h4>Resources</h4>
            <Link href="/blog">Blog</Link>
            <Link href="/free">Free Classes &amp; Courses</Link>
            <Link href="/pdfs">Digital PDFs</Link>
            <Link href="/faqs">FAQs</Link>
            <Link href="/about">About ALP Sir</Link>
            <a href="https://gradflix.in" target="_blank" rel="noopener noreferrer">GRADFLIX ↗</a>
            <a href="https://www.gradscale.in" target="_blank" rel="noopener noreferrer">GRADSCALE ↗</a>
          </div>

          {/* Legal + Contact */}
          <div className="gs-footer-col">
            <h4>Legal</h4>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
            <h4 style={{ marginTop:22 }}>Contact</h4>
            <a href="https://wa.me/917838737388" target="_blank" rel="noopener noreferrer">WhatsApp ALP Sir</a>
            <a href="mailto:gradskoolindia@gmail.com">gradskoolindia@gmail.com</a>
            <a href="https://abhishekleelapandey.com" target="_blank" rel="noopener noreferrer">abhishekleelapandey.com ↗</a>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'#666' }}>© 2026 GRADSKOOL Learning. All rights reserved.</span>
          <div style={{ display:'flex', gap:20 }}>
            {[['Privacy','/privacy-policy'],['Refunds','/refund-policy'],['Terms','/terms']].map(([l,h])=>(
              <Link key={h} href={h} style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'#666', textDecoration:'none' }}
                onMouseEnter={e=>e.target.style.color='#fff'} onMouseLeave={e=>e.target.style.color='#666'}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
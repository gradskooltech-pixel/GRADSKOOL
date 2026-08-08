/**
 * GRADSKOOL — CourseLayout
 * Shared shell for all course landing pages.
 * Matches the real site structure exactly.
 */
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export const S = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
  body{font-family:var(--font-sans);color:var(--black);background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{text-decoration:none;color:inherit}
  img,video{max-width:100%;display:block}
  button{border:none;background:none;cursor:pointer;font-family:inherit}
  .eyebrow{font-family:var(--font-sans);font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--g500);display:flex;align-items:center;gap:8px}
  .eyebrow .dot{width:5px;height:5px;border-radius:50%;background:var(--red);flex-shrink:0}
  .d-xl{font-family:var(--font-serif);font-size:clamp(36px,5vw,60px);font-weight:400;line-height:1.03;letter-spacing:-.02em}
  .d-lg{font-family:var(--font-serif);font-size:clamp(26px,3.2vw,38px);font-weight:400;line-height:1.12;letter-spacing:-.015em}
  .btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-sans);font-size:13px;font-weight:600;padding:12px 26px;border-radius:var(--radius);transition:all var(--t);text-decoration:none;border:2px solid transparent;white-space:nowrap}
  .btn-red{background:var(--red);color:#fff;border-color:var(--red)}
  .btn-red:hover{background:var(--red-hover);transform:translateY(-1px);box-shadow:0 4px 12px rgba(217,79,80,.3)}
  .btn-ghost{background:transparent;color:#fff;border-color:#444}
  .btn-ghost:hover{border-color:#fff}
  .btn-outline{background:transparent;color:var(--black);border-color:var(--g300)}
  .btn-outline:hover{border-color:var(--black)}
  .btn-wa{background:transparent;color:var(--black);border-color:var(--g200)}
  .btn-wa:hover{border-color:#25D366}
  .wa-dot{width:8px;height:8px;border-radius:50%;background:#25D366;flex-shrink:0}
  .link-arr{font-family:var(--font-sans);font-size:13px;font-weight:500;color:var(--g700);border-bottom:1px solid var(--g300);padding-bottom:2px;transition:color var(--t),border-color var(--t);text-decoration:none}
  .link-arr:hover{color:var(--black);border-color:var(--black)}
  .container{max-width:1200px;margin:0 auto;padding:0 40px}
  .section{padding:72px 0;border-bottom:var(--border)}
  .stages{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .stage-card{background:#fff;padding:28px 20px;position:relative}
  .stage-card:hover{background:var(--off)}
  .stage-bg{position:absolute;top:10px;right:14px;font-family:var(--font-serif);font-size:52px;font-weight:700;color:var(--g100);line-height:1;user-select:none}
  .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .testi-card{background:#fff;padding:32px;display:flex;flex-direction:column}
  .syllabus-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--g200);border:var(--border);border-radius:4px;overflow:hidden}
  .syl-col{background:#fff;padding:26px 22px}
  .faq-item{border-bottom:var(--border)}
  .faq-q{width:100%;padding:18px 0;display:flex;justify-content:space-between;align-items:center;font-family:var(--font-serif);font-size:16px;color:var(--black);cursor:pointer;text-align:left;gap:16px;background:none;border:none}
  .faq-a{font-family:var(--font-body);font-size:14px;color:var(--g700);line-height:1.9;padding-bottom:18px}
  .mob-sticky{display:none;position:fixed;bottom:0;left:0;right:0;z-index:998;background:#fff;border-top:var(--border);padding:12px 20px;align-items:center;justify-content:space-between;box-shadow:0 -4px 20px rgba(0,0,0,.1)}
  .wa-float{position:fixed;bottom:28px;right:28px;z-index:999;display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;font-family:var(--font-sans);font-size:13px;font-weight:600;padding:13px 22px;border-radius:50px;box-shadow:0 4px 20px rgba(37,211,102,.38);transition:transform var(--t);text-decoration:none}
  .wa-float:hover{transform:translateY(-2px)}
  @media(max-width:960px){
    .container{padding:0 24px}
    .stages{grid-template-columns:repeat(2,1fr)}
    .testi-grid{grid-template-columns:1fr}
    .syllabus-grid{grid-template-columns:1fr}
    .mob-sticky{display:flex}
    .wa-float{bottom:86px;right:16px;padding:11px 18px}
  }
  @media(max-width:600px){.stages{grid-template-columns:1fr}.section{padding:48px 0}}
`

export function CourseFaqAccordion({ faqs }) {
  const [open, setOpen] = useState(null)
  return (
    <div>
      {faqs.map((faq, i) => (
        <div key={i} className="faq-item">
          <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{faq.q}</span>
            <span style={{ flexShrink:0, color:'var(--red)', fontSize:18, transition:'transform .2s', transform: open===i ? 'rotate(45deg)' : 'none' }}>+</span>
          </button>
          {open === i && <div className="faq-a">{faq.a}</div>}
        </div>
      ))}
    </div>
  )
}

export function WaFloat({ msg }) {
  return (
    <a href={`https://wa.me/917838737388?text=${encodeURIComponent(msg)}`}
      target="_blank" rel="noopener noreferrer" className="wa-float">
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width:19,height:19,flexShrink:0 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      WhatsApp ALP Sir
    </a>
  )
}

export function CourseTestimonials({ testis }) {
  return (
    <div className="testi-grid">
      {testis.map((t, i) => (
        <article key={i} className="testi-card">
          <div style={{ fontFamily:'var(--font-serif)', fontSize:40, color:'var(--g200)', lineHeight:1, marginBottom:14 }}>"</div>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.9, fontStyle:'italic', flex:1, marginBottom:20 }}>{t.text}</p>
          <div style={{ borderTop:'var(--border)', paddingTop:14 }}>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:15, color:'var(--black)', marginBottom:2 }}>{t.name}</div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>{t.detail}</div>
            <div style={{ color:'var(--red)', fontSize:12, marginTop:4 }}>★★★★★</div>
          </div>
        </article>
      ))}
    </div>
  )
}

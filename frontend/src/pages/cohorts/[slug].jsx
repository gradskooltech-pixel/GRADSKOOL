/**
 * GRADSKOOL — Cohort Launch Page
 * Route: /cohorts/[slug]
 *
 * Standalone shareable page for a specific cohort.
 * Designed for sharing on WhatsApp, Instagram, email.
 *
 * Shows:
 *   - Exam name + cohort label
 *   - Seats remaining (live)
 *   - Countdown to start date
 *   - What's included
 *   - How cohort works (4 steps)
 *   - Who is this for
 *   - Pricing + enrol CTA
 *   - FAQ
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const WA  = 'https://wa.me/916360597966'

export async function getStaticPaths() {
  return { paths: [], fallback: true }
}

export async function getStaticProps({ params }) {
  try {
    const res = await fetch(`${API}/courses/cohorts/${params.slug}/`)
    if (!res.ok) return { notFound: true }
    const cohort = await res.json()
    if (cohort.error) return { notFound: true }
    return { props: { cohort }, revalidate: 60 }
  } catch {
    return { notFound: true }
  }
}

// ── WHAT'S INCLUDED per exam ──────────────────────────────────────────────────
const EXAM_INCLUDES = {
  cat:    ['30 full-length CAT mocks + 30 sectional tests','400+ hours of live two-way sessions','VARC, DILR and QA — complete coverage','Daily structured practice sets','Post-mock strategic analysis every test','Recorded session access','GDPI preparation included'],
  xat:    ['6 full-length XAT mocks + 12 sectional tests','Live two-way sessions with ALP Sir','Decision Making — complete dedicated module','VALR and QADI — full coverage','XLRI PI preparation included','Recorded session access'],
  snap:   ['20 full-length SNAP mocks + 12 sectional tests','Live two-way sessions with ALP Sir','No sectional time-limit strategy','All 3 sections — English, LR, QA','SIBM Pune GE-PI preparation','Recorded session access'],
  nmat:   ['10 full-length NMAT mocks + 12 sectional tests','Live two-way sessions with ALP Sir','Section order choice strategy','No negative marking — attempt maximisation','NMIMS Competency Test preparation','Recorded session access'],
  gmat:   ['Official GMAT Focus mocks + sectional tests','Live two-way sessions with ALP Sir','Quantitative, Verbal and Data Insights','Score improvement personalised plan','School selection and application guidance'],
  gre:    ['Official ETS PowerPrep mocks + practice tests','Live two-way sessions with ALP Sir','5,000-word vocabulary programme','AWA essay with individual written feedback','University shortlisting guidance'],
  ipmat:  ['89 full-length mocks across 12 programmes','Live two-way sessions with ALP Sir','IIM Indore Short Answer strategy','PI and WAT preparation','19 printed books (select plans)'],
  cmat:   ['12 full-length CMAT mocks + 15 sectional tests','Live two-way sessions with ALP Sir','Innovation & Entrepreneurship module','JBIMS / SIMSREE GD-PI preparation','All 5 sections — complete coverage'],
  mhcet:  ['Full-length MH CET mocks + sectional tests','Live two-way sessions with ALP Sir','LR, Abstract, QA, VA — complete','No-negative-marking speed strategy','JBIMS / SIMSREE GD-PI preparation'],
  clat:   ['10 CLAT + 5 AILET + 3 LNAT mocks','Live two-way sessions with ALP Sir','Legal Reasoning from first principles','Daily current affairs programme','21 printed books (select plans)'],
  cuet:   ['40 online mocks — Paper I, III, Commerce','Live two-way sessions with ALP Sir','NCERT-aligned domain subject coverage','Performance analytics after every mock'],
  'pi-wat-gd': ['Panel-format mock PI sessions','Group Discussion rounds — all 3 formats','WAT preparation + AWT for IIM-A','GK PDFs for current interview season','Graduation subject preparation PDFs','1-on-1 sessions with ALP Sir'],
}

const DEFAULT_INCLUDES = [
  'Live two-way sessions with ALP Sir',
  'Full-length mocks with post-test analysis',
  'Daily structured practice sets',
  'Doubt resolution every session',
  'Recorded session access',
]

const HOW_STEPS = [
  { num:'01', title:'Live Session', body:'Two-way live class where you articulate reasoning aloud. Every concept built through structured questioning — not passive watching.' },
  { num:'02', title:'Daily Practice', body:'Targeted practice sets after each session. Questions chosen to reinforce specific thinking patterns — not random drilling.', link:{ href:'https://www.gradscale.in/', text:'Practice on GRADSCALE' } },
  { num:'03', title:'Mock Test', body:'Full-length mocks at regular intervals under timed exam conditions. Every attempt designed to surface your actual behavioural patterns.' },
  { num:'04', title:'Post-Test Analysis', body:'Detailed breakdown of every mock — time distribution, attempt vs accuracy, blind spots, and a personalised action plan for the next test.' },
]

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function CohortPage({ cohort }) {
  const router = useRouter()

  if (router.isFallback) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia,serif', color:'#999' }}>
        Loading…
      </div>
    )
  }

  if (!cohort) return null

  const includes      = EXAM_INCLUDES[cohort.exam_slug] || DEFAULT_INCLUDES
  const seatsLeft     = cohort.remaining ?? (cohort.batch_size - (cohort.enrolled || 0))
  const seatsTotal    = cohort.batch_size || 27
  const seatsPct      = Math.round(((seatsTotal - seatsLeft) / seatsTotal) * 100)
  const isFull        = cohort.is_full || seatsLeft <= 0
  const enrolHref     = cohort.enrol_url || WA

  return (
    <>
      <Head>
        <title>{cohort.title} — {cohort.cohort_label || 'New Cohort'} — GRADSKOOL</title>
        <meta name="description" content={cohort.description || `${cohort.exam_name} preparation cohort. ${seatsLeft} seats remaining. Live two-way sessions by Abhishek Leela Pandey.`} />
        <meta property="og:title" content={`${cohort.title} — GRADSKOOL`} />
        <meta property="og:description" content={`${seatsLeft} seats left. Starting ${cohort.start_date ? new Date(cohort.start_date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : 'soon'}.`} />
      </Head>

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8e8e6', padding:'0.875rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href="/" style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', textDecoration:'none', color:'#0f0f0f' }}>
          <span style={{ color:'#ff5e5f' }}>GRAD</span>SKOOL
        </Link>
        <Link href={`/courses/${cohort.exam_slug}`} style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#999', textDecoration:'none' }}>
          View Full {cohort.exam_short} Course →
        </Link>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{ background:'#0f0f0f', padding:'5rem 2rem 4rem', borderBottom:'3px solid #ff5e5f' }}>
        <div style={{ maxWidth:'820px', margin:'0 auto' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'#ff5e5f', marginBottom:'0.875rem' }}>
            {cohort.cohort_label || 'New Cohort'} · {cohort.exam_short}
          </p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2rem,5vw,3.5rem)', fontWeight:'700', color:'#fff', lineHeight:'1.1', marginBottom:'1rem' }}>
            {cohort.title}
          </h1>
          {cohort.description && (
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', color:'rgba(255,255,255,0.65)', lineHeight:'1.75', maxWidth:'600px', marginBottom:'2.5rem' }}>
              {cohort.description}
            </p>
          )}

          {/* Seats + start date pills */}
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'2.5rem' }}>
            <SeatsIndicator seatsLeft={seatsLeft} seatsTotal={seatsTotal} seatsPct={seatsPct} isFull={isFull} />
            {cohort.start_date && (
              <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'4px', padding:'0.875rem 1.25rem' }}>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:'0.2rem' }}>Starts</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:'#fff' }}>
                  {new Date(cohort.start_date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                </p>
              </div>
            )}
            <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'4px', padding:'0.875rem 1.25rem' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:'0.2rem' }}>Batch Size</p>
              <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:'#fff' }}>{seatsTotal} students max</p>
            </div>
          </div>

          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
            <a href={isFull ? WA : enrolHref} target="_blank" rel="noreferrer"
              style={{ display:'inline-block', background:'#ff5e5f', color:'#fff', padding:'1rem 2.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.95rem', fontWeight:'800', textDecoration:'none' }}>
              {isFull ? 'Join Waitlist →' : 'Enrol / Enquire →'}
            </a>
            <a href={WA} target="_blank" rel="noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', color:'rgba(255,255,255,0.65)', padding:'1rem 1.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', textDecoration:'none', border:'1px solid rgba(255,255,255,0.15)' }}>
              💬 WhatsApp ALP Sir
            </a>
          </div>
        </div>
      </div>

      {/* ── COUNTDOWN ────────────────────────────────────────────────────── */}
      {cohort.start_date && cohort.status === 'upcoming' && (
        <CountdownBanner startDate={cohort.start_date} />
      )}

      {/* ── WHAT'S INCLUDED ──────────────────────────────────────────────── */}
      <div style={{ padding:'5rem 2rem', background:'#fff', borderBottom:'1px solid #e8e8e6' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto' }}>
          <p style={eye}>What You Get</p>
          <h2 style={h2}>Everything included in this cohort</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.875rem', marginTop:'2rem' }}>
            {includes.map((item, i) => (
              <div key={i} style={{ display:'flex', gap:'0.875rem', padding:'1.25rem', border:'1px solid #e8e8e6', borderRadius:'4px', background:'#fafaf9' }}>
                <span style={{ color:'#22c55e', fontWeight:'700', fontSize:'1rem', flexShrink:0 }}>✓</span>
                <span style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:'#444', lineHeight:'1.6' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <div style={{ padding:'5rem 2rem', background:'#0f0f0f', borderBottom:'1px solid #1a1a1a' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto' }}>
          <p style={{ ...eye, color:'#ff5e5f' }}>The Process</p>
          <h2 style={{ ...h2, color:'#fff', marginBottom:'3rem' }}>How a GRADSKOOL cohort works</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'2rem' }}>
            {HOW_STEPS.map(step => (
              <div key={step.num}>
                <span style={{ fontFamily:'Georgia,serif', fontSize:'2.5rem', fontWeight:'700', color:'#ff5e5f', display:'block', marginBottom:'0.75rem' }}>{step.num}</span>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:'#fff', marginBottom:'0.5rem' }}>{step.title}</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:'rgba(255,255,255,0.5)', lineHeight:'1.75' }}>{step.body}</p>
                {step.link && (
                  <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                    style={{ display:'inline-block', marginTop:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:600, color:'#ff5e5f' }}>
                    {step.link.text} →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHO IS THIS FOR ──────────────────────────────────────────────── */}
      <div style={{ padding:'5rem 2rem', background:'#fafaf9', borderBottom:'1px solid #e8e8e6' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'start' }}>
          <div>
            <p style={eye}>Who Should Join</p>
            <h2 style={h2}>This cohort is for you if…</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1.5rem' }}>
              {[
                'You are serious about cracking ' + cohort.exam_short + ' this cycle',
                'You want two-way live teaching — not recorded lectures',
                'You want a structured programme, not a pile of PDFs',
                'You learn best when you can ask questions mid-session',
                'You understand that 27 students means you actually get attention',
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', gap:'0.75rem' }}>
                  <span style={{ color:'#ff5e5f', fontWeight:'700', flexShrink:0 }}>→</span>
                  <span style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:'#555', lineHeight:'1.6' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={eye}>Who Should Not Join</p>
            <h2 style={{ ...h2, color:'#999' }}>This is not for you if…</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1.5rem' }}>
              {[
                'You are looking for cheap content to passively watch',
                'You plan to join but rarely attend or miss most sessions',
                'You want someone to just give you shortcuts without understanding',
                'You are not willing to attempt mocks under timed conditions',
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', gap:'0.75rem', opacity:'0.6' }}>
                  <span style={{ color:'#999', fontWeight:'700', flexShrink:0 }}>✕</span>
                  <span style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:'#777', lineHeight:'1.6' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ABOUT ALP SIR ────────────────────────────────────────────────── */}
      <div style={{ padding:'5rem 2rem', background:'#fff', borderBottom:'1px solid #e8e8e6' }}>
        <div style={{ maxWidth:'720px', margin:'0 auto', textAlign:'center' }}>
          <p style={eye}>Your Mentor</p>
          <h2 style={{ ...h2, marginBottom:'1.25rem' }}>Abhishek Leela Pandey</h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'#666', lineHeight:'1.85', marginBottom:'1.5rem' }}>
            ALP Sir has personally mentored 100,000+ students across CAT, GMAT, GRE, XAT, IPMAT and more.
            99.93 CAT percentile. 770 GMAT. Author of 16 books on MBA preparation.
            Every session is live and two-way — because passive watching doesn't build exam-day thinking.
          </p>
          <div style={{ display:'flex', gap:'2rem', justifyContent:'center', flexWrap:'wrap' }}>
            {[['100K+','Students Mentored'],['99.93','CAT Percentile'],['770','GMAT Score'],['16','Books Authored']].map(([val, lbl]) => (
              <div key={lbl}>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:'700', color:'#0f0f0f', lineHeight:'1' }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#999', marginTop:'0.2rem' }}>{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING CTA ──────────────────────────────────────────────────── */}
      <div style={{ padding:'5rem 2rem', background:'#0f0f0f', borderTop:'3px solid #ff5e5f', textAlign:'center' }}>
        <div style={{ maxWidth:'600px', margin:'0 auto' }}>
          <SeatsIndicator seatsLeft={seatsLeft} seatsTotal={seatsTotal} seatsPct={seatsPct} isFull={isFull} dark />
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.8rem,3vw,2.5rem)', color:'#fff', fontWeight:'700', lineHeight:'1.15', margin:'1.5rem 0 0.875rem' }}>
            {isFull ? 'This cohort is full.' : `${seatsLeft} seat${seatsLeft !== 1 ? 's' : ''} remaining.`}
          </h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'rgba(255,255,255,0.55)', lineHeight:'1.75', marginBottom:'2rem' }}>
            {isFull
              ? 'Join the waitlist and we\'ll notify you when the next cohort opens.'
              : 'Once the cohort of ' + seatsTotal + ' is full, the next batch opens only after the current one completes. Don\'t wait.'
            }
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href={isFull ? WA : enrolHref} target="_blank" rel="noreferrer"
              style={{ display:'inline-block', background:'#ff5e5f', color:'#fff', padding:'1rem 2.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.95rem', fontWeight:'800', textDecoration:'none' }}>
              {isFull ? 'Join Waitlist →' : 'Enrol Now →'}
            </a>
            <a href={WA} target="_blank" rel="noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', color:'rgba(255,255,255,0.55)', padding:'1rem 1.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', textDecoration:'none', border:'1px solid rgba(255,255,255,0.12)' }}>
              💬 Ask a Question
            </a>
          </div>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'rgba(255,255,255,0.25)', marginTop:'1.25rem' }}>
            All questions answered personally by ALP Sir on WhatsApp.
          </p>
        </div>
      </div>
    </>
  )
}

// ── SEATS INDICATOR ───────────────────────────────────────────────────────────

function SeatsIndicator({ seatsLeft, seatsTotal, seatsPct, isFull, dark }) {
  const bg    = dark ? 'rgba(255,255,255,0.06)' : '#fff5f5'
  const bdr   = dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #ffd0d0'
  const pulse = isFull || seatsPct >= 70

  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:'0.875rem', background:bg, border:bdr, borderRadius:'4px', padding:'0.875rem 1.25rem' }}>
      <div style={{ position:'relative' }}>
        <span style={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', background: isFull ? '#ef4444' : '#22c55e',
          animation: pulse ? 'pulse 1.5s infinite' : 'none' }} />
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.5} }`}</style>
      </div>
      <div>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color: dark ? '#fff' : '#0f0f0f', lineHeight:'1', marginBottom:'0.15rem' }}>
          {isFull ? 'Cohort Full' : `${seatsLeft} of ${seatsTotal} seats left`}
        </p>
        {/* Progress bar */}
        {!isFull && (
          <div style={{ width:'160px', height:'4px', background: dark ? 'rgba(255,255,255,0.1)' : '#ffe4e4', borderRadius:'2px', overflow:'hidden' }}>
            <div style={{ width:`${seatsPct}%`, height:'100%', background:'#ff5e5f', borderRadius:'2px', transition:'width 0.5s' }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── COUNTDOWN BANNER ─────────────────────────────────────────────────────────

function CountdownBanner({ startDate }) {
  const [time, setTime] = useState({ d:0, h:0, m:0, s:0 })

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(startDate) - new Date())
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startDate])

  const isOver = new Date(startDate) <= new Date()
  if (isOver) return null

  return (
    <div style={{ background:'#fff8f0', borderBottom:'1px solid #ffe4c0', padding:'2rem', textAlign:'center' }}>
      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#c2410c', marginBottom:'1rem' }}>
        Cohort starts in
      </p>
      <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
        {[['d','Days'],['h','Hours'],['m','Minutes'],['s','Seconds']].map(([k,lbl]) => (
          <div key={k} style={{ background:'#0f0f0f', borderRadius:'4px', padding:'1rem 1.25rem', minWidth:'72px' }}>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:'700', color:'#ff5e5f', lineHeight:'1', marginBottom:'0.2rem' }}>
              {String(time[k]).padStart(2,'0')}
            </p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{lbl}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SHARED STYLES ─────────────────────────────────────────────────────────────

const eye = {
  fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700',
  letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff5e5f', marginBottom: '0.5rem',
}
const h2 = {
  fontFamily: 'Georgia,serif', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: '700',
  color: '#0f0f0f', lineHeight: '1.2', marginBottom: '0.875rem',
}

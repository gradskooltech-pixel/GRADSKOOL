/**
 * GRADSKOOL — Dynamic Exam Page Fallback
 * Route: /courses/[examSlug]
 *
 * Known exams (cat, xat, snap, nmat, gmat, gre, ipmat, cmat, mhcet, clat, cuet, pi-wat-gd)
 * each have their own static page file (e.g. /courses/cat.jsx).
 *
 * This file handles:
 *   - Any exam added via the DB that doesn't have a static page yet
 *   - Renders a minimal page from DB data
 */
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Known exams that have their own static pages — redirect to them
const STATIC_PAGES = ['cat','xat','snap','nmat','gmat','gre','ipmat','cmat','mhcet','clat','cuet','pi-wat-gd']

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const { examSlug } = params

  // If it's a known exam, let its static page handle it
  if (STATIC_PAGES.includes(examSlug)) {
    return { redirect: { destination: `/courses/${examSlug}`, permanent: false } }
  }

  try {
    const res  = await fetch(`${API}/courses/${examSlug}/`)
    const exam = res.ok ? await res.json() : null
    if (!exam || exam.error) return { notFound: true }
    return { props: { examSlug, exam }, revalidate: 300 }
  } catch {
    return { notFound: true }
  }
}

export default function DynamicExamPage({ examSlug, exam }) {
  const router = useRouter()
  const [open, setOpen] = useState(null)

  if (router.isFallback) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia,serif', color:'#999' }}>
        Loading…
      </div>
    )
  }

  if (!exam) return null

  const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#ffffff', gray50:'#fafaf9', border:'#e8e8e6', gray400:'#999', gray600:'#666' }

  return (
    <>
      <Head>
        <title>{exam.name} — GRADSKOOL</title>
        <meta name="description" content={exam.tagline || exam.description || `${exam.name} preparation by Abhishek Leela Pandey.`} />
      </Head>

      {/* Breadcrumb */}
      <div style={{ padding:'0.875rem 2rem', borderBottom:`1px solid ${C.border}`, fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'flex', gap:'0.5rem' }}>
          <Link href="/" style={{ color:C.gray400, textDecoration:'none' }}>Home</Link>
          <span>/</span>
          <Link href="/courses" style={{ color:C.gray400, textDecoration:'none' }}>Courses</Link>
          <span>/</span>
          <span style={{ color:C.black }}>{exam.name}</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding:'5rem 2rem', borderBottom:`1px solid ${C.border}`, background:C.white }}>
        <div style={{ maxWidth:'800px', margin:'0 auto' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, marginBottom:'0.5rem' }}>
            {exam.category?.replace('_',' ') || 'Exam Preparation'}
          </p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2rem,4vw,3rem)', fontWeight:'700', color:C.black, lineHeight:'1.1', marginBottom:'0.875rem' }}>
            {exam.name}
          </h1>
          {exam.tagline && (
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', color:C.red, fontWeight:'600', marginBottom:'0.875rem' }}>
              {exam.tagline}
            </p>
          )}
          {exam.description && (
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, lineHeight:'1.8', marginBottom:'2rem', maxWidth:'600px' }}>
              {exam.description}
            </p>
          )}
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
            <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer"
              style={{ display:'inline-block', background:C.red, color:'#fff', padding:'0.875rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', textDecoration:'none' }}>
              Enrol / Enquire →
            </a>
            <Link href="/courses" style={{ display:'inline-flex', alignItems:'center', color:C.black, padding:'0.875rem 1.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', textDecoration:'none', border:`1px solid ${C.border}` }}>
              ← All Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Overview */}
      {exam.exam_pattern?.length > 0 && (
        <div style={{ padding:'4rem 2rem', background:C.gray50, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, marginBottom:'1.5rem' }}>Exam Pattern</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
              {exam.exam_pattern.map((card, i) => (
                <div key={i} style={{ background:C.white, padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400 }}>{card.label}</div>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:C.black }}>{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ background:C.red, padding:'5rem 2rem', textAlign:'center' }}>
        <div style={{ maxWidth:'640px', margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.8rem,3vw,2.5rem)', color:'#fff', fontWeight:'700', lineHeight:'1.15', marginBottom:'0.875rem' }}>
            Interested in {exam.short_name || exam.name}?
          </h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'rgba(255,255,255,0.75)', lineHeight:'1.75', marginBottom:'2rem' }}>
            WhatsApp us to know about the upcoming cohort, pricing and schedule.
          </p>
          <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer"
            style={{ display:'inline-block', background:'#fff', color:C.red, padding:'1rem 2.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.95rem', fontWeight:'800', textDecoration:'none' }}>
            WhatsApp Us →
          </a>
        </div>
      </div>
    </>
  )
}

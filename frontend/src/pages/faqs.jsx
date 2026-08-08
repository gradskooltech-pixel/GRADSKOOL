/**
 * GRADSKOOL — FAQs Page
 * Route: /faqs
 *
 * Matches static HTML exactly:
 * - Hero with category filter tabs
 * - Accordion Q&A items
 * - Categories: All | General | About ALP Sir | Cohort & Structure | CAT | GMAT & GRE | Platform | Enrolment
 */
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

const C = {
  red: '#ff5e5f', black: '#0f0f0f', white: '#ffffff',
  gray50: '#fafaf9', gray400: '#999', gray500: '#666',
  gray600: '#555', border: '#e8e8e6',
}

const FAQS = [
  // General
  { cat:'General', q:'What is GRADSKOOL?', a:`GRADSKOOL is a structured preparation ecosystem for CAT 2026 and other management entrance examinations — built on first-principles learning, disciplined execution, and measurable performance tracking.

Unlike mass coaching institutes that prioritise scale and syllabus coverage, GRADSKOOL prioritises structured mastery. Every topic moves through layered reinforcement:

English Explainer → Hindi Explainer → Live Session → Quiz → Advanced Live → Session PDF → Cheat Sheet → Advanced Quiz → Doubt Support

The objective is not information delivery. It is percentile control.` },

  { cat:'General', q:'How is GRADSKOOL different from traditional CAT coaching institutes?', a:`Traditional coaching often emphasises large batches, shortcut-heavy instruction, rapid syllabus completion, and mock overload.

GRADSKOOL emphasises:
• 27 students per cohort — not a policy, a philosophy
• Conceptual clarity before speed
• Structured daily execution through GRADSCALE
• Layered topic mastery — not just coverage
• Advanced analytics-driven performance correction
• Maximum personal interaction and mentorship

The aim is mastery before movement.` },

  { cat:'General', q:'Is GRADSKOOL affiliated with iQuanta?', a:`No. GRADSKOOL operates as a fully independent academic institution founded by Abhishek Leela Pandey. It is not affiliated with, employed by, or associated with iQuanta or any other coaching institute. All systems, curriculum, and intellectual property are independently developed.` },

  // About ALP Sir
  { cat:'About ALP Sir', q:'Who is Abhishek Leela Pandey (ALP Sir)?', a:`Abhishek Leela Pandey is a 99.93 percentile CAT performer and a 770 GMAT scorer, recognised as India's Most Transformative EdTech Leader (2025).

He holds teaching expertise across all three sections of CAT — VARC, LRDI, and Quantitative Ability — an uncommon combination in an industry where faculty are typically siloed.

His approach integrates reading logic, mathematical structure, and decision-making psychology into a unified thinking framework. Beyond written exams, he also mentors students for Personal Interviews (PI), Written Ability Tests (WAT), and Group Discussions (GD).

He is the Founder of GRADSKOOL — an independent education venture built on first-principles learning and cognitive discipline.` },

  { cat:'About ALP Sir', q:"Can I experience ALP Sir's teaching style before enrolling?", a:`Yes. Students can explore:
• Foundation Series on YouTube
• Selected GRADFLIX content
• Introductory modules on the platform
• Free tools at gradskool.in/tools

This allows evaluation of the teaching philosophy before committing to a cohort. You can also book a demo session — WhatsApp us to schedule one.` },

  // Cohort & Structure
  { cat:'Cohort & Structure', q:'Why is every cohort limited to 27 students?', a:`The 27-student limit is intentional — not a constraint, a philosophy.

At this size:
• Every student's performance is individually tracked
• Daily execution is visible — nobody falls through the cracks
• Weak areas are identified early and corrected personally
• Doubt resolution is deep, not rushed
• Real accountability exists within the group

When batches scale, teaching becomes broadcasting. At 27 students, it remains mentorship. This cap protects instructional intensity.` },

  { cat:'Cohort & Structure', q:'What is GRADSCALE — the daily drill system?', a:`GRADSCALE is the daily execution backbone of GRADSKOOL. Each day includes:
• 1 VARC / Reading Comprehension passage
• 1 LRDI set
• 5 Quant questions

Each drill is followed by explanatory solutions and deep analytics. This ensures consistent exposure across all three sections and eliminates "zero days."

Over months, structured repetition builds pattern recognition, speed, and confidence. Consistency compounds into percentile stability.` },

  { cat:'Cohort & Structure', q:'How does GRADSKOOL prevent burnout during long preparation?', a:`Long-term preparation often fails due to inconsistency and burnout. GRADSKOOL addresses this through:
• Structured daily drills — removes decision fatigue about what to study
• Measured intensity cycles — no unsustainable sprint-and-crash patterns
• Performance reviews — identify stagnation before it compounds
• Accountability within a 27-student cohort — peers and mentor both tracking progress` },

  // CAT
  { cat:'CAT', q:'How does mock analysis work at GRADSKOOL?', a:`Mock analysis at GRADSKOOL is structured in layers:
• Raw score evaluation
• Section-wise breakdown — VARC, DILR, QA separately
• Time allocation review
• Missed easy questions identification
• Error pattern tagging
• Correction strategy formation

Students are trained to optimise decision-making, not just increase attempts. Performance improvement is engineered through review — not just repetition.` },

  { cat:'CAT', q:'How are GRADSKOOL analytics different from other platforms?', a:`GRADSKOOL analytics go beyond basic accuracy and percentile numbers. Students receive structured insights into:
• Topic-wise strengths and weaknesses
• Repeated conceptual errors
• Speed vs accuracy imbalance
• Question-type sensitivity
• Attempt selection efficiency

Mocks and sectionals are treated as diagnostic tools. The goal is correction, not score display.` },

  { cat:'CAT', q:'Does GRADSKOOL provide PI, WAT, and GD preparation?', a:`Yes. Preparation includes structured mentoring for Personal Interviews (PI), Written Ability Tests (WAT), and Group Discussions (GD).

The focus is on structured thinking, clarity of articulation, argument development, and composure under pressure — ensuring readiness beyond the written exam.` },

  // GMAT & GRE
  { cat:'GMAT & GRE', q:'Can I prepare for CAT and GMAT simultaneously at GRADSKOOL?', a:`Yes. GRADSKOOL teaches first-principles frameworks in Arithmetic, Algebra, Logical Reasoning, and Reading Comprehension that transfer across CAT, GMAT, GRE, and other exams.

Instead of memorising exam-specific tricks, students develop underlying thinking models that apply broadly — making simultaneous or sequential preparation efficient.` },

  { cat:'GMAT & GRE', q:'Does GRADSKOOL offer GMAT Focus Edition preparation?', a:`Yes. The GRADSKOOL GMAT programme is fully updated for the GMAT Focus Edition — covering Quantitative Reasoning, Verbal Reasoning, and Data Insights. No AWA, no Sentence Correction.

Plans start from ₹29,999 + GST.` },

  { cat:'GMAT & GRE', q:'Can I use GRE preparation for MBA programmes?', a:`Yes. Many top MBA programmes now accept GRE in lieu of GMAT — including Harvard, Wharton, Kellogg, and ISB. GRADSKOOL's GRE programme also provides guidance on which schools prefer GMAT vs GRE for MBA admissions.` },

  // Platform
  { cat:'Platform', q:'How do I access the GRADSKOOL learning portal?', a:`Enrolled students access course content at courses.gradskool.in/learn. The portal includes:
• English and Hindi explainer videos
• Live session recordings
• Session PDFs and cheat sheets
• Quizzes and advanced quizzes
• Sectional tests and mock analytics
• GRADSCALE practice modules

Login credentials are provided upon enrolment.` },

  { cat:'Platform', q:'Are sessions recorded? What if I miss a live class?', a:`Yes. All live sessions are recorded and available to enrolled students through the learning portal.

If you miss a live class, you can watch the recording at your own pace. However, live attendance is strongly recommended — the two-way interaction and real-time doubt resolution cannot be fully replicated through recordings.` },

  { cat:'Platform', q:'Can I access GRADSKOOL on mobile?', a:`Yes. The GRADSKOOL platform is accessible across devices — desktop, tablet, and mobile. Live sessions, revision modules, daily drills, and performance diagnostics are all available seamlessly across devices.` },

  // Enrolment
  { cat:'Enrolment', q:'How do I enrol in a GRADSKOOL cohort?', a:`The simplest way is to WhatsApp us at +91 63605 97966. We'll confirm seat availability, answer any questions, and guide you through the payment and onboarding process.

Given the 27-student cap, seats fill quickly once a cohort opens.` },

  { cat:'Enrolment', q:'What is the refund policy?', a:`Digital products — including live courses and test series — are non-refundable once access credentials are shared or a session has begun.

If your course access has not yet been activated, you may request a full refund within 48 hours of payment.

For printed books, orders can be cancelled before shipment. Damaged products are replaced free of charge.` },

  { cat:'Enrolment', q:'Are EMI options available?', a:`Yes. EMI options are available on live cohort plans for CAT, GMAT, and GRE. WhatsApp us for details on available EMI tenures and payment partners.` },

  { cat:'Enrolment', q:"I'm a working professional. Can I manage the GRADSKOOL course?", a:`Yes. Sessions are scheduled keeping working professionals in mind — typically evenings or weekends. All sessions are recorded so you can revise at your own pace.

Daily practice sets are structured to fit into 1–1.5 hours a day. Many past GRADSKOOL students cracked CAT, GMAT, and GRE alongside full-time jobs.` },
]

const CATEGORIES = ['All', 'General', 'About ALP Sir', 'Cohort & Structure', 'CAT', 'GMAT & GRE', 'Platform', 'Enrolment']

export default function FAQsPage() {
  const [active, setActive]   = useState('All')
  const [open, setOpen]       = useState(null)

  const filtered = FAQS.filter(f => active === 'All' || f.cat === active)

  return (
    <>
      <Head>
        <title>Frequently Asked Questions — GRADSKOOL</title>
        <meta name="description" content="Everything you want to know about GRADSKOOL — who we are, how the cohort works, what ALP Sir's background is, and how to enrol." />
        <link rel="canonical" href="https://gradskool.in/faqs" />
      </Head>

      {/* BREADCRUMB */}
      <div style={{ padding:'0.875rem 2rem', borderBottom:`1px solid ${C.border}`, background:C.white }}>
        <div style={{ maxWidth:'860px', margin:'0 auto', display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 }}>
          <Link href="/" style={{ color:C.gray400, textDecoration:'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color:C.black }}>FAQs</span>
        </div>
      </div>

      {/* HERO */}
      <div style={s.hero}>
        <p style={s.eyebrow}>Got Questions?</p>
        <h1 style={s.title}>Frequently Asked Questions</h1>
        <p style={s.sub}>
          Everything you want to know about GRADSKOOL — who we are, how the cohort works,
          what ALP Sir's background is, and how to enrol.
        </p>
      </div>

      {/* CATEGORY TABS */}
      <div style={s.tabsWrap}>
        <div style={s.tabsInner}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActive(cat); setOpen(null) }}
              style={{ ...s.tab, ...(active===cat ? s.tabActive : {}) }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ ACCORDION */}
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'3rem 2rem 5rem' }}>
        <div style={{ display:'flex', flexDirection:'column', border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
          {filtered.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              isOpen={open===i}
              onToggle={() => setOpen(open===i ? null : i)}
              isLast={i===filtered.length-1}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={s.bottomCta}>
          <p style={s.ctaTitle}>Still have questions?</p>
          <p style={s.ctaSub}>WhatsApp us directly — we respond within a few hours.</p>
          <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer" style={s.ctaBtn}>
            💬 WhatsApp Us →
          </a>
        </div>
      </div>
    </>
  )
}

function FAQItem({ faq, isOpen, onToggle, isLast }) {
  return (
    <div style={{ borderBottom: isLast ? 'none' : `1px solid ${C.border}`, background:C.white }}>
      <button onClick={onToggle} style={s.qBtn}>
        <span style={s.qText}>{faq.q}</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'1.3rem', color:C.red, flexShrink:0, lineHeight:'1', transform: isOpen ? 'rotate(45deg)' : 'none', transition:'transform 0.25s' }}>
          +
        </span>
      </button>
      {isOpen && (
        <div style={s.answer}>
          {faq.a.split('\n\n').map((para, j) => (
            para.startsWith('•') ? (
              <ul key={j} style={{ listStyle:'none', margin:'0.5rem 0' }}>
                {para.split('\n').map((item, k) => (
                  <li key={k} style={s.ansLi}>
                    <span style={{ color:C.red, flexShrink:0, marginTop:'0.1rem' }}>—</span>
                    {item.replace('• ','')}
                  </li>
                ))}
              </ul>
            ) : (
              <p key={j} style={s.ansP}>{para}</p>
            )
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  hero:   { maxWidth:'860px', margin:'0 auto', padding:'4rem 2rem 3rem', borderBottom:`1px solid ${C.border}` },
  eyebrow:{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.75rem' },
  title:  { fontFamily:'Georgia, serif', fontSize:'clamp(2rem, 4vw, 3rem)', fontWeight:'700', color:C.black, lineHeight:'1.15', marginBottom:'0.875rem' },
  sub:    { fontFamily:'Georgia, serif', fontSize:'1rem', color:C.gray500, lineHeight:'1.75', maxWidth:'580px' },
  tabsWrap:{ borderBottom:`1px solid ${C.border}`, background:C.white, position:'sticky', top:0, zIndex:50 },
  tabsInner:{ maxWidth:'860px', margin:'0 auto', padding:'0 2rem', display:'flex', overflowX:'auto', gap:0 },
  tab:    { fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'500', color:C.gray400, background:'none', border:'none', borderBottom:'2px solid transparent', padding:'0.875rem 0.875rem', cursor:'pointer', whiteSpace:'nowrap', marginBottom:'-1px', transition:'color 0.15s' },
  tabActive:{ color:C.black, borderBottomColor:C.red, fontWeight:'600' },
  qBtn:   { width:'100%', background:'none', border:'none', padding:'1.4rem 1.75rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1.5rem' },
  qText:  { fontFamily:'Georgia, serif', fontSize:'1rem', fontWeight:'500', color:C.black, lineHeight:'1.5' },
  answer: { padding:'0 1.75rem 1.5rem' },
  ansP:   { fontFamily:'Georgia, serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.8', marginBottom:'0.875rem' },
  ansLi:  { fontFamily:'Georgia, serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.7', display:'flex', gap:'0.65rem', marginBottom:'0.35rem' },
  bottomCta:{ marginTop:'3rem', padding:'2.5rem', background:C.gray50, border:`1px solid ${C.border}`, borderRadius:'4px', textAlign:'center' },
  ctaTitle: { fontFamily:'Georgia, serif', fontSize:'1.3rem', fontWeight:'700', color:C.black, marginBottom:'0.4rem' },
  ctaSub:   { fontFamily:'Georgia, serif', fontSize:'0.95rem', color:C.gray500, marginBottom:'1.5rem' },
  ctaBtn:   { display:'inline-block', background:C.black, color:'#fff', padding:'0.8rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', textDecoration:'none' },
}

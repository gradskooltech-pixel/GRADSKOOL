/**
 * GRADSKOOL — Free Classes & Courses Hub
 * Route: /free-classes
 *
 * Moved here from /foundations — that URL undersold what's actually here:
 * XAT is genuine starter/foundations content (stays at /foundations/xat,
 * that label fits), but NMAT and SNAP are complete free courses, not
 * "foundations." A hub page covering both under a URL that says
 * "foundations" was misleading for SEO. This page is the neutral umbrella;
 * XAT's own page keeps its accurate /foundations/xat URL.
 *
 * No login required to browse this page or the per-exam listings — that's
 * deliberate, for SEO (matches the "public pages stay crawlable" decision).
 * Login is only required once someone tries to actually claim/read a PDF
 * attached to a class — that gate lives in the PDF Library system, not here.
 */
import Link from 'next/link'
import PageSEO, { faqSchema, itemListSchema } from '../components/seo/PageSEO'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const EXAMS = [
  { slug:'cat',  name:'CAT',  color:'#d94f50', tagline:'Quant, VARC, DILR — the exam everything else is measured against', isFullCourse:false, cardLabel:'Foundations' },
  { slug:'xat',  name:'XAT',  color:'#5b3fa0', tagline:'Decision Making, Verbal & Logical Reasoning, Quant', isFullCourse:false, cardLabel:'Foundations' },
  { slug:'snap', name:'SNAP', color:'#1a5c8a', tagline:'Quant, VARC, DILR — Symbiosis-pattern practice', isFullCourse:true, cardLabel:'Complete Course, Free' },
  { slug:'nmat', name:'NMAT', color:'#1a6e3c', tagline:'Language Skills, Quant, Logical Reasoning', isFullCourse:true, cardLabel:'Complete Course, Free' },
]

export async function getStaticProps() {
  const summaries = await Promise.all(
    EXAMS.map(async (exam) => {
      let classCount = 0
      let pdfCount = 0
      try {
        const res = await fetch(`${API}/foundations/?exam=${exam.slug}`)
        if (res.ok) {
          const series = await res.json()
          classCount = (series || []).reduce((sum, s) => sum + (s.class_count || 0), 0)
        }
      } catch { /* stays 0 — page still renders fine */ }
      try {
        const res = await fetch(`${API}/pdfs/?exam=${exam.slug}`)
        if (res.ok) {
          const pdfs = await res.json()
          pdfCount = (pdfs.results || pdfs || []).length
        }
      } catch { /* stays 0 */ }
      return { ...exam, classCount, pdfCount }
    })
  )
  return { props: { examSummaries: summaries }, revalidate: 300 }
}

const FAQS = [
  { q: 'Are these classes actually free?', a: 'Yes — every class here is free to watch, no catch. You do need to be logged in to watch, since progress and any attached PDFs are tied to your account.' },
  { q: 'Do I need to pay for the notes and cheat sheets?', a: 'Some are free (just need an account, no payment), others are priced individually — each PDF\'s page shows which before you claim or buy it.' },
  { q: 'Is this different from the paid CATalysis/CAThlete/XAT courses?', a: "CAT and XAT here are starting points — free classes to help you decide if you want the full paid CAThlete or XAT course. NMAT and SNAP are different: those are the complete courses, taught live, entirely free — not a preview." },
  { q: 'Do I need any prior preparation to start?', a: 'No. The CAT and XAT foundation classes assume no prior CAT-specific preparation, and the complete NMAT and SNAP courses start from the basics of each topic before building up to exam-level difficulty.' },
  { q: 'Are the classes live or recorded?', a: 'Both. Classes run live on a schedule, taught by ALP Sir, and every session\'s recording stays available afterward — so you can watch live for doubt-clearing or catch up later at your own pace.' },
  { q: 'How is this sustainable if it\'s free?', a: "GRADSKOOL's paid courses (CATalysis, CAThlete, XAT) fund the platform. NMAT and SNAP are offered as complete, free courses because GRADSKOOL believes strong preparation for these two exams shouldn't require payment upfront — the CAT/XAT foundation classes double as an introduction to ALP Sir's teaching style for those considering the paid courses." },
]

export default function FreeHub({ examSummaries }) {
  return (
    <>
      <PageSEO
        title="Free Classes & Courses — CAT, XAT, SNAP, NMAT — GRADSKOOL"
        description="Free live and recorded classes for CAT and XAT, and the complete NMAT and SNAP courses, taught by ALP Sir — entirely free, no cost, just an account."
        keywords="free CAT classes, free XAT classes, free SNAP course, free NMAT course, GRADSKOOL free courses, ALP Sir free classes, CAT foundation classes, XAT foundation classes"
        canonical="https://gradskool.in/free-classes"
        breadcrumbs={[{ name:'Home', url:'/' }, { name:'Free Classes & Courses', url:'/free-classes' }]}
        schema={[
          faqSchema(FAQS),
          itemListSchema({
            name: 'GRADSKOOL Free Classes and Courses',
            description: 'Free CAT and XAT foundation classes, plus the complete NMAT and SNAP courses, taught live by ALP Sir.',
            items: examSummaries.map(e => ({
              name: `${e.name}${e.isFullCourse ? ' — Complete Course' : ' Foundations'} (${e.classCount} class${e.classCount === 1 ? '' : 'es'})`,
              url: e.isFullCourse ? `/courses/${e.slug}/live` : `/foundations/${e.slug}`,
            })),
          }),
        ]}
      />

      <style>{`
        .fh-hero { max-width:900px; margin:0 auto; padding:64px 40px 40px; text-align:center; }
        .fh-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--red); margin-bottom:14px; }
        .fh-h1 { font-family:var(--font-serif); font-size:clamp(32px,4.5vw,50px); font-weight:400; color:var(--black); line-height:1.15; margin-bottom:16px; }
        .fh-sub { font-family:var(--font-body); font-size:16px; color:var(--g700); line-height:1.7; max-width:600px; margin:0 auto; }
        .fh-grid { max-width:1000px; margin:0 auto; padding:24px 40px 80px; display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
        .fh-card { border:var(--border); border-radius:var(--radius); overflow:hidden; text-decoration:none; background:#fff; transition:transform var(--t), box-shadow var(--t); display:flex; flex-direction:column; }
        .fh-card:hover { transform:translateY(-3px); box-shadow:var(--shadow); }
        .fh-card-top { padding:28px 24px 22px; color:#fff; }
        .fh-card-badge { display:inline-block; font-family:var(--font-sans); font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; background:rgba(255,255,255,.18); padding:4px 10px; border-radius:2px; margin-bottom:10px; }
        .fh-card-name { font-family:var(--font-serif); font-size:26px; margin-bottom:6px; }
        .fh-card-tagline { font-family:var(--font-sans); font-size:12.5px; opacity:.85; line-height:1.5; }
        .fh-card-bottom { padding:18px 24px; display:flex; justify-content:space-between; align-items:center; }
        .fh-stat { font-family:var(--font-sans); font-size:12px; color:var(--g500); }
        .fh-stat b { color:var(--black); font-weight:700; }
        .fh-arrow { font-family:var(--font-sans); font-size:13px; font-weight:600; color:var(--red); }
        .fh-how { max-width:800px; margin:0 auto; padding:0 40px 80px; }
        .fh-how-title { font-family:var(--font-serif); font-size:24px; color:var(--black); margin-bottom:24px; text-align:center; }
        .fh-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        @media(max-width:760px){ .fh-steps{ grid-template-columns:1fr; } }
        .fh-step-num { font-family:var(--font-serif); font-size:32px; color:var(--red); opacity:.3; margin-bottom:8px; }
        .fh-step-title { font-family:var(--font-serif); font-size:16px; color:var(--black); margin-bottom:6px; }
        .fh-step-desc { font-family:var(--font-sans); font-size:13px; color:var(--g700); line-height:1.6; }

        .fh-intro { max-width:760px; margin:0 auto; padding:8px 40px 24px; font-family:var(--font-body); font-size:14px; color:var(--g700); line-height:1.85; }
        .fh-intro strong { color:var(--black); font-weight:600; }

        .fh-faq-section { max-width:800px; margin:0 auto; padding:0 40px 80px; }
        .fh-faq-title { font-family:var(--font-serif); font-size:24px; color:var(--black); margin-bottom:24px; text-align:center; }
        .fh-faq-item { border-bottom:1px solid var(--g200); padding:16px 0; }
        .fh-faq-q { font-family:var(--font-sans); font-size:14.5px; font-weight:700; color:var(--black); margin-bottom:8px; }
        .fh-faq-a { font-family:var(--font-body); font-size:14px; color:var(--g700); line-height:1.7; }
      `}</style>

      <div className="fh-hero">
        <p className="fh-eyebrow">100% Free</p>
        <h1 className="fh-h1">Free classes. Complete free courses.</h1>
        <p className="fh-sub">
          Starter classes for CAT and XAT to get you going, and the complete NMAT and
          SNAP courses — every topic, ground up to exam-day strategy — taught live
          by ALP Sir, entirely free. No cost to watch, just create a free account.
        </p>
      </div>

      {/* Static, server-rendered intro — always in the initial HTML,
          regardless of whether client JS runs (same pattern as the FYQ page). */}
      <div className="fh-intro">
        <p style={{ marginBottom: 14 }}>
          This page covers two genuinely different things, both free. The <strong>CAT and XAT classes</strong> are foundation sessions — a real, structured introduction to how ALP Sir teaches, covering core concepts and strategy for each exam, meant to help you decide whether the full paid CATalysis or XAT course is the right fit before you commit to anything. They&rsquo;re not a stripped-down preview; they&rsquo;re genuinely useful sessions on their own.
        </p>
        <p style={{ marginBottom: 14 }}>
          The <strong>NMAT and SNAP courses</strong> are different — these are the complete courses, taught live from the ground up through every topic in the syllabus, all the way to exam-day strategy. Nothing is held back for a paid tier. GRADSKOOL offers these two exams&rsquo; full preparation free because CAT and XAT are the platform&rsquo;s primary paid offerings, and NMAT/SNAP preparation is made available at no cost as part of that broader mission.
        </p>
        <p>
          Every class is taught live by ALP Sir (99.93 percentile CAT, 770 GMAT) and recorded, so you can join live for real-time doubt clearing or catch up on your own schedule afterward. Many sessions link to a companion PDF — a cheat sheet, formula sheet, or practice set — in the PDF Library, some free and some individually priced. All you need to start watching is a free GRADSKOOL account; there&rsquo;s no payment step anywhere in this flow.
        </p>
      </div>

      <div className="fh-grid">
        {examSummaries.map((exam) => (
          <Link key={exam.slug} href={exam.isFullCourse ? `/courses/${exam.slug}/live` : `/foundations/${exam.slug}`} className="fh-card">
            <div className="fh-card-top" style={{ background: exam.color }}>
              <span className="fh-card-badge">{exam.cardLabel}</span>
              <div className="fh-card-name">{exam.name}{exam.isFullCourse ? '' : ' Foundations'}</div>
              <div className="fh-card-tagline">{exam.tagline}</div>
            </div>
            <div className="fh-card-bottom">
              <span className="fh-stat">
                <b>{exam.classCount}</b> free class{exam.classCount === 1 ? '' : 'es'}
                {exam.pdfCount > 0 && <> · <b>{exam.pdfCount}</b> PDF{exam.pdfCount === 1 ? '' : 's'}</>}
              </span>
              <span className="fh-arrow">Start →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="fh-how">
        <h2 className="fh-how-title">How it works</h2>
        <div className="fh-steps">
          <div>
            <div className="fh-step-num">01</div>
            <div className="fh-step-title">Pick your exam</div>
            <div className="fh-step-desc">Browse CAT, XAT, SNAP, or NMAT — see what's covered before signing up for anything.</div>
          </div>
          <div>
            <div className="fh-step-num">02</div>
            <div className="fh-step-title">Watch for free</div>
            <div className="fh-step-desc">Create a free account and start watching. Upcoming classes show a countdown; past ones have the recording ready.</div>
          </div>
          <div>
            <div className="fh-step-num">03</div>
            <div className="fh-step-title">Grab the notes</div>
            <div className="fh-step-desc">Some classes link to a cheat sheet or question bank in the PDF Library — log in to read them, free ones instantly, others after you buy.</div>
          </div>
        </div>
      </div>

      {/* FAQ — matches the FAQPage schema above; schema without visible
          on-page content goes against Google's structured data guidelines. */}
      <div className="fh-faq-section">
        <h2 className="fh-faq-title">Frequently Asked Questions</h2>
        {FAQS.map(f => (
          <div key={f.q} className="fh-faq-item">
            <div className="fh-faq-q">{f.q}</div>
            <div className="fh-faq-a">{f.a}</div>
          </div>
        ))}
      </div>
    </>
  )
}

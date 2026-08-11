/**
 * GRADSKOOL — FYQ (Future Year Questions) Listing
 * Route: /fyqs
 *
 * Hierarchical browse: Section cards (Quants/LRDI/VARC) → Category cards
 * (only for sections that use them, i.e. Quants) → Topic cards → Questions.
 * Search bypasses the hierarchy entirely and searches everything flat.
 *
 * SEO/AEO/GEO pass:
 *  - getStaticProps (ISR) fetches the topic tree server-side, so the full
 *    hierarchy + question counts are in the initial HTML for crawlers/bots
 *    that never execute JS — not just fetched client-side as before.
 *  - Static ~250-word intro above the fold, plain server-rendered text.
 *  - FAQPage schema + a matching visible FAQ section (schema without
 *    visible on-page content is against Google's guidelines).
 *  - A flat, always-visible "Topic Index" section listing every topic
 *    across every section with its question count — separate from the
 *    interactive click-through browser, so bots get topic-level content
 *    without needing to simulate clicks. Deep-links via ?topic=<id> so
 *    these are real, functional, indexable URLs, not just decoration.
 *  - ItemList schema for that same topic index.
 *  - Breadcrumb schema (already existed via PageSEO's breadcrumbs prop).
 *
 * NOTE re: static HTML export for AI crawlers — there's no gen_missing.cjs
 * or equivalent pre-render script in this codebase (that appears to be
 * from a separate project). getStaticProps with ISR already produces real,
 * crawlable static HTML on every request without one — this achieves the
 * same underlying goal using Next.js's own SSG/ISR rather than a bespoke
 * export step.
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import PageSEO, { faqSchema, itemListSchema } from '../../components/seo/PageSEO'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const FAQS = [
  { q:'What are CAT Future Year Questions (FYQs)?', a:"FYQs are real questions from previous years' CAT exams, organized by topic — VARC, DILR, and QA — each with a full video solution and written explanation by ALP Sir. They show you exactly how CAT questions are actually framed, not simplified practice versions." },
  { q:'How are FYQs different from PYQs?', a:'PYQ (Previous Year Questions) is the general term for any past exam question. FYQs on GRADSKOOL are a curated subset — specifically selected and organized by topic and difficulty, with the aim of building topic-wise mastery rather than just reviewing an old paper end to end.' },
  { q:'Are video solutions included with every FYQ?', a:"Yes. Every question includes a full video walkthrough by ALP Sir explaining the approach, plus a written explanation for quick revision. Some questions also have a downloadable PDF for offline practice." },
  { q:'How does ALP Sir curate which questions to include?', a:"ALP Sir personally selects questions that best represent how a topic is actually tested in CAT — prioritizing questions that reveal common traps, efficient shortcuts, and patterns that repeat across years, rather than including every past question indiscriminately." },
  { q:'Is the FYQ bank free to use?', a:'Browsing the FYQ bank — every topic, every question title — is completely free and requires no signup. Full video solutions are available as part of GRADSKOOL courses.' },
  { q:'How often are new FYQs added?', a:'The FYQ bank is updated as new exam years are analyzed and as ALP Sir identifies additional high-value questions worth adding to each topic.' },
]

// Flatten the section → category → topic tree into a single list, for the
// static topic index and the ItemList schema. Keeps section/category name
// alongside each topic for context.
function flattenTopics(tree) {
  const out = []
  for (const s of tree || []) {
    if (s.has_categories) {
      for (const c of (s.categories || [])) {
        for (const t of (c.topics || [])) {
          out.push({ ...t, sectionName: s.name, categoryName: c.name })
        }
      }
    } else {
      for (const t of (s.topics || [])) {
        out.push({ ...t, sectionName: s.name, categoryName: null })
      }
    }
  }
  return out
}

export async function getStaticProps() {
  try {
    const res = await fetch(`${API}/fyq/tree/`)
    const initialTree = res.ok ? await res.json() : []
    return { props: { initialTree }, revalidate: 3600 }
  } catch {
    return { props: { initialTree: [] }, revalidate: 300 }
  }
}

function Crumb({ children, onClick, active }) {
  return (
    <button onClick={onClick} disabled={active} style={{
      background:'none', border:'none', cursor: active ? 'default' : 'pointer',
      fontFamily:'var(--font-sans)', fontSize:13, padding:0,
      color: active ? 'var(--black)' : 'var(--g500)', fontWeight: active ? 600 : 400,
    }}>{children}</button>
  )
}

function BrowseCard({ title, sub, href, onClick }) {
  const inner = (
    <>
      <div style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--black)', marginBottom:4 }}>{title}</div>
      {sub && <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>{sub}</div>}
    </>
  )
  const style = { border:'1px solid var(--g200)', borderRadius:6, padding:'20px 22px', background:'#fff', textDecoration:'none', display:'block', transition:'transform .15s, box-shadow .15s', cursor:'pointer' }
  if (href) return <Link href={href} className="fyq-browse-card" style={style}>{inner}</Link>
  return <div onClick={onClick} className="fyq-browse-card" style={style}>{inner}</div>
}

export default function FYQListing({ initialTree }) {
  const router = useRouter()
  const [tree, setTree] = useState(initialTree || [])
  const [loading, setLoading] = useState(false)
  const [sectionId, setSectionId] = useState(null)
  const [categoryId, setCategoryId] = useState(null)
  const [topicId, setTopicId] = useState(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [results, setResults] = useState({ results:[], count:0, page:1, num_pages:1 })
  const [resultsLoading, setResultsLoading] = useState(false)
  const [page, setPage] = useState(1)

  const flatTopics = flattenTopics(tree)

  // Deep-link support — e.g. /fyqs?section=lrdi or /fyqs?topic=<id>,
  // matched once the tree has loaded (router.query isn't ready on first
  // render). Topic deep-linking makes the static Topic Index below into
  // real, functional URLs rather than just decoration for crawlers.
  useEffect(() => {
    if (!router.isReady || tree.length === 0) return
    const wantedSection = router.query.section
    const wantedTopic = router.query.topic
    if (wantedTopic) {
      const t = flatTopics.find(t => String(t.id) === String(wantedTopic))
      if (t) {
        setSectionId(t.section_id)
        if (t.category_id) setCategoryId(t.category_id)
        setTopicId(t.id)
        return
      }
    }
    if (wantedSection) {
      const match = tree.find(s => s.name.toLowerCase() === String(wantedSection).toLowerCase())
      if (match) setSectionId(match.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.section, router.query.topic, tree])

  // Refresh the tree client-side too, in case counts changed since the
  // last ISR revalidation — initialTree already means there's no
  // loading flash on first paint either way.
  useEffect(() => {
    fetch(`${API}/fyq/tree/`).then(r => r.json()).then(setTree).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [topicId, debouncedSearch])

  const showingQuestions = !!topicId || !!debouncedSearch

  const loadQuestions = useCallback(() => {
    if (!showingQuestions) return
    setResultsLoading(true)
    const params = new URLSearchParams({ page: String(page), page_size: '24' })
    if (topicId) params.set('topic', topicId)
    if (debouncedSearch) params.set('search', debouncedSearch)
    fetch(`${API}/fyq/?${params.toString()}`)
      .then(r => r.json()).then(setResults)
      .catch(() => setResults({ results:[], count:0, page:1, num_pages:1 }))
      .finally(() => setResultsLoading(false))
  }, [topicId, debouncedSearch, page, showingQuestions])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  const section  = tree.find(s => s.id === sectionId)
  const category = section?.categories?.find(c => c.id === categoryId)
  const topicList = category ? category.topics : (section?.topics || [])
  const activeTopic = topicList.find(t => t.id === topicId)

  const goHome = () => { setSectionId(null); setCategoryId(null); setTopicId(null); setSearch(''); router.replace('/fyqs', undefined, { shallow: true }) }
  const goSection = () => { setCategoryId(null); setTopicId(null) }
  const goCategory = () => { setTopicId(null) }
  const goTopicById = (id) => { router.replace(`/fyqs?topic=${id}`, undefined, { shallow: true }) }

  const totalQuestions = flatTopics.reduce((sum, t) => sum + (t.question_count || 0), 0)

  return (
    <>
      <PageSEO
        title="FYQs — CAT Future Year Questions — GRADSKOOL"
        description="Hundreds of CAT Future Year Questions, organized by topic, with full video solutions and written explanations, by ALP Sir."
        keywords="future year questions, FYQ, CAT future year questions, ALP Sir FYQ, CAT question bank, CAT topic wise questions"
        canonical="https://gradskool.in/fyqs"
        breadcrumbs={[{ name:'Home', url:'/' }, { name:'FYQs', url:'/fyqs' }]}
        schema={[
          faqSchema(FAQS),
          itemListSchema({
            name: 'CAT FYQ Topic Index',
            description: `${flatTopics.length} topics across VARC, DILR, and QA, with ${totalQuestions} Future Year Questions total.`,
            items: flatTopics.map(t => ({ name: `${t.name} — ${t.question_count} question${t.question_count === 1 ? '' : 's'}`, url: `/fyqs?topic=${t.id}` })),
          }),
        ]}
        speakableSelectors={['h1', '.fyq-sub', '.fyq-intro']}
      />

      <style>{`
        .fyq-hero { max-width:900px; margin:0 auto; padding:56px 40px 24px; text-align:center; }
        .fyq-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--red); margin-bottom:14px; }
        .fyq-h1 { font-family:var(--font-serif); font-size:clamp(30px,4.5vw,46px); font-weight:400; color:var(--black); line-height:1.15; margin-bottom:14px; }
        .fyq-sub { font-family:var(--font-body); font-size:15px; color:var(--g700); line-height:1.7; max-width:600px; margin:0 auto; }
        .fyq-intro { max-width:760px; margin:0 auto; padding:8px 40px 32px; font-family:var(--font-body); font-size:14px; color:var(--g700); line-height:1.85; }
        .fyq-search-wrap { max-width:600px; margin:0 auto 32px; padding:0 40px; }
        .fyq-search { width:100%; font-family:var(--font-sans); font-size:14px; padding:11px 16px; border:1px solid var(--g200); border-radius:3px; outline:none; box-sizing:border-box; }
        .fyq-crumbs { max-width:1000px; margin:0 auto; padding:0 40px 20px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .fyq-browse-grid { max-width:1000px; margin:0 auto; padding:0 40px 80px; display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
        .fyq-browse-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.08); }

        .fyq-grid { max-width:1100px; margin:0 auto; padding:8px 40px 40px; display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
        .fyq-card { border:1px solid var(--g200); border-radius:6px; padding:18px 20px; text-decoration:none; background:#fff; transition:transform .15s, box-shadow .15s; display:flex; flex-direction:column; gap:8px; }
        .fyq-card:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.08); }
        .fyq-card-num { font-family:var(--font-sans); font-size:10px; font-weight:700; letter-spacing:.05em; color:var(--red); }
        .fyq-card-title { font-family:var(--font-serif); font-size:16px; color:var(--black); line-height:1.3; }

        .fyq-pagination { max-width:1100px; margin:0 auto; padding:0 40px 64px; display:flex; justify-content:center; align-items:center; gap:16px; }
        .fyq-page-btn { font-family:var(--font-sans); font-size:13px; padding:8px 16px; border:1px solid var(--g200); border-radius:3px; background:#fff; cursor:pointer; color:var(--black); }
        .fyq-page-btn:disabled { opacity:.4; cursor:not-allowed; }
        .fyq-page-info { font-family:var(--font-sans); font-size:12px; color:var(--g500); }
        .fyq-empty { text-align:center; padding:60px 20px; font-family:var(--font-sans); color:var(--g500); }

        .fyq-index-section { max-width:1000px; margin:0 auto; padding:8px 40px 56px; }
        .fyq-index-title { font-family:var(--font-serif); font-size:22px; color:var(--black); margin-bottom:6px; }
        .fyq-index-sub { font-family:var(--font-sans); font-size:13px; color:var(--g500); margin-bottom:20px; }
        .fyq-index-group { margin-bottom:24px; }
        .fyq-index-group-title { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--red); margin-bottom:10px; }
        .fyq-index-list { display:flex; flex-wrap:wrap; gap:8px; }
        .fyq-index-chip { font-family:var(--font-sans); font-size:12.5px; color:var(--g700); border:1px solid var(--g200); border-radius:20px; padding:5px 12px; text-decoration:none; background:#fff; }
        .fyq-index-chip:hover { border-color:var(--red); color:var(--red); }

        .fyq-faq-section { max-width:800px; margin:0 auto; padding:8px 40px 64px; }
        .fyq-faq-title { font-family:var(--font-serif); font-size:24px; color:var(--black); margin-bottom:24px; }
        .fyq-faq-item { border-bottom:1px solid var(--g200); padding:16px 0; }
        .fyq-faq-q { font-family:var(--font-sans); font-size:14.5px; font-weight:700; color:var(--black); margin-bottom:8px; }
        .fyq-faq-a { font-family:var(--font-body); font-size:14px; color:var(--g700); line-height:1.7; }
      `}</style>

      <div className="fyq-hero">
        <p className="fyq-eyebrow">CAT Question Bank</p>
        <h1 className="fyq-h1">Future Year Questions</h1>
        <p className="fyq-sub">Real questions, full video solutions, written explanations — by ALP Sir.</p>
      </div>

      {/* Static, server-rendered intro — always in the initial HTML,
          regardless of whether client JS runs. */}
      <div className="fyq-intro">
        <p style={{ marginBottom: 14 }}>
          Future Year Questions (FYQs) are real questions pulled from previous years&rsquo; CAT papers, organized topic by topic across VARC, DILR, and QA. Instead of working through an old paper start to finish, FYQs let you drill a single topic — say, Time &amp; Work, or Reading Comprehension inference questions — against every relevant question CAT has actually asked in recent years.
        </p>
        <p style={{ marginBottom: 14 }}>
          This matters because CAT rewards pattern recognition as much as raw ability. The same question types, traps, and shortcuts tend to resurface year after year in slightly different dressing. Working through FYQs topic-by-topic — rather than year-by-year — builds the kind of familiarity that lets you recognize a question&rsquo;s underlying structure within seconds of reading it, which is often the real difference between a 90th and 99th percentile performance.
        </p>
        <p>
          Every question in this bank has been personally selected by ALP Sir (99.93 percentile CAT, 770 GMAT), who curates for questions that best reveal how a topic is actually tested — not just any past question, but ones that expose common traps and efficient approaches. Each comes with a full video walkthrough and a written explanation, so you can review however suits you best. Browsing the full bank — every topic, every question title — is completely free.
        </p>
      </div>

      <div className="fyq-search-wrap">
        <input className="fyq-search" placeholder="Search all questions or topics…" value={search}
          onChange={e => { setSearch(e.target.value); setTopicId(null) }} />
      </div>

      {!showingQuestions && (
        <div className="fyq-crumbs">
          <Crumb onClick={goHome} active={!section}>All Sections</Crumb>
          {section && <><span style={{ color:'var(--g300)' }}>/</span><Crumb onClick={goSection} active={!category && !activeTopic}>{section.name}</Crumb></>}
          {category && <><span style={{ color:'var(--g300)' }}>/</span><Crumb onClick={goCategory} active>{category.name}</Crumb></>}
        </div>
      )}

      {loading ? (
        <div className="fyq-empty">Loading…</div>

      /* ── search results or a selected topic's questions ── */
      ) : showingQuestions ? (
        <>
          {debouncedSearch && (
            <div className="fyq-crumbs">
              <Crumb onClick={goHome}>← Back to browsing</Crumb>
            </div>
          )}
          {activeTopic && !debouncedSearch && (
            <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 40px 8px' }}>
              <h2 style={{ fontFamily:'var(--font-serif)', fontSize:22, color:'var(--black)' }}>{activeTopic.name}</h2>
            </div>
          )}
          {resultsLoading ? (
            <div className="fyq-empty">Loading…</div>
          ) : results.results.length === 0 ? (
            <div className="fyq-empty">No questions match this yet.</div>
          ) : (
            <div className="fyq-grid">
              {results.results.map(q => (
                <Link key={q.id} href={`/fyqs/${q.slug}`} className="fyq-card">
                  <span className="fyq-card-num">FYQ {String(q.question_number).padStart(3,'0')}</span>
                  <span className="fyq-card-title">{q.title}</span>
                </Link>
              ))}
            </div>
          )}
          {results.num_pages > 1 && (
            <div className="fyq-pagination">
              <button className="fyq-page-btn" disabled={!results.has_prev} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="fyq-page-info">Page {results.page} of {results.num_pages}</span>
              <button className="fyq-page-btn" disabled={!results.has_next} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>

      /* ── LEVEL 0: sections ── */
      ) : !section ? (
        <div className="fyq-browse-grid">
          {tree.map(s => (
            <BrowseCard key={s.id} title={s.name}
              sub={s.has_categories ? `${(s.categories||[]).length} categories` : `${(s.topics||[]).length} topics`}
              onClick={() => setSectionId(s.id)} />
          ))}
        </div>

      /* ── LEVEL 1: categories (if section has them) or topics directly ── */
      ) : section.has_categories && !category ? (
        <div className="fyq-browse-grid">
          {(section.categories || []).map(c => (
            <BrowseCard key={c.id} title={c.name} sub={`${(c.topics||[]).length} topics`} onClick={() => setCategoryId(c.id)} />
          ))}
        </div>

      /* ── LEVEL 2: topics ── */
      ) : (
        <div className="fyq-browse-grid">
          {topicList.map(t => (
            <BrowseCard key={t.id} title={t.name} sub={`${t.question_count} question${t.question_count === 1 ? '' : 's'}`} onClick={() => setTopicId(t.id)} />
          ))}
          {topicList.length === 0 && <p style={{ fontFamily:'var(--font-sans)', color:'var(--g500)' }}>No topics here yet.</p>}
        </div>
      )}

      {/* Static, always-rendered Topic Index — a flat list of every
          topic + question count, real deep-linking URLs via ?topic=<id>.
          Separate from the interactive browser above so this is visible
          to crawlers without needing to simulate any clicks. */}
      {!showingQuestions && (
        <div className="fyq-index-section">
          <h2 className="fyq-index-title">Complete Topic Index</h2>
          <p className="fyq-index-sub">{flatTopics.length} topics · {totalQuestions} questions total across VARC, DILR, and QA.</p>
          {tree.map(s => {
            const sectionTopics = flatTopics.filter(t => t.sectionName === s.name)
            if (sectionTopics.length === 0) return null
            return (
              <div key={s.id} className="fyq-index-group">
                <div className="fyq-index-group-title">{s.name}</div>
                <div className="fyq-index-list">
                  {sectionTopics.map(t => (
                    <a key={t.id} href={`/fyqs?topic=${t.id}`} className="fyq-index-chip"
                      onClick={(e) => { e.preventDefault(); goTopicById(t.id) }}>
                      {t.categoryName ? `${t.categoryName} — ` : ''}{t.name} ({t.question_count})
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAQ — matches the FAQPage schema above; schema without visible
          on-page content goes against Google's structured data guidelines. */}
      <div className="fyq-faq-section">
        <h2 className="fyq-faq-title">Frequently Asked Questions</h2>
        {FAQS.map(f => (
          <div key={f.q} className="fyq-faq-item">
            <div className="fyq-faq-q">{f.q}</div>
            <div className="fyq-faq-a">{f.a}</div>
          </div>
        ))}
      </div>
    </>
  )
}
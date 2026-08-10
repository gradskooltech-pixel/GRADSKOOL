/**
 * GRADSKOOL — FYQ (Future Year Questions) Listing
 * Route: /fyqs
 *
 * Hierarchical browse: Section cards (Quants/LRDI/VARC) → Category cards
 * (only for sections that use them, i.e. Quants) → Topic cards → Questions.
 * Search bypasses the hierarchy entirely and searches everything flat.
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import PageSEO from '../../components/seo/PageSEO'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

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

export default function FYQListing() {
  const router = useRouter()
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [sectionId, setSectionId] = useState(null)
  const [categoryId, setCategoryId] = useState(null)
  const [topicId, setTopicId] = useState(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [results, setResults] = useState({ results:[], count:0, page:1, num_pages:1 })
  const [resultsLoading, setResultsLoading] = useState(false)
  const [page, setPage] = useState(1)

  // Deep-link support — e.g. /fyqs?section=lrdi, matched case-insensitively
  // against section name once the tree has loaded (router.query isn't
  // ready on first render).
  useEffect(() => {
    if (!router.isReady || tree.length === 0) return
    const wanted = router.query.section
    if (!wanted) return
    const match = tree.find(s => s.name.toLowerCase() === String(wanted).toLowerCase())
    if (match) setSectionId(match.id)
  }, [router.isReady, router.query.section, tree])

  useEffect(() => {
    fetch(`${API}/fyq/tree/`).then(r => r.json()).then(setTree).catch(() => setTree([])).finally(() => setLoading(false))
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

  const goHome = () => { setSectionId(null); setCategoryId(null); setTopicId(null); setSearch('') }
  const goSection = () => { setCategoryId(null); setTopicId(null) }
  const goCategory = () => { setTopicId(null) }

  return (
    <>
      <PageSEO
        title="FYQs — CAT Future Year Questions — GRADSKOOL"
        description="Hundreds of CAT Future Year Questions, organized by topic, with full video solutions and written explanations, by ALP Sir."
        keywords="future year questions, FYQ, CAT future year questions, ALP Sir FYQ"
        canonical="https://gradskool.in/fyqs"
        breadcrumbs={[{ name:'Home', url:'/' }, { name:'FYQs', url:'/fyqs' }]}
      />

      <style>{`
        .fyq-hero { max-width:900px; margin:0 auto; padding:56px 40px 24px; text-align:center; }
        .fyq-eyebrow { font-family:var(--font-sans); font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--red); margin-bottom:14px; }
        .fyq-h1 { font-family:var(--font-serif); font-size:clamp(30px,4.5vw,46px); font-weight:400; color:var(--black); line-height:1.15; margin-bottom:14px; }
        .fyq-sub { font-family:var(--font-body); font-size:15px; color:var(--g700); line-height:1.7; max-width:600px; margin:0 auto; }
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
      `}</style>

      <div className="fyq-hero">
        <p className="fyq-eyebrow">CAT Question Bank</p>
        <h1 className="fyq-h1">Future Year Questions</h1>
        <p className="fyq-sub">Real questions, full video solutions, written explanations — by ALP Sir.</p>
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
    </>
  )
}
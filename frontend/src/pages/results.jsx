/**
 * GRADSKOOL — Results Wall (public)
 * Route: /results
 *
 * Displays verified student results added via the admin Results Wall
 * manager (/admin-panel/results-wall). Was previously admin-only with
 * no public page to actually display them — this fills that gap.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageSEO from '../components/seo/PageSEO'
import api from '../lib/api'
import { S } from '../components/courses/CourseLayout'

const R = { color: 'var(--red)' }
const EXAMS = ['all', 'cat', 'xat', 'snap', 'nmat', 'gmat', 'gre', 'ipmat', 'clat', 'cuet']

export default function ResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    const q = filter !== 'all' ? `?exam=${filter}` : ''
    api.get(`/dashboard/results-wall/public/${q}`)
      .then(({ data }) => setResults(data.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = results

  return (
    <>
      <PageSEO
        title="Results — GRADSKOOL Student Selections"
        description="Verified student results from GRADSKOOL — percentiles, scores, and college calls across CAT, XAT, SNAP, NMAT, GMAT and more."
        keywords="GRADSKOOL results, CAT results, student selections, GRADSKOOL toppers, ALP Sir student results"
        canonical="https://gradskool.in/results"
        breadcrumbs={[{name:'Home',url:'/'},{name:'Results',url:'/results'}]}
        speakableSelectors={['h1']}
      />

      <section style={{ padding:'72px 24px 40px', maxWidth:960, margin:'0 auto' }}>
        <style>{S}</style>
        <div className="eyebrow" style={{ marginBottom:14 }}><span className="dot" />Verified Results</div>
        <h1 className="d-xl" style={{ marginBottom:16, maxWidth:640 }}>Results that <em style={R}>speak for themselves.</em></h1>
        <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.85, maxWidth:560 }}>
          Real students, real percentiles, real selections — every result here is verified before it's shown.
        </p>

        {/* exam filter */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:32 }}>
          {EXAMS.map(e => (
            <button key={e} onClick={() => setFilter(e)}
              style={{
                padding:'6px 16px', borderRadius:20, border:'var(--border)', cursor:'pointer',
                fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600,
                background: filter === e ? 'var(--red)' : '#fff',
                color: filter === e ? '#fff' : 'var(--g700)',
              }}>
              {e === 'all' ? 'All Exams' : e.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding:'0 24px 80px', maxWidth:960, margin:'0 auto' }}>
        {loading && (
          <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textAlign:'center', padding:'40px 0' }}>Loading results…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'64px 24px', border:'var(--border)', borderRadius:4, background:'var(--off)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🏆</div>
            <p style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--g500)' }}>
              {filter === 'all' ? 'Results coming soon.' : `No ${filter.toUpperCase()} results yet.`}
            </p>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map(r => {
            const CardTag = r.slug ? Link : 'div'
            const cardProps = r.slug ? { href: `/results/${r.slug}` } : {}
            return (
            <CardTag key={r.id} {...cardProps} style={{ background:'#fff', border:'var(--border)', borderRadius:4, padding:'20px 24px', textDecoration:'none', display:'block', cursor: r.slug ? 'pointer' : 'default' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'var(--font-serif)', fontSize:17, flexShrink:0 }}>
                  {r.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:700, color:'var(--black)' }}>{r.name}{r.video_type && ' 🎬'}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)' }}>{r.exam?.toUpperCase()} {r.year}</div>
                </div>
              </div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:700, color:'#16a34a', marginBottom:6 }}>
                ✓ {r.percentile}%ile{r.score ? ` — Score: ${r.score}` : ''}
              </div>
              {r.college_calls && (
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g700)', marginBottom:r.testimonial ? 10 : 0 }}>
                  {r.college_calls}
                </div>
              )}
              {r.testimonial && (
                <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--g700)', lineHeight:1.6, fontStyle:'italic', borderTop:'var(--border)', paddingTop:10 }}>
                  "{r.testimonial}"
                </p>
              )}
              {r.slug && (
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--red)', fontWeight:600, marginTop:10 }}>Read full story →</div>
              )}
            </CardTag>
            )
          })}
        </div>
      </section>

      <section style={{ padding:'0 24px 80px', textAlign:'center' }}>
        <Link href="/courses/cat" className="btn btn-red">See Our Courses →</Link>
      </section>
    </>
  )
}
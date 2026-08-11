/**
 * GRADSKOOL — Individual Result / Success Story (public)
 * Route: /results/<slug>
 *
 * Blog-style detail page for a single verified result — interview
 * video (YouTube or Bunny), full write-up, and SEO tags. Content is
 * managed via /admin-panel/results-wall. Uses getServerSideProps
 * (not static generation) since results are added/edited any time via
 * the admin panel — same reasoning as the foundations/[exam] page.
 */
import Link from 'next/link'
import PageSEO from '../../components/seo/PageSEO'
import { S } from '../../components/courses/CourseLayout'

const R = { color: 'var(--red)' }
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function youtubeEmbedUrl(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export async function getServerSideProps({ params }) {
  try {
    const res = await fetch(`${API}/dashboard/results-wall/public/${params.slug}/`)
    if (!res.ok) return { notFound: true }
    const result = await res.json()
    return { props: { result } }
  } catch {
    return { notFound: true }
  }
}

export default function ResultDetailPage({ result }) {
  const {
    name, exam, year, percentile, score, college_calls,
    testimonial, video_type, video_url, body, meta_title, meta_description,
  } = result

  const title = meta_title || `${name} — ${exam?.toUpperCase()} ${percentile}%ile | GRADSKOOL Results`
  const description = meta_description || testimonial || `${name}'s ${exam?.toUpperCase()} ${year} result — ${percentile} percentile.${college_calls ? ` Calls from ${college_calls}.` : ''}`

  const embedSrc = video_type === 'youtube' ? youtubeEmbedUrl(video_url) : video_type === 'bunny' ? video_url : null

  return (
    <>
      <PageSEO
        title={title}
        description={description}
        ogType="article"
        canonical={`https://gradskool.in/results/${result.slug}`}
        breadcrumbs={[{name:'Home',url:'/'},{name:'Results',url:'/results'},{name:name,url:`/results/${result.slug}`}]}
        speakableSelectors={['h1']}
      />
      <style>{S}</style>

      <article style={{ maxWidth:720, margin:'0 auto', padding:'56px 24px 80px' }}>
        <Link href="/results" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← All Results</Link>

        <div className="eyebrow" style={{ marginTop:24, marginBottom:14 }}>
          <span className="dot" />{exam?.toUpperCase()} {year}
        </div>
        <h1 className="d-xl" style={{ marginBottom:20 }}>{name}</h1>

        <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginBottom:32, paddingBottom:24, borderBottom:'var(--border)' }}>
          <div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'#16a34a', lineHeight:1 }}>{percentile}%ile</div>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:4 }}>Percentile</div>
          </div>
          {score && (
            <div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'var(--black)', lineHeight:1 }}>{score}</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:4 }}>Score</div>
            </div>
          )}
          {college_calls && (
            <div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', lineHeight:1.3, maxWidth:280 }}>{college_calls}</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:4 }}>College Calls</div>
            </div>
          )}
        </div>

        {embedSrc && (
          <div style={{ position:'relative', paddingTop:'56.25%', marginBottom:32, background:'#000', borderRadius:4, overflow:'hidden' }}>
            <iframe
              src={embedSrc}
              style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${name} interview`}
            />
          </div>
        )}

        {testimonial && (
          <p style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)', lineHeight:1.6, fontStyle:'italic', marginBottom:32, paddingLeft:20, borderLeft:'3px solid var(--red)' }}>
            "{testimonial}"
          </p>
        )}

        {body && (
          <div style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--g700)', lineHeight:1.9, whiteSpace:'pre-wrap' }}>
            {body}
          </div>
        )}

        <div style={{ marginTop:56, paddingTop:32, borderTop:'var(--border)', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontSize:20, color:'var(--black)', marginBottom:16 }}>Want a result like this?</p>
          <Link href="/courses/cat" className="btn btn-red">See Our Courses →</Link>
        </div>
      </article>
    </>
  )
}
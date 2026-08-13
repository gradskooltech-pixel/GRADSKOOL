/**
 * GRADSKOOL — Individual Result / Success Story (public)
 * Route: /results/<slug>
 *
 * Rebuilt to match the original, richer story-page design (recovered
 * from the site's original HTML source) — a tag badge, headline +
 * subtitle, interview video, narrative body, a standout pull-quote, a
 * WhatsApp-style testimonial bubble, a structured outcome box, and a
 * "more stories" grid at the bottom for engagement/internal linking.
 * Older/simpler results (percentile-focused, no tag/pull_quote) still
 * render fine — every rich-story section is conditional on having data.
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

    // "More stories" — a handful of other verified results, for the
    // grid at the bottom. Best-effort: page still works fine without it.
    let moreStories = []
    try {
      const moreRes = await fetch(`${API}/dashboard/results-wall/public/`)
      if (moreRes.ok) {
        const data = await moreRes.json()
        moreStories = (data.results || [])
          .filter(r => r.slug && r.slug !== params.slug)
          .slice(0, 5)
      }
    } catch {}

    return { props: { result, moreStories } }
  } catch {
    return { notFound: true }
  }
}

function WhatsAppCard({ name, message }) {
  if (!message) return null
  const lines = message.split('\n').filter(Boolean)
  return (
    <div style={{ background:'#ece5dd', borderRadius:12, padding:'20px 24px', margin:'32px 0', maxWidth:520 }}>
      <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, color:'var(--black)', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#25D366', display:'inline-block' }} />
        {name}
      </div>
      <div style={{ background:'#fff', borderRadius:'0 8px 8px 8px', padding:'12px 16px', fontFamily:'var(--font-sans)', fontSize:14, color:'var(--black)', lineHeight:1.6, boxShadow:'0 1px 2px rgba(0,0,0,.1)' }}>
        {lines.map((line, i) => <div key={i} style={{ marginBottom: i === lines.length - 1 ? 0 : 4 }}>{line}</div>)}
        <div style={{ fontSize:11, color:'var(--g500)', textAlign:'right', marginTop:6 }}>WhatsApp</div>
      </div>
    </div>
  )
}

export default function ResultDetailPage({ result, moreStories = [] }) {
  const {
    name, exam, year, percentile, score, college_calls,
    testimonial, video_type, video_url, body, meta_title, meta_description,
    tag, subtitle, pull_quote, whatsapp_message, outcome_label, outcome_value, outcome_description,
  } = result

  const title = meta_title || `${name} — ${exam?.toUpperCase()} ${percentile ? `${percentile}%ile` : ''} | GRADSKOOL Results`
  const description = meta_description || testimonial || `${name}'s ${exam?.toUpperCase()} ${year} result.${college_calls ? ` ${college_calls}.` : ''}`

  const embedSrc = video_type === 'youtube' ? youtubeEmbedUrl(video_url) : video_type === 'bunny' ? video_url : null
  const isRichStory = !!(tag || pull_quote || outcome_value)

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

      <article style={{ maxWidth:720, margin:'0 auto', padding:'56px 24px 0' }}>
        <Link href="/results" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>← All Results</Link>

        {tag ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-sans)', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'#1a6e3c', marginTop:24, marginBottom:16 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#1a6e3c', display:'inline-block' }} />
            {tag}
          </div>
        ) : (
          <div className="eyebrow" style={{ marginTop:24, marginBottom:14 }}>
            <span className="dot" />{exam?.toUpperCase()} {year}
          </div>
        )}

        <h1 className="d-xl" style={{ marginBottom: subtitle ? 16 : 20 }}>{name}</h1>
        {subtitle && (
          <p style={{ fontFamily:'var(--font-body)', fontSize:16, color:'var(--g700)', lineHeight:1.8, maxWidth:560, marginBottom:24 }}>{subtitle}</p>
        )}

        <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginBottom:32, paddingBottom:24, borderBottom:'var(--border)' }}>
          {percentile > 0 && (
            <div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'#16a34a', lineHeight:1 }}>{percentile}%ile</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:4 }}>Percentile</div>
            </div>
          )}
          {score && (
            <div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:26, color:'var(--black)', lineHeight:1 }}>{score}</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:4 }}>Score</div>
            </div>
          )}
          {college_calls && (
            <div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', lineHeight:1.3, maxWidth:280 }}>{college_calls}</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'var(--g500)', marginTop:4 }}>{isRichStory ? 'Outcome' : 'College Calls'}</div>
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

        {body && (
          <div style={{ fontFamily:'var(--font-body)', fontSize:16, color:'var(--g700)', lineHeight:1.95, whiteSpace:'pre-wrap', marginBottom: pull_quote ? 8 : 32 }}>
            {body}
          </div>
        )}

        {pull_quote && (
          <div style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(18px,2.5vw,22px)', fontStyle:'italic', color:'var(--black)', lineHeight:1.5, borderLeft:'3px solid var(--red)', paddingLeft:24, margin:'36px 0' }}>
            "{pull_quote}"
          </div>
        )}

        <WhatsAppCard name={name} message={whatsapp_message || (!body && !pull_quote ? testimonial : '')} />

        {!isRichStory && testimonial && (
          <p style={{ fontFamily:'var(--font-serif)', fontSize:19, color:'var(--black)', lineHeight:1.6, fontStyle:'italic', marginBottom:32, paddingLeft:20, borderLeft:'3px solid var(--red)' }}>
            "{testimonial}"
          </p>
        )}

        {outcome_value && (
          <div style={{ background:'var(--off)', border:'var(--border)', borderRadius:4, padding:'28px 32px', margin:'32px 0' }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)', marginBottom:8 }}>{outcome_label || 'Outcome'}</div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:24, color:'var(--black)', marginBottom:8 }}>{outcome_value}</div>
            {outcome_description && (
              <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--g700)', lineHeight:1.8 }}>{outcome_description}</div>
            )}
          </div>
        )}
      </article>

      <div style={{ background:'var(--black)', padding:'48px 0', marginTop:56 }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
          <div>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(20px,3vw,28px)', fontWeight:400, color:'#fff', lineHeight:1.2 }}>
              Prepare with the same<br /><em style={R}>method that worked.</em>
            </h3>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', marginTop:6 }}>{name} prepared with GRADSKOOL. So can you.</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Link href="/courses" className="btn btn-red">See Our Courses →</Link>
            <a href={`https://wa.me/917838737388?text=${encodeURIComponent(`Hi ALP Sir, I read ${name}'s story and want to know more`)}`}
              target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <span className="wa-dot" />WhatsApp ALP Sir
            </a>
          </div>
        </div>
      </div>

      {moreStories.length > 0 && (
        <div style={{ padding:'56px 0', borderTop:'var(--border)' }}>
          <div className="container">
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:24, fontWeight:400, color:'var(--black)', marginBottom:24 }}>More student stories</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:1, background:'var(--g200)', border:'var(--border)', borderRadius:4, overflow:'hidden' }}>
              {moreStories.map(s => (
                <Link key={s.slug} href={`/results/${s.slug}`}
                  style={{ background:'#fff', padding:20, display:'block', textDecoration:'none' }}>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--red)', marginBottom:6 }}>{s.tag || `${s.exam?.toUpperCase()} ${s.year}`}</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:16, color:'var(--black)', marginBottom:3 }}>{s.name}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}>{s.college_calls}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
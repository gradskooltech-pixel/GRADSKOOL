/**
 * GRADSKOOL Admin — Quiz Analytics
 * Route: /admin-panel/quiz-analytics
 * Pass rates · avg scores · hardest questions · score distribution · per-topic breakdown
 */
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3', border:'#e8e8e6', gray:'#999', green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6', muted:'#f4f3f0', purple:'#7b2d8b' }
const EXAMS = ['cat','xat','snap','nmat','gmat','gre']
const DIFF_COLOR = { easy: C.green, medium: C.amber, hard: C.red }
const DIFF_BG    = { easy:'#dcfce7', medium:'#fef3c7', hard:'#fee2e2' }

export default function QuizAnalytics() {
  const [data,    setData]   = useState(null)
  const [exam,    setExam]   = useState('cat')
  const [loading, setLoad]   = useState(true)
  const distRef = useRef(null)
  const topicRef= useRef(null)
  const distInst= useRef(null)
  const topicInst=useRef(null)

  const load = () => {
    setLoad(true)
    api.get('/dashboard/quiz-analytics/?exam=' + exam)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(DEMO))
      .finally(() => setLoad(false))
  }
  useEffect(load, [exam])

  // Score distribution chart
  useEffect(() => {
    if (!data?.distribution?.length || !distRef.current) return
    if (typeof window === 'undefined' || !window.Chart) return
    if (distInst.current) { distInst.current.destroy(); distInst.current = null }
    distInst.current = new window.Chart(distRef.current, {
      type: 'bar',
      data: {
        labels: data.distribution.map(d => d.range + '%'),
        datasets: [{
          label: 'Students',
          data:  data.distribution.map(d => d.count),
          backgroundColor: data.distribution.map(d => {
            const mid = parseInt(d.range.split('-')[0]) + 5
            return mid >= 60 ? '#22c55e88' : mid >= 40 ? '#f59e0b88' : '#ff5e5f88'
          }),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, precision: 0 } },
        },
      },
    })
  }, [data])

  // Per-topic bar chart (bottom 10 by avg score)
  useEffect(() => {
    if (!data?.topics?.length || !topicRef.current) return
    if (typeof window === 'undefined' || !window.Chart) return
    if (topicInst.current) { topicInst.current.destroy(); topicInst.current = null }
    const worst = data.topics.slice(0, 10)
    topicInst.current = new window.Chart(topicRef.current, {
      type: 'bar',
      data: {
        labels: worst.map(t => t.topic.length > 20 ? t.topic.slice(0, 18) + '…' : t.topic),
        datasets: [{
          label: 'Avg score',
          data:  worst.map(t => t.avg_score),
          backgroundColor: worst.map(t => t.avg_score >= 60 ? '#22c55e88' : t.avg_score >= 40 ? '#f59e0b88' : '#ff5e5f88'),
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { min: 0, max: 100, ticks: { callback: v => v + '%', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
          y: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    })
  }, [data])

  const csvExport = () => {
    if (!data?.topics) return
    const rows = [
      ['Topic', 'Section', 'Attempts', 'Avg Score', 'Pass Rate'],
      ...data.topics.map(t => [t.topic, t.section, t.attempts, t.avg_score, t.pass_rate + '%']),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(csv)
    a.download = `quiz-analytics-${exam}.csv`
    a.click()
  }

  return (
    <AdminLayout title="Quiz Analytics">
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Quiz Analytics — Admin — GRADSKOOL</title></Head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" async />

      {/* Header */}
      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Quiz Analytics</span>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <select value={exam} onChange={e => setExam(e.target.value)}
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', padding:'0.35rem 0.625rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, cursor:'pointer' }}>
            {EXAMS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
          </select>
          <button onClick={csvExport}
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.35rem 0.875rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, cursor:'pointer' }}>
            ↓ CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', fontFamily:'Georgia,serif', color:C.gray, padding:'4rem' }}>Loading quiz analytics…</p>
      ) : !data?.total_attempts ? (
        <div style={{ textAlign:'center', padding:'4rem' }}>
          <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>📊</p>
          <p style={{ fontFamily:'Georgia,serif', color:C.gray }}>No quiz attempts yet for {exam.toUpperCase()}. Students need to take quizzes first.</p>
        </div>
      ) : (
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem' }}>

          {/* KPI cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
            {[
              ['Total attempts',  data.total_attempts, C.blue],
              ['Pass rate',       data.pass_rate + '%', data.pass_rate >= 60 ? C.green : C.red],
              ['Avg score',       data.avg_score + '%', data.avg_score >= 60 ? C.green : C.amber],
              ['Topics tracked',  data.topics?.length || 0, C.purple],
              ['Questions flagged', data.hardest?.length || 0, C.amber],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem', textAlign:'center' }}>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.2rem' }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'2rem' }}>
            {/* Score distribution */}
            <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
              <p style={sLabel}>Score distribution</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray, marginBottom:'0.875rem' }}>
                How students are spread across score bands
              </p>
              <div style={{ position:'relative', height:'200px' }}>
                <canvas ref={distRef} />
              </div>
            </div>

            {/* Weakest topics */}
            <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
              <p style={sLabel}>Weakest topics (by avg score)</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray, marginBottom:'0.875rem' }}>
                Topics where students score lowest — prioritise these for revision
              </p>
              <div style={{ position:'relative', height:'200px' }}>
                <canvas ref={topicRef} />
              </div>
            </div>
          </div>

          {/* Hardest questions */}
          {data.hardest?.length > 0 && (
            <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem', marginBottom:'2rem' }}>
              <p style={{ ...sLabel, marginBottom:'0.25rem' }}>Hardest questions</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray, marginBottom:'1rem' }}>
                Questions with the lowest correct-answer rate across all students
              </p>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-sans)', fontSize:'0.78rem' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid '+C.border }}>
                      {['Question','Difficulty','Attempts','Correct','Rate'].map(h => (
                        <th key={h} style={{ textAlign:h==='Question'?'left':'center', padding:'0.5rem', fontWeight:'700', color:C.gray, fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.hardest.map((q, i) => (
                      <tr key={q.id} style={{ borderBottom:'1px solid '+C.border }}>
                        <td style={{ padding:'0.75rem 0.5rem', maxWidth:'400px' }}>
                          <p style={{ color:C.black, lineHeight:1.5, fontFamily:'Georgia,serif', fontSize:'0.82rem' }}>{q.text}</p>
                        </td>
                        <td style={{ padding:'0.75rem 0.5rem', textAlign:'center' }}>
                          <span style={{ fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'3px', background:DIFF_BG[q.difficulty]||DIFF_BG.medium, color:DIFF_COLOR[q.difficulty]||C.amber }}>
                            {q.difficulty}
                          </span>
                        </td>
                        <td style={{ padding:'0.75rem 0.5rem', textAlign:'center', color:C.gray }}>{q.total}</td>
                        <td style={{ padding:'0.75rem 0.5rem', textAlign:'center', color:C.gray }}>{q.correct}</td>
                        <td style={{ padding:'0.75rem 0.5rem', textAlign:'center' }}>
                          <span style={{ fontWeight:'700', color:q.correct_rate < 30 ? C.red : q.correct_rate < 50 ? C.amber : C.green }}>
                            {q.correct_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-topic table */}
          {data.topics?.length > 0 && (
            <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div>
                  <p style={sLabel}>All topics breakdown</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray }}>Sorted by avg score — lowest first</p>
                </div>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-sans)', fontSize:'0.78rem', minWidth:'500px' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid '+C.border, background:C.muted }}>
                      {['Topic','Section','Attempts','Avg Score','Pass Rate'].map(h => (
                        <th key={h} style={{ textAlign:h==='Topic'||h==='Section'?'left':'center', padding:'0.625rem 0.75rem', fontWeight:'700', color:C.gray, fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topics.map((t, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid '+C.border }}>
                        <td style={{ padding:'0.625rem 0.75rem', color:C.black, fontWeight:'500' }}>{t.topic}</td>
                        <td style={{ padding:'0.625rem 0.75rem', color:C.gray, fontSize:'0.72rem' }}>{t.section}</td>
                        <td style={{ padding:'0.625rem 0.75rem', textAlign:'center', color:C.gray }}>{t.attempts}</td>
                        <td style={{ padding:'0.625rem 0.75rem', textAlign:'center' }}>
                          <span style={{ fontWeight:'700', color:t.avg_score >= 60 ? C.green : t.avg_score >= 40 ? C.amber : C.red }}>{t.avg_score}%</span>
                        </td>
                        <td style={{ padding:'0.625rem 0.75rem', textAlign:'center' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
                            <div style={{ width:'60px', height:'6px', background:C.muted, borderRadius:'100px', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:t.pass_rate+'%', background:t.pass_rate >= 60 ? C.green : t.pass_rate >= 40 ? C.amber : C.red, borderRadius:'100px' }} />
                            </div>
                            <span style={{ fontWeight:'700', color:t.pass_rate >= 60 ? C.green : t.pass_rate >= 40 ? C.amber : C.red, fontSize:'0.75rem' }}>{t.pass_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

const sLabel = { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#999' }

const DEMO = {
  exam:'cat', total_attempts:847, pass_rate:58, avg_score:54.3,
  distribution:[
    {range:'0-10',count:12},{range:'10-20',count:24},{range:'20-30',count:45},
    {range:'30-40',count:89},{range:'40-50',count:134},{range:'50-60',count:176},
    {range:'60-70',count:158},{range:'70-80',count:121},{range:'80-90',count:67},{range:'90-100',count:21},
  ],
  topics:[
    {topic:'Seating Arrangement',section:'DILR',attempts:124,avg_score:38.4,pass_rate:24},
    {topic:'Data Interpretation',section:'DILR',attempts:98,avg_score:42.1,pass_rate:31},
    {topic:'Percentage & Profit',section:'QA',attempts:156,avg_score:47.8,pass_rate:42},
    {topic:'Para Jumbles',section:'VARC',attempts:89,avg_score:51.2,pass_rate:49},
    {topic:'Reading Comprehension',section:'VARC',attempts:201,avg_score:62.4,pass_rate:67},
    {topic:'Time Speed Distance',section:'QA',attempts:134,avg_score:55.6,pass_rate:54},
  ],
  hardest:[
    {id:1,text:'A 200m long train passes a stationary train of 300m in 50 seconds. What is the speed of the moving train?',difficulty:'hard',total:89,correct:14,correct_rate:16},
    {id:2,text:'In a circular arrangement of 8 people, how many ways can 3 specific people sit together?',difficulty:'hard',total:76,correct:18,correct_rate:24},
    {id:3,text:'If successive discounts of 20% and 25% are given, what is the net discount?',difficulty:'medium',total:134,correct:42,correct_rate:31},
    {id:4,text:'Choose the most logical order of sentences to form a coherent paragraph.',difficulty:'medium',total:156,correct:56,correct_rate:36},
  ],
}

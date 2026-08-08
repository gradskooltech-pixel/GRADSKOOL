/**
 * GRADSKOOL — Mock Score Tracker
 * Route: /dashboard/mock-scores
 * Log every mock, see trend, sectional breakdown
 */
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'

const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3', border:'#e8e8e6', gray:'#999', green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6', muted:'#f4f3f0' }

const CAT_SECTIONS = [
  { key:'varc', label:'VARC',  color:'#3b82f6' },
  { key:'dilr', label:'DILR',  color:'#7b2d8b' },
  { key:'qa',   label:'QA',    color:'#f59e0b' },
]
const PROVIDERS = ['testfunda','gradskool','ims','time','cl','cracku','other']

export default function MockScores() { return <ProtectedRoute><Inner /></ProtectedRoute> }

function Inner() {
  const { user }   = useAuth()
  const exam       = user?.target_exam || 'cat'
  const [scores,   setScores]  = useState([])
  const [modal,    setModal]   = useState(false)
  const [editing,  setEditing] = useState(null)
  const [form,     setForm]    = useState(defaultForm(exam))
  const [saving,   setSaving]  = useState(false)
  const [loading,  setLoad]    = useState(true)
  const [msg,      setMsg]     = useState(null)
  const chartRef = useRef(null)
  const chartInst= useRef(null)

  const load = () => {
    setLoad(true)
    api.get('/learn/mock-scores/?exam=' + exam)
      .then(({ data }) => setScores(data.scores || []))
      .catch(() => setScores([]))
      .finally(() => setLoad(false))
  }
  useEffect(load, [exam])

  // Draw trend chart
  useEffect(() => {
    if (!scores.length || !chartRef.current) return
    if (typeof window === 'undefined' || !window.Chart) return
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null }

    const labels  = scores.map((s, i) => s.mock_name ? s.mock_name.slice(0, 12) : `Mock ${i + 1}`)
    const overall = scores.map(s => s.overall_score)

    const sectionDatasets = CAT_SECTIONS.map(sec => ({
      label:           sec.label,
      data:            scores.map(s => s.sections?.[sec.key]?.score ?? null),
      borderColor:     sec.color,
      backgroundColor: sec.color + '22',
      tension:         0.3,
      fill:            false,
      pointRadius:     4,
    }))

    chartInst.current = new window.Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Overall', data: overall,
            borderColor: C.red, backgroundColor: C.red + '22',
            tension: 0.3, fill: true, pointRadius: 5, borderWidth: 2,
          },
          ...sectionDatasets,
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
        },
      },
    })
  }, [scores, loading])

  const notify = (text, type='success') => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000) }

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm(exam))
    setModal(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      exam_slug:          s.exam_slug,
      mock_name:          s.mock_name || '',
      provider:           s.provider || 'testfunda',
      taken_on:           s.taken_on || '',
      mock_number:        s.mock_number || 0,
      overall_score:      s.overall_score || 0,
      overall_percentile: s.overall_percentile || '',
      notes:              s.notes || '',
      varc_score:   s.sections?.varc?.score || '',
      varc_correct: s.sections?.varc?.correct || '',
      dilr_score:   s.sections?.dilr?.score || '',
      dilr_correct: s.sections?.dilr?.correct || '',
      qa_score:     s.sections?.qa?.score || '',
      qa_correct:   s.sections?.qa?.correct || '',
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.taken_on) { notify('Select a date', 'error'); return }
    setSaving(true)
    const sections = {}
    for (const sec of CAT_SECTIONS) {
      const score   = parseFloat(form[`${sec.key}_score`])
      const correct = parseInt(form[`${sec.key}_correct`])
      if (!isNaN(score)) sections[sec.key] = { score, correct: isNaN(correct) ? 0 : correct }
    }
    const payload = {
      exam_slug:          form.exam_slug,
      mock_name:          form.mock_name,
      provider:           form.provider,
      taken_on:           form.taken_on,
      mock_number:        parseInt(form.mock_number) || scores.length + 1,
      overall_score:      parseFloat(form.overall_score) || 0,
      overall_percentile: form.overall_percentile ? parseFloat(form.overall_percentile) : null,
      sections,
      notes:              form.notes,
    }
    try {
      if (editing) await api.put('/learn/mock-scores/' + editing.id + '/', payload)
      else         await api.post('/learn/mock-scores/', payload)
      notify(editing ? 'Updated' : 'Mock logged!')
      setModal(false)
      load()
    } catch(e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this mock entry?')) return
    await api.delete('/learn/mock-scores/' + id + '/').catch(() => {})
    notify('Deleted')
    load()
  }

  const best       = scores.length ? Math.max(...scores.map(s => s.overall_score)) : 0
  const latest     = scores[scores.length - 1]
  const avg        = scores.length ? Math.round(scores.reduce((a, s) => a + s.overall_score, 0) / scores.length) : 0
  const trend      = scores.length >= 2 ? scores[scores.length-1].overall_score - scores[0].overall_score : 0

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Mock Score Tracker — GRADSKOOL</title></Head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" async />

      <div style={{ height:'52px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/dashboard?tab=progress" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← Dashboard</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>{exam.toUpperCase()} Mock Tracker</span>
        </div>
        <button onClick={openAdd}
          style={{ padding:'0.4rem 1rem', background:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer' }}>
          + Log Mock
        </button>
      </div>

      {msg && <div style={{ position:'fixed', top:'60px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>{msg.text}</div>}

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'2rem' }}>
        {/* Summary stats */}
        {scores.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
            {[
              ['Mocks taken', scores.length, C.blue],
              ['Best score',  best,           C.green],
              ['Average',     avg,            C.amber],
              ['Trend',       (trend >= 0 ? '+' : '') + Math.round(trend), trend >= 0 ? C.green : C.red],
              ...(latest?.overall_percentile ? [['Latest %ile', latest.overall_percentile + '%', C.purple||C.red]] : []),
            ].map(([label, val, color]) => (
              <div key={label} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1rem', textAlign:'center' }}>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.2rem' }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Trend chart */}
        {scores.length >= 2 && (
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem', marginBottom:'1.5rem' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:C.gray, marginBottom:'1rem' }}>Score Trend</p>
            <div style={{ position:'relative', height:'220px' }}>
              <canvas ref={chartRef} />
            </div>
          </div>
        )}

        {/* Score list */}
        {loading ? (
          <p style={{ textAlign:'center', fontFamily:'Georgia,serif', color:C.gray, padding:'3rem' }}>Loading…</p>
        ) : !scores.length ? (
          <div style={{ textAlign:'center', padding:'4rem', background:C.white, border:'1px dashed '+C.border, borderRadius:'8px' }}>
            <p style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📊</p>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>No mocks logged yet</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:C.gray, marginBottom:'1.5rem' }}>After every mock, log your score here to track improvement.</p>
            <button onClick={openAdd} style={{ padding:'0.75rem 1.5rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' }}>Log First Mock →</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {[...scores].reverse().map((s, i) => (
              <div key={s.id} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.875rem', flexWrap:'wrap', gap:'0.5rem' }}>
                  <div>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:C.black, marginBottom:'0.2rem' }}>
                      {s.mock_name || `Mock ${s.mock_number || scores.length - i}`}
                    </p>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray }}>
                      {new Date(s.taken_on).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      {s.provider && s.provider !== 'other' && ` · ${s.provider}`}
                    </p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color:s.overall_score >= 120 ? C.green : s.overall_score >= 80 ? C.amber : C.red, lineHeight:1 }}>
                        {s.overall_score}
                      </p>
                      {s.overall_percentile && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{s.overall_percentile}%ile</p>}
                    </div>
                    <div style={{ display:'flex', gap:'0.375rem' }}>
                      <button onClick={() => openEdit(s)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.25rem 0.5rem', border:'1px solid '+C.border, borderRadius:'3px', cursor:'pointer', background:C.white }}>✎</button>
                      <button onClick={() => del(s.id)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.25rem 0.5rem', border:'1px solid #fca5a5', borderRadius:'3px', cursor:'pointer', background:C.white, color:C.red }}>✕</button>
                    </div>
                  </div>
                </div>

                {/* Section breakdown */}
                {Object.keys(s.sections || {}).length > 0 && (
                  <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', paddingTop:'0.75rem', borderTop:'1px solid '+C.border }}>
                    {CAT_SECTIONS.filter(sec => s.sections?.[sec.key]).map(sec => (
                      <div key={sec.key} style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', color:sec.color, background:sec.color+'15', padding:'0.1rem 0.4rem', borderRadius:'3px' }}>{sec.label}</span>
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>{s.sections[sec.key].score}</span>
                      </div>
                    ))}
                  </div>
                )}

                {s.notes && (
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'0.78rem', color:C.gray, marginTop:'0.625rem', fontStyle:'italic', lineHeight:1.6 }}>{s.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log mock modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={e=>e.target===e.currentTarget&&(setModal(false),setEditing(null))}>
          <div style={{ background:C.white, borderRadius:'8px', width:'100%', maxWidth:'540px', maxHeight:'90vh', overflowY:'auto', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:C.black, marginBottom:'1.5rem' }}>
              {editing ? 'Edit Mock Score' : 'Log a Mock Test'}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <F label="Mock name" value={form.mock_name} onChange={v=>setForm(f=>({...f,mock_name:v}))} placeholder="e.g. Testfunda CAT Mock 3" />
                <div>
                  <label style={s.lbl}>Provider</label>
                  <select value={form.provider} onChange={e=>setForm(f=>({...f,provider:e.target.value}))} style={s.inp}>
                    {PROVIDERS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={s.lbl}>Date taken *</label>
                  <input type="date" value={form.taken_on} onChange={e=>setForm(f=>({...f,taken_on:e.target.value}))} style={s.inp} />
                </div>
                <F label="Overall score *" value={form.overall_score} onChange={v=>setForm(f=>({...f,overall_score:v}))} placeholder="-72 to 198" type="number" />
                <F label="Percentile (optional)" value={form.overall_percentile} onChange={v=>setForm(f=>({...f,overall_percentile:v}))} placeholder="e.g. 87.5" type="number" />
              </div>

              {/* Section scores */}
              <div style={{ background:C.muted, borderRadius:'6px', padding:'1rem' }}>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', color:C.gray, marginBottom:'0.75rem' }}>Section scores (optional)</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                  {CAT_SECTIONS.map(sec => (
                    <div key={sec.key} style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr', gap:'0.5rem', alignItems:'center' }}>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:sec.color }}>{sec.label}</span>
                      <F label="" value={form[sec.key+'_score']} onChange={v=>setForm(f=>({...f,[sec.key+'_score']:v}))} placeholder="Score" type="number" />
                      <F label="" value={form[sec.key+'_correct']} onChange={v=>setForm(f=>({...f,[sec.key+'_correct']:v}))} placeholder="Correct" type="number" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={s.lbl}>Notes / Analysis (optional)</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ ...s.inp, height:'70px', resize:'vertical' }} placeholder="What went wrong? What to improve this week?" />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid '+C.border }}>
              <button onClick={()=>{setModal(false);setEditing(null)}} style={{ padding:'0.625rem 1.25rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving||!form.taken_on}
                style={{ padding:'0.625rem 1.5rem', background:saving?C.gray:C.red, color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:saving?'not-allowed':'pointer' }}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Log Mock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function defaultForm(exam) {
  const today = new Date().toISOString().slice(0, 10)
  return { exam_slug:exam, mock_name:'', provider:'testfunda', taken_on:today, mock_number:'', overall_score:'', overall_percentile:'', varc_score:'', varc_correct:'', dilr_score:'', dilr_correct:'', qa_score:'', qa_correct:'', notes:'' }
}

function F({ label, value, onChange, placeholder, type='text' }) {
  return (
    <div>
      {label && <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' }}>{label}</label>}
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' }} />
    </div>
  )
}

const s = {
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
}

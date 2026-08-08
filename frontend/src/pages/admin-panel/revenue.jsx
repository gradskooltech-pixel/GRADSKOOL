/**
 * GRADSKOOL Admin — Revenue
 * Route: /admin-panel/revenue
 * MRR · ARR · daily Chart.js · plan breakdown · orders · CSV export
 */
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'

const C = { red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3', border:'#e8e8e6', gray:'#999', green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6', muted:'#f4f3f0' }
const EXAMS = ['','cat','xat','snap','nmat','gmat','gre']

export default function Revenue() {
  const [data,    setData]   = useState(null)
  const [days,    setDays]   = useState(30)
  const [exam,    setExam]   = useState('')
  const [loading, setLoad]   = useState(true)
  const [tab,     setTab]    = useState('overview')
  const lineRef = useRef(null)
  const pieRef  = useRef(null)
  const lineInst= useRef(null)
  const pieInst = useRef(null)

  const load = () => {
    setLoad(true)
    const p = new URLSearchParams({ days })
    if (exam) p.set('exam', exam)
    api.get('/dashboard/revenue/?' + p)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(DEMO))
      .finally(() => setLoad(false))
  }
  useEffect(load, [days, exam])

  // Daily revenue line chart
  useEffect(() => {
    if (!data?.daily?.length || !lineRef.current) return
    if (typeof window === 'undefined' || !window.Chart) return
    if (lineInst.current) { lineInst.current.destroy(); lineInst.current = null }
    lineInst.current = new window.Chart(lineRef.current, {
      type: 'line',
      data: {
        labels: data.daily.map(d => d.date),
        datasets: [{
          label: 'Revenue (₹)',
          data:  data.daily.map(d => d.revenue),
          borderColor: C.red, backgroundColor: 'rgba(255,94,95,0.08)',
          tension: 0.3, fill: true, pointRadius: 3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, maxTicksLimit: 8 } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v) } },
        },
      },
    })
  }, [data])

  // Plan breakdown pie chart
  useEffect(() => {
    if (!data?.by_plan?.length || !pieRef.current) return
    if (typeof window === 'undefined' || !window.Chart) return
    if (pieInst.current) { pieInst.current.destroy(); pieInst.current = null }
    const COLORS = [C.red,'#f59e0b','#3b82f6','#22c55e','#7b2d8b','#06b6d4']
    pieInst.current = new window.Chart(pieRef.current, {
      type: 'doughnut',
      data: {
        labels: data.by_plan.map(p => p.plan),
        datasets: [{
          data: data.by_plan.map(p => p.revenue),
          backgroundColor: data.by_plan.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 2, borderColor: C.white,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
        cutout: '65%',
      },
    })
  }, [data])

  const csvOrders = () => {
    if (!data?.orders) return
    const rows = [
      ['Date','Student','Plan','Amount','Status'],
      ...data.orders.map(o => [o.created_at?.slice(0,10), o.email, o.plan_name, o.amount, o.status]),
    ]
    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(rows.map(r => r.join(',')).join('
'))
    a.download = `orders-${days}d.csv`
    a.click()
  }

  const fmt = v => '₹' + (v >= 100000 ? (v/100000).toFixed(1)+'L' : v >= 1000 ? (v/1000).toFixed(1)+'k' : v)

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Revenue — Admin — GRADSKOOL</title></Head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" async />

      <div style={{ height:'56px', background:C.white, borderBottom:'1px solid '+C.border, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, textDecoration:'none' }}>← Admin</Link>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>Revenue</span>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <select value={exam} onChange={e=>setExam(e.target.value)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', padding:'0.3rem 0.5rem', border:'1px solid '+C.border, borderRadius:'4px', background:C.white, cursor:'pointer' }}>
            {EXAMS.map(e=><option key={e} value={e}>{e?e.toUpperCase():'All exams'}</option>)}
          </select>
          {[7,14,30,90].map(d => (
            <button key={d} onClick={()=>setDays(d)}
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', padding:'0.25rem 0.5rem', border:'1px solid '+(days===d?C.red:C.border), borderRadius:'3px', background:days===d?'#fff5f5':C.white, color:days===d?C.red:C.gray, cursor:'pointer' }}>
              {d}d
            </button>
          ))}
          <button onClick={csvOrders} style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', padding:'0.3rem 0.75rem', border:'1px solid '+C.border, borderRadius:'3px', background:C.white, cursor:'pointer' }}>↓ CSV</button>
        </div>
      </div>

      {loading ? <p style={{ textAlign:'center', fontFamily:'Georgia,serif', color:C.gray, padding:'4rem' }}>Loading…</p> : (
        <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'2rem' }}>
          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
            {[
              ['MRR',            fmt(data?.mrr||0),          C.red],
              ['ARR (est.)',      fmt((data?.mrr||0)*12),     C.blue],
              ['This period',    fmt(data?.period_total||0),  C.green],
              ['Orders',         data?.total_orders||0,       C.amber],
              ['Avg order',      fmt(data?.avg_order||0),     C.gray],
            ].map(([label,val,color]) => (
              <div key={label} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem', textAlign:'center' }}>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.2rem' }}>{val}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
            <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
              <p style={sLabel}>Daily revenue — last {days} days</p>
              <div style={{ position:'relative', height:'200px', marginTop:'0.75rem' }}>
                <canvas ref={lineRef} />
              </div>
            </div>
            <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem' }}>
              <p style={sLabel}>Revenue by plan</p>
              <div style={{ position:'relative', height:'200px', marginTop:'0.75rem' }}>
                <canvas ref={pieRef} />
              </div>
            </div>
          </div>

          {/* Orders table */}
          <div style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid '+C.border, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={sLabel}>Recent orders</p>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray }}>{data?.orders?.length||0} orders</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-sans)', fontSize:'0.78rem', minWidth:'560px' }}>
                <thead>
                  <tr style={{ background:C.muted }}>
                    {['Date','Student','Plan','Amount','Status'].map(h=>(
                      <th key={h} style={{ padding:'0.625rem 1rem', textAlign:'left', fontWeight:'700', color:C.gray, fontSize:'0.62rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.orders||[]).map((o,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid '+C.border }}>
                      <td style={{ padding:'0.625rem 1rem', color:C.gray, fontSize:'0.72rem' }}>{o.created_at?.slice(0,10)}</td>
                      <td style={{ padding:'0.625rem 1rem', color:C.black, fontWeight:'500' }}>{o.email}</td>
                      <td style={{ padding:'0.625rem 1rem', color:C.gray }}>{o.plan_name}</td>
                      <td style={{ padding:'0.625rem 1rem', color:C.black, fontWeight:'700' }}>₹{o.amount?.toLocaleString()}</td>
                      <td style={{ padding:'0.625rem 1rem' }}>
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'3px', background:o.status==='paid'?'#dcfce7':o.status==='refunded'?'#fee2e2':'#fef3c7', color:o.status==='paid'?'#166534':o.status==='refunded'?C.red:'#92400e' }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const sLabel = { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#999' }

const DEMO = {
  mrr:148000, period_total:89400, total_orders:18, avg_order:4967,
  daily:[
    {date:'May 1',revenue:0},{date:'May 3',revenue:14999},{date:'May 5',revenue:9999},
    {date:'May 8',revenue:24998},{date:'May 11',revenue:4999},{date:'May 14',revenue:14999},
    {date:'May 17',revenue:0},{date:'May 19',revenue:4999},{date:'May 21',revenue:9999},{date:'May 24',revenue:4999},
  ],
  by_plan:[
    {plan:'CAT Live Batch',revenue:89940},{plan:'CAT Recorded',revenue:44970},
    {plan:'XAT Bundle',revenue:19990},{plan:'SNAP Pack',revenue:9980},
  ],
  orders:[
    {created_at:'2026-05-24',email:'kavya@gmail.com',plan_name:'CAT Live Batch',amount:14999,status:'paid'},
    {created_at:'2026-05-21',email:'rahul@gmail.com',plan_name:'CAT Recorded',amount:9999,status:'paid'},
    {created_at:'2026-05-19',email:'priya@gmail.com',plan_name:'XAT Bundle',amount:4999,status:'paid'},
    {created_at:'2026-05-17',email:'amit@gmail.com', plan_name:'CAT Live Batch',amount:14999,status:'refunded'},
    {created_at:'2026-05-14',email:'neha@gmail.com', plan_name:'CAT Recorded', amount:9999,status:'paid'},
  ],
}

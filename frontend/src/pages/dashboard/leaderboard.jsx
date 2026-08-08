/**
 * GRADSKOOL — Cohort Leaderboard
 * Route: /dashboard/leaderboard
 *
 * Anonymous leaderboard within your cohort.
 * Shows topics done, quiz scores, streak days.
 * Your own row is highlighted.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff',
  bg:'#f7f6f3', border:'#e8e8e6', gray50:'#fafaf9',
  gray400:'#999', gray500:'#666',
  green:'#22c55e', amber:'#f59e0b', blue:'#3b82f6',
  gold:'#f59e0b', silver:'#94a3b8', bronze:'#b45309',
}

const RANK_COLORS = { 1:C.gold, 2:C.silver, 3:C.bronze }
const RANK_LABELS = { 1:'🥇', 2:'🥈', 3:'🥉' }

export default function LeaderboardPage() {
  return <ProtectedRoute><Inner /></ProtectedRoute>
}

function Inner() {
  const { user } = useAuth()
  const [data,    setData]  = useState(null)
  const [loading, setLoad]  = useState(true)
  const [period,  setPeriod]= useState('week') // week | month | all

  useEffect(() => {
    setLoad(true)
    api.get(`/dashboard/leaderboard/?period=${period}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(DEMO_DATA(user?.first_name)))
      .finally(() => setLoad(false))
  }, [period])

  const board  = data?.leaderboard || []
  const myRank = data?.my_rank
  const myRow  = board.find(r => r.is_me)
  const topRow = board[0]

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Cohort Leaderboard — GRADSKOOL</title></Head>

      <div style={s.topbar}>
        <Link href="/" style={s.logo}><span style={{ color:C.red }}>GRAD</span>SKOOL</Link>
        <Link href="/dashboard?tab=gamification" style={s.navLink}>← Dashboard</Link>
      </div>

      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem' }}>

        {/* Header */}
        <div style={{ marginBottom:'2rem', textAlign:'center' }}>
          <p style={s.eyebrow}>Your Cohort</p>
          <h1 style={s.title}>Leaderboard</h1>
          <p style={s.sub}>Anonymous within your cohort. Only first names shown. Push each other forward.</p>
        </div>

        {/* Period tabs */}
        <div style={{ display:'flex', justifyContent:'center', gap:'0.375rem', marginBottom:'2rem' }}>
          {[['week','This Week'],['month','This Month'],['all','All Time']].map(([id,label]) => (
            <button key={id} onClick={() => setPeriod(id)}
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', padding:'0.5rem 1.25rem', border:`1px solid ${C.border}`, borderRadius:'100px', cursor:'pointer',
                background: period===id ? C.black : C.white, color: period===id ? '#fff' : C.gray500, fontWeight: period===id ? '700' : '400' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:C.gray400, fontFamily:'Georgia,serif' }}>Loading leaderboard…</div>
        ) : (
          <>
            {/* My rank card */}
            {myRow && (
              <div style={{ background:C.black, borderRadius:'8px', padding:'1.25rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:C.red, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#fff' }}>#{myRank}</span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:'0.25rem' }}>Your Position</p>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:'#fff', marginBottom:'0.15rem' }}>
                    {myRow.name} (You) — Rank #{myRank} of {board.length}
                  </p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'rgba(255,255,255,0.5)' }}>
                    {myRow.topics_done} topics · {myRow.streak}🔥 streak · {myRow.avg_score ? `${Math.round(myRow.avg_score)}% avg quiz` : 'No quiz attempts yet'}
                  </p>
                </div>
                {myRank <= 3 && <span style={{ fontSize:'2rem' }}>{RANK_LABELS[myRank]}</span>}
              </div>
            )}

            {/* Top 3 podium */}
            {board.length >= 3 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
                {[board[1], board[0], board[2]].map((row, i) => {
                  const rank = i === 0 ? 2 : i === 1 ? 1 : 3
                  const height = rank === 1 ? '110px' : rank === 2 ? '90px' : '70px'
                  if (!row) return <div key={i} />
                  return (
                    <div key={row.id} style={{ textAlign:'center' }}>
                      <div style={{ marginBottom:'0.5rem' }}>
                        <div style={{ width:'52px', height:'52px', borderRadius:'50%', background: RANK_COLORS[rank] + '22', border:`2px solid ${RANK_COLORS[rank]}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.375rem' }}>
                          <span style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', color:RANK_COLORS[rank] }}>
                            {row.is_me ? '🙋' : row.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'700', color:C.black }}>
                          {row.name}{row.is_me ? ' (You)' : ''}
                        </p>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray400 }}>{row.topics_done} topics</p>
                      </div>
                      <div style={{ height, background: RANK_COLORS[rank] + '18', border:`1px solid ${RANK_COLORS[rank]}30`, borderRadius:'6px 6px 0 0', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'0.5rem' }}>
                        <span style={{ fontSize:'1.5rem' }}>{RANK_LABELS[rank]}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Full leaderboard */}
            <div style={{ border:`1px solid ${C.border}`, borderRadius:'8px', overflow:'hidden', background:C.white }}>
              {/* Header */}
              <div style={{ display:'grid', gridTemplateColumns:'48px 1fr 80px 80px 80px 60px', gap:'0.5rem', padding:'0.625rem 1.25rem', background:C.gray50, borderBottom:`1px solid ${C.border}` }}>
                {['#','Student','Topics','Streak','Quiz Avg','XP'].map(h => (
                  <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:C.gray400 }}>{h}</span>
                ))}
              </div>

              {board.map((row, idx) => {
                const rank = idx + 1
                const isMe = row.is_me
                return (
                  <div key={row.id}
                    style={{
                      display:'grid', gridTemplateColumns:'48px 1fr 80px 80px 80px 60px', gap:'0.5rem',
                      padding:'0.875rem 1.25rem', alignItems:'center',
                      borderBottom: idx < board.length-1 ? `1px solid ${C.border}` : 'none',
                      background: isMe ? '#fff5f5' : C.white,
                      transition:'background 0.15s',
                    }}>
                    {/* Rank */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {rank <= 3
                        ? <span style={{ fontSize:'1.25rem' }}>{RANK_LABELS[rank]}</span>
                        : <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color: isMe ? C.red : C.gray400 }}>#{rank}</span>
                      }
                    </div>

                    {/* Name */}
                    <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background: isMe ? C.red : C.border, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontFamily:'Georgia,serif', fontSize:'0.85rem', fontWeight:'700', color: isMe ? '#fff' : C.gray500 }}>
                          {row.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight: isMe ? '700' : '500', color:C.black }}>
                          {row.name}{isMe ? ' (You)' : ''}
                        </p>
                        {row.badge && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:C.amber }}>{row.badge}</p>}
                      </div>
                    </div>

                    {/* Topics */}
                    <div>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.green }}>{row.topics_done}</p>
                      <div style={{ height:'3px', background:C.border, borderRadius:'2px', marginTop:'0.2rem' }}>
                        <div style={{ height:'100%', background:C.green, borderRadius:'2px', width:`${(row.topics_done/Math.max(...board.map(r=>r.topics_done),1))*100}%` }} />
                      </div>
                    </div>

                    {/* Streak */}
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.amber }}>
                      {row.streak > 0 ? `${row.streak}🔥` : '—'}
                    </p>

                    {/* Quiz avg */}
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color: row.avg_score >= 70 ? C.green : row.avg_score > 0 ? C.amber : C.gray400 }}>
                      {row.avg_score ? `${Math.round(row.avg_score)}%` : '—'}
                    </p>

                    {/* XP */}
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color: isMe ? C.red : C.gray400 }}>
                      {row.xp ? `${row.xp}⚡` : '—'}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Disclaimer */}
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:C.gray400, textAlign:'center', marginTop:'1rem', lineHeight:1.6 }}>
              Names are first-name only. Only students in your cohort can see this board.
              Rankings update every hour.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// Demo data generator
const DEMO_DATA = (myName) => ({
  my_rank: 4,
  leaderboard: [
    { id:1, name:'Arjun',   is_me:false, topics_done:18, streak:7,  avg_score:82, xp:1820, badge:'🏆 Top Scorer' },
    { id:2, name:'Priya',   is_me:false, topics_done:16, streak:5,  avg_score:79, xp:1650 },
    { id:3, name:'Rohan',   is_me:false, topics_done:14, streak:12, avg_score:71, xp:1480, badge:'🔥 Max Streak' },
    { id:4, name:myName||'You', is_me:true,  topics_done:12, streak:4,  avg_score:74, xp:1240 },
    { id:5, name:'Sneha',   is_me:false, topics_done:10, streak:3,  avg_score:68, xp:1050 },
    { id:6, name:'Vikram',  is_me:false, topics_done:9,  streak:2,  avg_score:77, xp:950 },
    { id:7, name:'Ananya',  is_me:false, topics_done:8,  streak:0,  avg_score:65, xp:820 },
    { id:8, name:'Karan',   is_me:false, topics_done:6,  streak:1,  avg_score:70, xp:630 },
    { id:9, name:'Divya',   is_me:false, topics_done:5,  streak:0,  avg_score:0,  xp:500 },
    { id:10, name:'Mihir',  is_me:false, topics_done:3,  streak:0,  avg_score:55, xp:310 },
  ]
})

const s = {
  topbar:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', height:'56px', background:C.white, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:100 },
  logo:    { fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'700', textDecoration:'none', color:C.black },
  navLink: { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray400, textDecoration:'none' },
  eyebrow: { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:C.red, marginBottom:'0.375rem' },
  title:   { fontFamily:'Georgia,serif', fontSize:'2rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' },
  sub:     { fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.gray400, lineHeight:1.7 },
}

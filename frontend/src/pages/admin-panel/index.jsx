/**
 * GRADSKOOL — Admin Panel Home
 * Route: /admin-panel
 * Full overview dashboard + navigation to all 41 admin pages
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3',
  border:'#e8e8e6', gray:'#999', green:'#22c55e', amber:'#f59e0b',
  blue:'#3b82f6', purple:'#7b2d8b', muted:'#f4f3f0', dark:'#1a1a1a',
}

// ─── Navigation groups — every admin page organised ───────────────────────
const NAV = [
  {
    group: 'Content',
    icon: '📚',
    color: C.blue,
    pages: [
      { href:'/admin-panel/courses',       icon:'🎓', label:'All Courses',          sub:'Course cards + status' },
      { href:'/admin-panel/curriculum',    icon:'🗺', label:'Curriculum Manager',   sub:'Sections, topics, order' },
      { href:'/admin-panel/video-library', icon:'🎬', label:'Video Library',        sub:'Reusable videos across courses' },
      { href:'/admin-panel/question-bank', icon:'🗂', label:'Question Bank',        sub:'Create, edit, bulk-tag questions' },
      { href:'/admin-panel/foundations',   icon:'🆓', label:'Foundations',          sub:'Free classes — XAT starters + complete NMAT/SNAP' },
      { href:'/admin-panel/foundation-sections', icon:'🗂️', label:'Foundation Sections', sub:'Topic tags classes can be filed under, e.g. "Decision Making"' },
      { href:'/admin-panel/fyq',           icon:'❓', label:'FYQs',                 sub:'CAT Future Year Questions — question bank with video solutions' },
      { href:'/admin-panel/fyq-categories', icon:'🗂️', label:'FYQ Categories',      sub:'Manage the Section → Category → Topic browse tree' },
      { href:'/admin-panel/pdfs',          icon:'📕', label:'PDF Library',          sub:'Cheat sheets, question banks, free + paid' },
      { href:'/admin-panel/blog-manage',   icon:'✍️', label:'Blog Posts',           sub:'Write and publish articles' },
      { href:'/admin-panel/blog',          icon:'📰', label:'Blog Overview',        sub:'Blog list + management' },
      { href:'/admin-panel/pages',         icon:'📄', label:'Pages',                sub:'Dynamic CMS pages' },
      { href:'/admin-panel/faqs-manage',   icon:'❓', label:'FAQs',                 sub:'FAQ per exam' },
      { href:'/admin-panel/testimonials',  icon:'⭐', label:'Testimonials',         sub:'Student quotes' },
      { href:'/admin-panel/results-wall',  icon:'🏆', label:'Results Wall',         sub:'Success stories' },
      { href:'/admin-panel/homepage',      icon:'🏠', label:'Homepage Content',     sub:'Hero, banners, sections' },
    ],
  },
  {
    group: 'Students',
    icon: '👥',
    color: C.green,
    pages: [
      { href:'/admin-panel/students',          icon:'👤', label:'All Students',         sub:'Search, filter, view profiles' },
      { href:'/admin-panel/enrollments',       icon:'📋', label:'Enrollments',          sub:'Active + expired enrollments' },
      { href:'/admin-panel/bulk-enroll',       icon:'📥', label:'Bulk Enroll',          sub:'Paste emails, enroll instantly' },
      { href:'/admin-panel/enroll',            icon:'➕', label:'Manual Enroll',        sub:'Enroll one student manually' },
      { href:'/admin-panel/cohorts',           icon:'🏫', label:'Cohorts',              sub:'Cohort overview + manage' },
      { href:'/admin-panel/cohorts-manage',    icon:'⚙️', label:'Cohort Settings',      sub:'Create, configure cohorts' },
      { href:'/admin-panel/batch-health',      icon:'💊', label:'Batch Health',         sub:'At-risk, inactive, engaged' },
      { href:'/admin-panel/mock-credentials',  icon:'🔑', label:'Mock Credentials',     sub:'Testfunda login per student' },
      { href:'/admin-panel/mock-schedule',     icon:'📅', label:'Mock Schedule',        sub:'Schedule + reminder system' },
    ],
  },
  {
    group: 'Analytics',
    icon: '📊',
    color: C.red,
    pages: [
      { href:'/admin-panel/analytics',          icon:'📈', label:'Overview Analytics',   sub:'Signups, enrollments, funnel' },
      { href:'/admin-panel/quiz-analytics',     icon:'🧠', label:'Quiz Analytics',       sub:'Pass rates, hardest questions' },
      { href:'/admin-panel/content-performance',icon:'📹', label:'Content Performance',  sub:'Views, watch%, quiz per video' },
      { href:'/admin-panel/dropoff',            icon:'📉', label:'Drop-off Heatmap',     sub:'Where students quit videos' },
      { href:'/admin-panel/revenue',            icon:'💰', label:'Revenue',              sub:'MRR, ARR, daily chart, orders' },
      { href:'/admin-panel/orders',             icon:'🧾', label:'Orders',               sub:'All payment orders' },
      { href:'/admin-panel/leads',              icon:'🎯', label:'Leads',                sub:'Free tool lead capture' },
    ],
  },
  {
    group: 'Teaching',
    icon: '🎙',
    color: C.purple,
    pages: [
      { href:'/admin-panel/live-sessions',  icon:'📡', label:'Live Sessions',        sub:'Schedule, Zoom, recordings' },
      { href:'/admin-panel/programmes',     icon:'🗓', label:'Programmes',           sub:'Learning programmes + plans' },
      { href:'/admin-panel/tools',          icon:'🔧', label:'Free Tools',           sub:'Tool overview list' },
      { href:'/admin-panel/tools-manage',   icon:'⚙️', label:'Manage Tools',         sub:'Edit tools + questions' },
      { href:'/admin-panel/announcement',   icon:'📢', label:'Announcement',         sub:'Site-wide banner message' },
      { href:'/admin-panel/notifications',  icon:'🔔', label:'Notifications',        sub:'Templates + send history' },
    ],
  },
  {
    group: 'Settings',
    icon: '⚙️',
    color: C.gray,
    pages: [
      { href:'/admin-panel/exams',         icon:'📝', label:'Exams',                sub:'Exam config, slugs, dates' },
      { href:'/admin-panel/coupons',       icon:'🎟', label:'Coupons',             sub:'Discount codes' },
      { href:'/admin-panel/site-settings', icon:'🌐', label:'Site Settings',       sub:'Name, logo, SEO, contact' },
    ],
  },
]

export default function AdminIndex() {
  const [overview, setOverview] = useState(null)
  const [loading,  setLoad]     = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    api.get('/dashboard/overview/')
      .then(({ data }) => setOverview(data))
      .catch(() => setOverview(DEMO))
      .finally(() => setLoad(false))
  }, [])

  const d = overview

  // Search across all pages
  const allPages = NAV.flatMap(g => g.pages.map(p => ({ ...p, group: g.group })))
  const searchResults = search.length >= 2
    ? allPages.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.sub.toLowerCase().includes(search.toLowerCase()) ||
        p.group.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const fmt = (v, isCurrency = false) => {
    if (v == null) return '—'
    if (isCurrency) {
      if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L'
      if (v >= 1000)   return '₹' + (v / 1000).toFixed(1) + 'k'
      return '₹' + v
    }
    if (v >= 1000) return (
    <AdminLayout title="Overview">v / 1000</AdminLayout>
  ).toFixed(1) + 'k'
    return String(v)
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Admin Panel — GRADSKOOL</title></Head>

      {/* Top bar */}
      <div style={{ background:C.black, padding:'0 1.5rem', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:'#fff' }}>GRADSKOOL</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'3px', background:'rgba(255,94,95,0.2)', color:C.red }}>ADMIN</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/" style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'rgba(255,255,255,0.3)', textDecoration:'none' }}>← Website</Link>
          <Link href="/dashboard" style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'rgba(255,255,255,0.3)', textDecoration:'none' }}>Student dashboard</Link>
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'2rem' }}>

        {/* Overview KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {[
            ['Total revenue',    fmt(d?.revenue?.total, true),   C.red],
            ['This month',       fmt(d?.revenue?.month, true),   C.green],
            ['Active students',  fmt(d?.users?.enrolled),        C.blue],
            ['New this week',    fmt(d?.users?.new_week),        C.amber],
            ['Total users',      fmt(d?.users?.total),           C.gray],
            ['Conversion rate',  d?.leads?.conversion_rate != null ? d.leads.conversion_rate + '%' : '—', C.purple],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1.25rem', textAlign:'center' }}>
              {loading
                ? <div style={{ height:'32px', background:C.muted, borderRadius:'4px', marginBottom:'0.375rem' }} />
                : <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.25rem' }}>{val}</p>
              }
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:C.gray }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom:'2rem', position:'relative' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search all admin pages… (e.g. quiz, students, revenue)"
            style={{ width:'100%', padding:'0.75rem 1rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid '+C.border, borderRadius:'6px', outline:'none', background:C.white, boxSizing:'border-box' }}
          />
          {searchResults.length > 0 && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, background:C.white, border:'1px solid '+C.border, borderRadius:'6px', marginTop:'4px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:100, maxHeight:'320px', overflowY:'auto' }}>
              {searchResults.map(p => (
                <Link key={p.href} href={p.href} onClick={() => setSearch('')}
                  style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem 1rem', textDecoration:'none', borderBottom:'1px solid '+C.border }}>
                  <span style={{ fontSize:'1.25rem', flexShrink:0 }}>{p.icon}</span>
                  <div>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black }}>{p.label}</p>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{p.group} · {p.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {search.length >= 2 && searchResults.length === 0 && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, background:C.white, border:'1px solid '+C.border, borderRadius:'6px', marginTop:'4px', padding:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray }}>
              No pages found for "{search}"
            </div>
          )}
        </div>

        {/* Navigation groups */}
        {NAV.map(group => (
          <div key={group.group} style={{ marginBottom:'2.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'1rem' }}>
              <span style={{ fontSize:'1rem' }}>{group.icon}</span>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:C.gray }}>{group.group}</p>
              <div style={{ flex:1, height:'1px', background:C.border, marginLeft:'0.5rem' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'0.75rem' }}>
              {group.pages.map(page => (
                <Link key={page.href} href={page.href}
                  style={{ display:'flex', alignItems:'flex-start', gap:'0.875rem', background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'1rem', textDecoration:'none', transition:'border-color .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = group.color; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}>
                  <span style={{ fontSize:'1.25rem', flexShrink:0, marginTop:'1px' }}>{page.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black, marginBottom:'0.2rem' }}>{page.label}</p>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray, lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{page.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Quick actions row */}
        <div style={{ background:C.dark, borderRadius:'8px', padding:'1.5rem', marginTop:'1rem' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.3)', marginBottom:'1rem' }}>Quick actions</p>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            {[
              ['+ New Course',        '/admin-panel/courses'],
              ['+ Live Session',      '/admin-panel/live-sessions'],
              ['+ Bulk Enroll',       '/admin-panel/bulk-enroll'],
              ['+ Question',          '/admin-panel/question-bank'],
              ['📊 Quiz Analytics',   '/admin-panel/quiz-analytics'],
              ['💊 Batch Health',     '/admin-panel/batch-health'],
              ['📢 Announcement',     '/admin-panel/announcement'],
            ].map(([label, href]) => (
              <Link key={href} href={href}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', padding:'0.5rem 1rem', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'4px', color:'rgba(255,255,255,0.7)', textDecoration:'none' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const DEMO = {
  revenue: { total:892000, month:148000, week:34500, daily_trend:[] },
  users:   { total:312, verified:287, new_week:14, enrolled:89 },
  leads:   { total:847, converted:89, conversion_rate:11 },
}

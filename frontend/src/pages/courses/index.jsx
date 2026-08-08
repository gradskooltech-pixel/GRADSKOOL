/**
 * GRADSKOOL — Courses Index
 * Route: /courses
 */
import Head from 'next/head'
import { useRouter } from 'next/router'
import { IS_SUBDOMAIN, EXAM_SLUG } from '../../lib/subdomain'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const COURSES = [
  { slug:'cat',       short:'CAT',              cat:'mba_india',  tag:'MBA India · Flagship',         tagline:"IIMs, FMS, SPJIMR and 1,200+ colleges.",                          desc:"30 full-length mocks. 400+ hours of live teaching. Complete VARC, DILR and QA coverage in a cohort of 27.",                                            price:'₹17,999', s1:'30',   s1l:'Full-Length Mocks',    s2:'400+', s2l:'Hours Live Teaching' },
  { slug:'xat',       short:'XAT',              cat:'mba_india',  tag:'MBA India · XLRI',             tagline:"Decision Making. The section every student fears.",                desc:"XLRI Jamshedpur, XIMB, GIM and 150+ institutes. Dedicated Decision Making module — the section no CAT coaching covers.",                               price:'₹2,999',  s1:'6',    s1l:'Full-Length Mocks',    s2:'12',   s2l:'Sectional Tests' },
  { slug:'snap',      short:'SNAP',             cat:'mba_india',  tag:'MBA India · Symbiosis',        tagline:"60 questions. 60 minutes. No sectional time limit.",               desc:"SIBM Pune, SCMHRD, SIIB and all 17 Symbiosis institutes. 3 attempts per year.",                                                                        price:'₹2,999',  s1:'20',   s1l:'Full-Length Mocks',    s2:'3',    s2l:'Attempts Per Year' },
  { slug:'nmat',      short:'NMAT',             cat:'mba_india',  tag:'MBA India · NMIMS',            tagline:"3 attempts. No negative marking. Section order choice.",           desc:"NMIMS Mumbai, Hyderabad, Bangalore. No negative marking changes strategy completely.",                                                                    price:'₹3,999',  s1:'10',   s1l:'Full-Length Mocks',    s2:'0',    s2l:'Negative Marking' },
  { slug:'cmat',      short:'CMAT',             cat:'mba_india',  tag:'MBA India · JBIMS',            tagline:"India's best value MBA. ₹5L fees, ₹30L+ placements.",             desc:"JBIMS, SIMSREE, PUMBA and 1,000+ AICTE institutes. Includes Innovation & Entrepreneurship — unique to CMAT.",                                         price:'₹2,999',  s1:'12',   s1l:'Full-Length Mocks',    s2:'15',   s2l:'Sectional Tests' },
  { slug:'mhcet',     short:'MH CET MBA',       cat:'mba_india',  tag:'MBA Maharashtra',              tagline:"200 questions. 150 minutes. No negative marking.",                 desc:"Fastest route to JBIMS, SIMSREE and KJ Somaiya. Two attempts per year. Maharashtra domicile advantage.",                                             price:'₹7,999',  s1:'200',  s1l:'Questions',            s2:'2',    s2l:'Attempts Per Year' },
  { slug:'ipmat',     short:'IPMAT',            cat:'ug',         tag:'UG Management · IIM',          tagline:"The only direct route to an IIM without CAT.",                     desc:"89 full-length mocks across 12 programmes — IIM Indore, Rohtak, JIPMAT, NPAT, SET, Xaviers, Christ and more.",                                        price:'₹2,499',  s1:'89',   s1l:'Full-Length Mocks',    s2:'12',   s2l:'Programmes Covered' },
  { slug:'clat',      short:'CLAT / AILET / LNAT', cat:'ug',      tag:'Law Entrance · NLUs + UK',     tagline:"24 NLUs. NLU Delhi. Oxford and UCL.",                              desc:"10 CLAT + 5 AILET + 3 LNAT mocks. 21 printed books. All three exams prepared simultaneously.",                                                         price:'₹1,999',  s1:'18',   s1l:'Full-Length Tests',    s2:'21',   s2l:'Printed Books' },
  { slug:'cuet',      short:'CUET UG',          cat:'ug',         tag:'University UG · DU · BHU · JNU',tagline:"Replaced boards. Now the only thing that matters for DU.",        desc:"Delhi University, BHU, JNU and 250+ central universities. 40 online mocks across all sections.",                                                       price:'₹999',    s1:'40',   s1l:'Online Mocks',         s2:'250+', s2l:'Universities Accept' },
  { slug:'pi-wat-gd', short:'PI WAT GD',        cat:'interview',  tag:'Interview Prep · All B-Schools',tagline:"Convert your call. The room is a different exam.",                desc:"Mock PIs, GD simulation, WAT essays and AWT for IIM-A. 10+ B-school formats covered.",                                                               price:'₹5,999',  s1:'10+',  s1l:'B-School Formats',     s2:'5K+',  s2l:'IIM Converts' },
]

const FILTERS = [
  { key:'all',       label:'All Programmes' },
  { key:'mba_india', label:'MBA India' },
  { key:'ug',        label:'Undergraduate' },
  { key:'interview', label:'Interview Prep' },
]

const ACCENT = { mba_india:'#ff5e5f', ug:'#10b981', interview:'#8b5cf6' }

export default function CoursesPage() {
  const router = useRouter()
  const [active, setActive] = useState('all')

  // On subdomain — redirect to the exam's course page
  useEffect(() => {
    if (IS_SUBDOMAIN && EXAM_SLUG) {
      router.replace(`/courses/${EXAM_SLUG}`)
    }
  }, [])

  if (IS_SUBDOMAIN) return null
  const list = active === 'all' ? COURSES : COURSES.filter(c => c.cat === active)

  return (
    <>
      <Head>
        <title>Courses — CAT, XAT, SNAP, NMAT, IPMAT, CLAT and more — GRADSKOOL</title>
        <meta name="description" content="Live two-way MBA and UG entrance preparation. CAT, XAT, SNAP, NMAT, CMAT, MH CET, IPMAT, CLAT, CUET and PI WAT GD. 27 students per cohort." />
      </Head>

      {/* Hero */}
      <div style={{ padding:'4.5rem 2rem 3.5rem', background:'#fff', borderBottom:'1px solid #e8e8e6' }}>
        <div style={{ maxWidth:'860px', margin:'0 auto' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.875rem' }}>
            All Programmes
          </p>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2.2rem,4vw,3.2rem)', fontWeight:'700', color:'#0f0f0f', lineHeight:'1.15', marginBottom:'1rem' }}>
            Every MBA entrance exam.<br />
            <em style={{ fontStyle:'italic', color:'var(--red)' }}>Structured preparation.</em>
          </h1>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', color:'#777', lineHeight:'1.75', maxWidth:'520px' }}>
            13 exams. Live cohorts. Printed books. Free tools. Every programme follows the same 9-stage learning framework.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ borderBottom:'1px solid #e8e8e6', background:'#fff', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', padding:'0 2rem', display:'flex', gap:0 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setActive(f.key)}
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.85rem', fontWeight: active===f.key?'600':'500', color: active===f.key?'#0f0f0f':'#999', background:'none', border:'none', borderBottom: active===f.key?'2px solid var(--red)':'2px solid transparent', padding:'0.875rem 1.25rem', cursor:'pointer', marginBottom:'-1px', transition:'all 0.15s', whiteSpace:'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth:'1160px', margin:'0 auto', padding:'3rem 2rem 5rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem', marginBottom:'4rem' }}>
          {list.map(c => <CourseCard key={c.slug} c={c} />)}
        </div>

        {/* Bottom CTA */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'2rem', padding:'2.5rem 3rem', background:'#0f0f0f', borderRadius:'4px', flexWrap:'wrap' }}>
          <div>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:'700', color:'#fff', marginBottom:'0.375rem' }}>Not sure which exam to target?</p>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:'#888', lineHeight:'1.65', maxWidth:'500px' }}>Tell us your background and target college — ALP Sir will recommend the right exam and programme for you.</p>
          </div>
          <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer"
            style={{ display:'inline-block', background:'var(--red)', color:'#fff', padding:'0.875rem 2rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
            WhatsApp Us →
          </a>
        </div>
      </div>
    </>
  )
}

function CourseCard({ c }) {
  const [hov, setHov] = useState(false)
  const accent = ACCENT[c.cat] || '#ff5e5f'
  return (
    <Link href={`/courses/${c.slug}`}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', flexDirection:'column', border:`1px solid ${hov ? accent : '#e8e8e6'}`, borderTop:`3px solid ${hov ? accent : '#e8e8e6'}`, borderRadius:'3px', background:'#fff', textDecoration:'none', transition:'border-color 0.18s, box-shadow 0.18s', boxShadow: hov?'0 4px 20px rgba(0,0,0,0.07)':'none', overflow:'hidden' }}>
      <div style={{ padding:'1.75rem 1.75rem 1.25rem', flex:1 }}>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color: hov ? accent : '#bbb', marginBottom:'0.75rem', transition:'color 0.18s' }}>
          {c.tag}
        </p>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'1.6rem', fontWeight:'700', color:'#0f0f0f', lineHeight:'1', marginBottom:'0.5rem' }}>
          {c.short}
        </p>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', fontWeight:'600', color:'#333', lineHeight:'1.4', marginBottom:'0.625rem' }}>
          {c.tagline}
        </p>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'0.82rem', color:'#777', lineHeight:'1.65' }}>
          {c.desc}
        </p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderTop:`1px solid ${hov ? '#f0e8e8' : '#f0f0ee'}` }}>
        {[[c.s1,c.s1l],[c.s2,c.s2l]].map(([val,lbl],i) => (
          <div key={i} style={{ padding:'0.875rem 1.75rem', borderRight: i===0 ? `1px solid ${hov?'#f0e8e8':'#f0f0ee'}` : 'none' }}>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.15rem', fontWeight:'700', color: hov ? accent : '#0f0f0f', lineHeight:'1', marginBottom:'0.15rem', transition:'color 0.18s' }}>{val}</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', color:'#bbb', letterSpacing:'0.04em', textTransform:'uppercase' }}>{lbl}</p>
          </div>
        ))}
      </div>
      <div style={{ padding:'0.75rem 1.75rem', borderTop:`1px solid ${hov?'#f0e8e8':'#f0f0ee'}`, background: hov?'#fff8f8':'#fafaf9', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'background 0.18s' }}>
        <span style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'700', color: hov ? accent : '#999', transition:'color 0.18s' }}>
          {c.price} <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'400' }}>+ GST</span>
        </span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color: hov ? accent : '#ccc', transform: hov?'translateX(3px)':'none', transition:'all 0.18s', display:'inline-block' }}>
          View Course →
        </span>
      </div>
    </Link>
  )
}

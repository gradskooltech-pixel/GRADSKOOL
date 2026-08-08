/**
 * GRADSKOOL Admin — Homepage Content
 * Route: /admin-panel/homepage
 *
 * Edit all editable content blocks on the homepage.
 */
import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

const BLOCKS = [
  {
    section: 'Hero',
    items: [
      { key:'hero_title',    label:'Hero Title',    type:'text',     placeholder:"India's Most Structured Exam Prep." },
      { key:'hero_subtitle', label:'Hero Subtitle', type:'textarea', placeholder:'Founded by Abhishek Leela Pandey…' },
    ],
  },
  {
    section: 'Stats Bar',
    hint: 'JSON array: [{"value":"100K+","label":"Students Mentored"},…]',
    items: [
      { key:'platform_stats', label:'Stats Bar Items (JSON)', type:'json',
        placeholder:'[{"value":"100K+","label":"Students Mentored"},{"value":"5K+","label":"IIM Calls"},{"value":"99.93","label":"CAT Percentile"},{"value":"770","label":"GMAT Score"}]' },
    ],
  },
  {
    section: 'Why Section',
    items: [
      { key:'why_title',    label:'Why Title',    type:'text',     placeholder:"Why GRADSKOOL is Different" },
      { key:'why_subtitle', label:'Why Subtitle', type:'textarea', placeholder:'Most coaching is passive…' },
    ],
  },
  {
    section: 'CTA Banner',
    items: [
      { key:'cta_title',    label:'CTA Title',    type:'text',     placeholder:'Ready to Prepare the Right Way?' },
      { key:'cta_subtitle', label:'CTA Subtitle', type:'textarea', placeholder:'Seats in every cohort are limited…' },
    ],
  },
  {
    section: 'Founder Section',
    items: [
      { key:'founder_title', label:'Founder Title', type:'text',     placeholder:'Abhishek Leela Pandey' },
      { key:'founder_body',  label:'Founder Body',  type:'textarea', placeholder:'GRADSKOOL was built on a simple belief…' },
    ],
  },
  {
    section: 'Recognition',
    hint: 'JSON array: [{"pub":"TradeFlock","title":"40 Under 40 — 2024","body":"…","href":"https://…"},…]',
    items: [
      { key:'recognition_items', label:'Recognition Items (JSON)', type:'json',
        placeholder:'[{"pub":"TradeFlock","title":"40 Under 40","body":"…","href":"https://…"}]' },
    ],
  },
]

export default function AdminHomepagePage() {
  const [content, setContent] = useState({})
  const [loading, setLoad]    = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)
  const [preview, setPreview] = useState({})

  useEffect(() => {
    api.get('/dashboard/homepage-content/')
      .then(({ data }) => setContent(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load' }))
      .finally(() => setLoad(false))
  }, [])

  const handleSave = async (key) => {
    setSaving(key)
    try {
      await api.patch('/dashboard/homepage-content/', { key, value: content[key] || '' })
      setMsg({ type:'success', text:`${key} saved ✓` })
    } catch {
      setMsg({ type:'error', text:'Save failed' })
    } finally {
      setSaving(null)
    }
  }

  const handleSaveAll = async () => {
    setSaving('all')
    try {
      await Promise.all(Object.keys(content).map(key =>
        api.patch('/dashboard/homepage-content/', { key, value: content[key] || '' })
      ))
      setMsg({ type:'success', text:'All blocks saved ✓' })
    } catch {
      setMsg({ type:'error', text:'Save failed' })
    } finally {
      setSaving(null)
    }
  }

  const set = (key) => (e) => setContent(c => ({ ...c, [key]: e.target.value }))

  const tryParseJSON = (key) => {
    try { return JSON.parse(content[key] || '[]') } catch { return null }
  }

  return (
    <AdminLayout title="Homepage">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Content</p>
          <h1 style={s.title}>Homepage Content</h1>
          <p style={s.subtitle}>Edit all homepage text blocks. Each block has its own Save button.</p>
        </div>
        <button onClick={handleSaveAll} disabled={!!saving} style={s.saveAllBtn}>
          {saving==='all' ? 'Saving all…' : 'Save All →'}
        </button>
      </div>

      {msg && (
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem 1rem', borderRadius:'4px', marginBottom:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', background:msg.type==='success'?'#f0fdf4':'#fff5f5', border:`1px solid ${msg.type==='success'?'#86efac':'#fca5a5'}`, color:msg.type==='success'?'#166534':'#991b1b' }}>
          {msg.text}<button onClick={() => setMsg(null)} style={{ background:'none',border:'none',cursor:'pointer' }}>✕</button>
        </div>
      )}

      {loading ? <div style={{ padding:'3rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' }}>Loading…</div>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>
            {BLOCKS.map(block => (
              <SectionBox key={block.section}>
                <h2 style={s.blockTitle}>{block.section}</h2>
                {block.hint && (
                  <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'4px', padding:'0.75rem 1rem', marginBottom:'1rem', fontFamily:'monospace', fontSize:'0.75rem', color:'#1d4ed8', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                    {block.hint}
                  </div>
                )}
                {block.items.map(item => (
                  <div key={item.key} style={{ marginBottom:'1.25rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.35rem' }}>
                      <label style={s.label}>{item.label}</label>
                      <button onClick={() => handleSave(item.key)} disabled={saving===item.key}
                        style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'var(--red)', background:'none', border:'1px solid #ffd0d0', padding:'0.2rem 0.6rem', borderRadius:'3px', cursor:'pointer' }}>
                        {saving===item.key ? 'Saving…' : 'Save'}
                      </button>
                    </div>

                    {item.type === 'textarea' || item.type === 'json' ? (
                      <textarea
                        value={content[item.key] || ''}
                        onChange={set(item.key)}
                        style={{ ...s.input, minHeight: item.type==='json'?'120px':'80px', fontFamily: item.type==='json'?'monospace':'var(--font-sans)', fontSize: item.type==='json'?'0.8rem':'0.875rem', resize:'vertical' }}
                        placeholder={item.placeholder}
                      />
                    ) : (
                      <input
                        value={content[item.key] || ''}
                        onChange={set(item.key)}
                        style={s.input}
                        placeholder={item.placeholder}
                      />
                    )}

                    {/* JSON preview */}
                    {item.type === 'json' && content[item.key] && (
                      <div style={{ marginTop:'0.75rem' }}>
                        {(() => {
                          const parsed = tryParseJSON(item.key)
                          if (!parsed) return <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#e53e3e' }}>⚠ Invalid JSON</p>
                          return (
                            <div style={{ background:'var(--gray-50)', border:'1px solid var(--gray-200)', borderRadius:'4px', padding:'0.875rem', display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                              {parsed.map((item, i) => (
                                <div key={i} style={{ background:'var(--white)', border:'1px solid var(--gray-200)', borderRadius:'4px', padding:'0.5rem 0.75rem', minWidth:'120px' }}>
                                  {item.value && <p style={{ fontFamily:'Georgia, serif', fontSize:'1.1rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.1rem' }}>{item.value}</p>}
                                  {item.label && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'var(--gray-400)' }}>{item.label}</p>}
                                  {item.title && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:'var(--black)' }}>{item.title}</p>}
                                  {item.pub   && <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:'var(--red)' }}>{item.pub}</p>}
                                </div>
                              ))}
                              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'var(--gray-400)', alignSelf:'center' }}>✓ Valid JSON — {parsed.length} items</p>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </SectionBox>
            ))}
          </div>
        )
      }
    </AdminLayout>
  )
}

const s = {
  header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' },
  eyebrow:    { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.2rem' },
  title:      { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.25rem' },
  subtitle:   { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  saveAllBtn: { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  blockTitle: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:'var(--black)', marginBottom:'1.25rem', paddingBottom:'0.75rem', borderBottom:'1px solid var(--gray-100)' },
  label:      { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'var(--gray-700)', display:'block' },
  input:      { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
}

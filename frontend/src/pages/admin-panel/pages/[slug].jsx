/**
 * GRADSKOOL Admin — Dynamic Page Editor
 * Route: /admin-panel/pages/[slug]
 *
 * Visual block editor. Add, reorder, edit, delete blocks.
 * Live preview link opens /p/[slug] in new tab.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AdminLayout } from '../../../components/admin/AdminLayout'
import api from '../../../lib/api'

// ── BLOCK DEFINITIONS ─────────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { type:'hero',         icon:'🎯', label:'Hero',          desc:'Big headline + CTA buttons' },
  { type:'text',         icon:'📝', label:'Text',          desc:'Paragraphs + heading' },
  { type:'features',     icon:'⚡', label:'Features',      desc:'2-4 column feature cards' },
  { type:'cta',          icon:'🔔', label:'CTA Banner',    desc:'Call to action with button' },
  { type:'countdown',    icon:'⏱️', label:'Countdown',     desc:'Timer counting to deadline' },
  { type:'faq',          icon:'❓', label:'FAQ',           desc:'Accordion Q&A items' },
  { type:'testimonials', icon:'💬', label:'Testimonials',  desc:'Student quote cards' },
  { type:'image',        icon:'🖼️', label:'Image',         desc:'Full-width or contained image' },
  { type:'video',        icon:'▶️', label:'Video',         desc:'YouTube or Vimeo embed' },
  { type:'table',        icon:'📊', label:'Table',         desc:'Data table with headers' },
  { type:'divider',      icon:'—', label:'Divider',        desc:'Visual separator line' },
]

const BLOCK_DEFAULTS = {
  hero:         { title:'Your Headline Here', title_red:'', subtitle:'Supporting text here.', eyebrow:'', bg:'#0f0f0f', center:false, compact:false, cta_text:'Get Started →', cta_href:'https://wa.me/916360597966', cta2_text:'', cta2_href:'' },
  text:         { title:'', eyebrow:'', body:'Write your content here. **Bold** and *italic* supported.\n\nNew paragraph here.', bg:'#ffffff', wide:false },
  features:     { title:'', subtitle:'', eyebrow:'', bg:'#fafaf9', items:[{ icon:'✓', title:'Feature One', body:'Description of this feature.' },{ icon:'✓', title:'Feature Two', body:'Description of this feature.' },{ icon:'✓', title:'Feature Three', body:'Description of this feature.' }] },
  cta:          { title:'Ready to get started?', subtitle:'', eyebrow:'', bg:'#0f0f0f', cta_text:'WhatsApp Us →', cta_href:'https://wa.me/916360597966', note:'' },
  countdown:    { title:'Offer ends in:', deadline:new Date(Date.now()+7*86400000).toISOString().slice(0,16), cta_text:'Enrol Now →', cta_href:'https://wa.me/916360597966', bg:'#fff8f0', eyebrow:'' },
  faq:          { title:'Common Questions', eyebrow:'FAQ', bg:'#ffffff', items:[{ q:'Question one?', a:'Answer one.' },{ q:'Question two?', a:'Answer two.' }] },
  testimonials: { title:'What Students Say', eyebrow:'', bg:'#fafaf9', items:[{ name:'Student Name', detail:'CAT 2025 · 99%ile', text:'This is a testimonial.' }] },
  image:        { src:'', alt:'', caption:'', full:false, bg:'#ffffff' },
  video:        { url:'', title:'', bg:'#ffffff' },
  table:        { title:'', headers:['Column 1','Column 2','Column 3'], rows:[['Row 1 A','Row 1 B','Row 1 C'],['Row 2 A','Row 2 B','Row 2 C']], bg:'#ffffff' },
  divider:      { thin:false, bg:'#ffffff', color:'#e8e8e6' },
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function PageEditorPage() {
  const router = useRouter()
  const { slug } = router.query

  const [page,      setPage]    = useState(null)
  const [loading,   setLoad]    = useState(true)
  const [saving,    setSaving]  = useState(false)
  const [msg,       setMsg]     = useState(null)
  const [adding,    setAdding]  = useState(false)
  const [editIdx,   setEditIdx] = useState(null)

  useEffect(() => {
    if (!slug) return
    api.get(`/dashboard/pages/${slug}/`)
      .then(({ data }) => setPage(data))
      .catch(() => setMsg({ type:'error', text:'Page not found' }))
      .finally(() => setLoad(false))
  }, [slug])

  const save = async (newPage) => {
    const target = newPage || page
    setSaving(true)
    try {
      await api.patch(`/dashboard/pages/${slug}/`, target)
      setPage(target)
      setMsg({ type:'success', text:'Saved ✓' })
    } catch {
      setMsg({ type:'error', text:'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const addBlock = (type) => {
    const newBlock = { type, ...BLOCK_DEFAULTS[type] }
    const updated = { ...page, blocks: [...(page.blocks||[]), newBlock] }
    setPage(updated)
    setAdding(false)
    setEditIdx(updated.blocks.length - 1)
  }

  const updateBlock = (idx, newBlock) => {
    const blocks = [...page.blocks]
    blocks[idx] = newBlock
    setPage({ ...page, blocks })
  }

  const deleteBlock = (idx) => {
    if (!confirm('Delete this block?')) return
    const blocks = page.blocks.filter((_, i) => i !== idx)
    setPage({ ...page, blocks })
    if (editIdx === idx) setEditIdx(null)
  }

  const moveBlock = (idx, dir) => {
    const blocks = [...page.blocks]
    const swap = idx + dir
    if (swap < 0 || swap >= blocks.length) return
    ;[blocks[idx], blocks[swap]] = [blocks[swap], blocks[idx]]
    setPage({ ...page, blocks })
    setEditIdx(swap)
  }

  if (loading) return (
    <AdminLayout title="Page Editor">
      <div style={{ padding:'3rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'#999' }}>Loading…</div>
    </AdminLayout>
  )

  if (!page) return (
    <AdminLayout title="Page Editor">
      <div style={{ padding:'3rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'#e53e3e' }}>Page not found.</div>
    </AdminLayout>
  )

  return (
    <AdminLayout title="Page Editor">
      {/* Header */}
      <div style={s.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button onClick={() => router.push('/admin-panel/pages')} style={s.backBtn}>← All Pages</button>
          <div>
            <input value={page.title} onChange={e => setPage({ ...page, title:e.target.value })}
              style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', border:'none', outline:'none', background:'transparent', color:'#0f0f0f', padding:0 }} />
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'#999', marginTop:'0.1rem' }}>
              /p/{page.slug} ·{' '}
              <button onClick={() => setPage({ ...page, is_active:!page.is_active })}
                style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:'0.75rem', color: page.is_active?'#166534':'#991b1b', fontWeight:'700' }}>
                {page.is_active ? '● Live' : '○ Inactive'}
              </button>
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <a href={`/p/${slug}`} target="_blank" rel="noreferrer" style={s.previewBtn}>Preview ↗</a>
          <button onClick={() => save()} disabled={saving} style={s.saveBtn}>
            {saving ? 'Saving…' : 'Save →'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.625rem 1rem', borderRadius:'4px', marginBottom:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='success'?'#f0fdf4':'#fff5f5', border:`1px solid ${msg.type==='success'?'#86efac':'#fca5a5'}`, color:msg.type==='success'?'#166534':'#991b1b' }}>
          {msg.text}<button onClick={() => setMsg(null)} style={{ background:'none',border:'none',cursor:'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'1.5rem', alignItems:'start' }}>

        {/* Block list */}
        <div>
          {page.blocks?.length === 0 && (
            <div style={{ padding:'4rem 2rem', textAlign:'center', border:'2px dashed #e8e8e6', borderRadius:'4px', marginBottom:'1rem' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'#999', marginBottom:'0.5rem' }}>No blocks yet</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#bbb' }}>Add your first block below to start building the page.</p>
            </div>
          )}

          {(page.blocks||[]).map((block, idx) => (
            <div key={idx} style={{ marginBottom:'0.5rem', border:`2px solid ${editIdx===idx?'#ff5e5f':'#e8e8e6'}`, borderRadius:'4px', overflow:'hidden', transition:'border-color 0.15s' }}>
              {/* Block header */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', background: editIdx===idx?'#fff0f0':'#fafaf9', cursor:'pointer' }}
                onClick={() => setEditIdx(editIdx===idx?null:idx)}>
                <span style={{ fontSize:'1rem' }}>{BLOCK_TYPES.find(t=>t.type===block.type)?.icon || '□'}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:'#0f0f0f' }}>
                    {BLOCK_TYPES.find(t=>t.type===block.type)?.label || block.type}
                  </span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#999', marginLeft:'0.5rem' }}>
                    {block.title || block.body?.slice(0,40) || ''}
                  </span>
                </div>
                <div style={{ display:'flex', gap:'0.25rem' }} onClick={e => e.stopPropagation()}>
                  <Btn onClick={() => moveBlock(idx,-1)} disabled={idx===0}>↑</Btn>
                  <Btn onClick={() => moveBlock(idx,1)} disabled={idx===page.blocks.length-1}>↓</Btn>
                  <Btn onClick={() => deleteBlock(idx)} danger>✕</Btn>
                </div>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color: editIdx===idx?'#ff5e5f':'#bbb' }}>
                  {editIdx===idx ? 'Close ▲' : 'Edit ▼'}
                </span>
              </div>

              {/* Block editor */}
              {editIdx === idx && (
                <div style={{ padding:'1.25rem', borderTop:'1px solid #f0f0ee', background:'#fff' }}>
                  <BlockEditor block={block} onChange={b => updateBlock(idx, b)} />
                </div>
              )}
            </div>
          ))}

          {/* Add block button */}
          <button onClick={() => setAdding(true)} style={{ width:'100%', padding:'0.875rem', border:'2px dashed #e8e8e6', borderRadius:'4px', background:'none', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:'#999', cursor:'pointer', marginTop:'0.5rem', transition:'all 0.15s' }}>
            + Add Block
          </button>
        </div>

        {/* Right sidebar */}
        <div style={{ position:'sticky', top:'80px' }}>
          {/* Page SEO */}
          <div style={{ border:'1px solid #e8e8e6', borderRadius:'4px', padding:'1.25rem', marginBottom:'1rem', background:'#fff' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'1rem', paddingBottom:'0.625rem', borderBottom:'1px solid #f0f0ee' }}>Page Settings</p>
            <div style={{ marginBottom:'0.875rem' }}>
              <label style={s.label}>Slug (URL)</label>
              <input value={page.slug} onChange={e => setPage({ ...page, slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'') })} style={s.input} />
              <p style={s.hint}>Accessible at /p/{page.slug}</p>
            </div>
            <div style={{ marginBottom:'0.875rem' }}>
              <label style={s.label}>Meta Title ({(page.meta_title||'').length}/60)</label>
              <input value={page.meta_title||''} onChange={e => setPage({ ...page, meta_title:e.target.value })} style={s.input} maxLength={60} />
            </div>
            <div style={{ marginBottom:'0.5rem' }}>
              <label style={s.label}>Meta Description ({(page.meta_desc||'').length}/160)</label>
              <textarea value={page.meta_desc||''} onChange={e => setPage({ ...page, meta_desc:e.target.value })} style={{ ...s.input, minHeight:'70px', resize:'vertical' }} maxLength={160} />
            </div>
          </div>

          {/* Block picker */}
          {adding && (
            <div style={{ border:'1px solid #e8e8e6', borderRadius:'4px', padding:'1.25rem', background:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:'#0f0f0f' }}>Add a Block</p>
                <button onClick={() => setAdding(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#999', fontSize:'1rem' }}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type} onClick={() => addBlock(bt.type)}
                    style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.625rem 0.75rem', border:'1px solid #e8e8e6', borderRadius:'3px', background:'#fafaf9', cursor:'pointer', textAlign:'left', transition:'background 0.1s' }}>
                    <span style={{ fontSize:'1rem' }}>{bt.icon}</span>
                    <div>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'0.1rem' }}>{bt.label}</p>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#bbb' }}>{bt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

// ── BLOCK EDITOR ──────────────────────────────────────────────────────────────

function BlockEditor({ block, onChange }) {
  const set = (field) => (e) => {
    const v = e.target.type==='checkbox' ? e.target.checked : e.target.value
    onChange({ ...block, [field]: v })
  }

  const setItem = (i, field, val) => {
    const items = [...(block.items||[])]
    items[i] = { ...items[i], [field]: val }
    onChange({ ...block, items })
  }

  const addItem = (def) => onChange({ ...block, items:[...(block.items||[]), def] })
  const removeItem = (i) => onChange({ ...block, items:(block.items||[]).filter((_,j)=>j!==i) })

  switch (block.type) {

    case 'hero': return (
      <div style={f}>
        <Row><F label="Eyebrow"><I val={block.eyebrow} set={set('eyebrow')} ph="e.g. Limited Seats" /></F><F label="Background"><I val={block.bg} set={set('bg')} ph="#0f0f0f" /></F></Row>
        <F label="Main Title *"><I val={block.title} set={set('title')} ph="Your main headline" /></F>
        <F label="Red Italic Subtitle (second line, optional)"><I val={block.title_red} set={set('title_red')} ph="Italic red line under title" /></F>
        <F label="Subtitle / Supporting text"><T val={block.subtitle} set={set('subtitle')} /></F>
        <Row><F label="CTA Button Text"><I val={block.cta_text} set={set('cta_text')} ph="Get Started →" /></F><F label="CTA URL"><I val={block.cta_href} set={set('cta_href')} ph="https://…" /></F></Row>
        <Row><F label="Secondary Button Text"><I val={block.cta2_text} set={set('cta2_text')} ph="Learn more" /></F><F label="Secondary URL"><I val={block.cta2_href} set={set('cta2_href')} ph="https://…" /></F></Row>
        <Row>
          <Chk val={block.center} set={set('center')} label="Center align" />
          <Chk val={block.compact} set={set('compact')} label="Compact (less padding)" />
        </Row>
      </div>
    )

    case 'text': return (
      <div style={f}>
        <Row><F label="Eyebrow"><I val={block.eyebrow} set={set('eyebrow')} /></F><F label="Background"><I val={block.bg} set={set('bg')} ph="#ffffff" /></F></Row>
        <F label="Title (optional)"><I val={block.title} set={set('title')} ph="Section heading" /></F>
        <F label="Body (* for bold, _ for italic, blank line for new paragraph)"><T val={block.body} set={set('body')} rows={8} /></F>
        <Chk val={block.wide} set={set('wide')} label="Wide (960px max width)" />
      </div>
    )

    case 'features': return (
      <div style={f}>
        <Row><F label="Title"><I val={block.title} set={set('title')} /></F><F label="Background"><I val={block.bg} set={set('bg')} ph="#fafaf9" /></F></Row>
        <F label="Subtitle"><I val={block.subtitle} set={set('subtitle')} /></F>
        <p style={lbl}>Items ({block.items?.length || 0})</p>
        {(block.items||[]).map((item, i) => (
          <div key={i} style={{ padding:'0.875rem', background:'#fafaf9', border:'1px solid #e8e8e6', borderRadius:'3px', marginBottom:'0.5rem' }}>
            <Row>
              <F label="Icon"><I val={item.icon} set={e=>setItem(i,'icon',e.target.value)} ph="✓ or emoji" /></F>
              <F label="Title"><I val={item.title} set={e=>setItem(i,'title',e.target.value)} /></F>
              <button onClick={() => removeItem(i)} style={delBtn}>✕</button>
            </Row>
            <F label="Body"><T val={item.body} set={e=>setItem(i,'body',e.target.value)} rows={2} /></F>
          </div>
        ))}
        <button onClick={() => addItem({ icon:'✓', title:'New Feature', body:'' })} style={addBtn}>+ Add Item</button>
      </div>
    )

    case 'cta': return (
      <div style={f}>
        <Row><F label="Eyebrow"><I val={block.eyebrow} set={set('eyebrow')} /></F><F label="Background"><I val={block.bg} set={set('bg')} ph="#0f0f0f" /></F></Row>
        <F label="Title *"><I val={block.title} set={set('title')} /></F>
        <F label="Subtitle"><T val={block.subtitle} set={set('subtitle')} rows={2} /></F>
        <Row><F label="CTA Text"><I val={block.cta_text} set={set('cta_text')} /></F><F label="CTA URL"><I val={block.cta_href} set={set('cta_href')} /></F></Row>
        <F label="Fine print / note"><I val={block.note} set={set('note')} ph="e.g. Limited seats. No hidden fees." /></F>
      </div>
    )

    case 'countdown': return (
      <div style={f}>
        <Row><F label="Eyebrow"><I val={block.eyebrow} set={set('eyebrow')} /></F><F label="Background"><I val={block.bg} set={set('bg')} ph="#fff8f0" /></F></Row>
        <F label="Title"><I val={block.title} set={set('title')} ph="Offer ends in:" /></F>
        <F label="Deadline (date & time)">
          <input type="datetime-local" value={block.deadline?.slice(0,16)||''} onChange={set('deadline')} style={inp} />
        </F>
        <Row><F label="CTA Text"><I val={block.cta_text} set={set('cta_text')} /></F><F label="CTA URL"><I val={block.cta_href} set={set('cta_href')} /></F></Row>
      </div>
    )

    case 'faq': return (
      <div style={f}>
        <Row><F label="Eyebrow"><I val={block.eyebrow} set={set('eyebrow')} /></F><F label="Background"><I val={block.bg} set={set('bg')} ph="#ffffff" /></F></Row>
        <F label="Title"><I val={block.title} set={set('title')} /></F>
        <p style={lbl}>Questions</p>
        {(block.items||[]).map((item, i) => (
          <div key={i} style={{ padding:'0.875rem', background:'#fafaf9', border:'1px solid #e8e8e6', borderRadius:'3px', marginBottom:'0.5rem' }}>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'start' }}>
              <F label={`Q${i+1}`} style={{ flex:1 }}><I val={item.q} set={e=>setItem(i,'q',e.target.value)} ph="Question?" /></F>
              <button onClick={() => removeItem(i)} style={{ ...delBtn, marginTop:'22px' }}>✕</button>
            </div>
            <F label="Answer"><T val={item.a} set={e=>setItem(i,'a',e.target.value)} rows={3} /></F>
          </div>
        ))}
        <button onClick={() => addItem({ q:'', a:'' })} style={addBtn}>+ Add Question</button>
      </div>
    )

    case 'testimonials': return (
      <div style={f}>
        <Row><F label="Title"><I val={block.title} set={set('title')} /></F><F label="Background"><I val={block.bg} set={set('bg')} ph="#fafaf9" /></F></Row>
        <p style={lbl}>Testimonials</p>
        {(block.items||[]).map((item, i) => (
          <div key={i} style={{ padding:'0.875rem', background:'#fafaf9', border:'1px solid #e8e8e6', borderRadius:'3px', marginBottom:'0.5rem' }}>
            <Row>
              <F label="Name"><I val={item.name} set={e=>setItem(i,'name',e.target.value)} /></F>
              <F label="Detail (exam, score)"><I val={item.detail} set={e=>setItem(i,'detail',e.target.value)} ph="CAT 2025 · 99%ile" /></F>
              <button onClick={() => removeItem(i)} style={{ ...delBtn, marginTop:'22px' }}>✕</button>
            </Row>
            <F label="Quote"><T val={item.text} set={e=>setItem(i,'text',e.target.value)} rows={3} /></F>
          </div>
        ))}
        <button onClick={() => addItem({ name:'', detail:'', text:'' })} style={addBtn}>+ Add Testimonial</button>
      </div>
    )

    case 'image': return (
      <div style={f}>
        <F label="Image URL *"><I val={block.src} set={set('src')} ph="https://cdn.gradskool.in/image.jpg" /></F>
        <Row><F label="Alt text"><I val={block.alt} set={set('alt')} /></F><F label="Caption"><I val={block.caption} set={set('caption')} /></F></Row>
        <Chk val={block.full} set={set('full')} label="Full-width (no padding)" />
      </div>
    )

    case 'video': return (
      <div style={f}>
        <F label="YouTube or Vimeo URL *"><I val={block.url} set={set('url')} ph="https://www.youtube.com/watch?v=…" /></F>
        <F label="Title (optional)"><I val={block.title} set={set('title')} /></F>
      </div>
    )

    case 'table': return (
      <div style={f}>
        <F label="Title"><I val={block.title} set={set('title')} /></F>
        <F label="Headers (comma-separated)">
          <input value={(block.headers||[]).join(',')} onChange={e => onChange({ ...block, headers:e.target.value.split(',').map(s=>s.trim()) })} style={inp} placeholder="Column 1, Column 2, Column 3" />
        </F>
        <p style={lbl}>Rows ({block.rows?.length || 0})</p>
        {(block.rows||[]).map((row, i) => (
          <div key={i} style={{ display:'flex', gap:'0.5rem', marginBottom:'0.375rem', alignItems:'center' }}>
            <input value={row.join(' | ')} onChange={e => {
              const rows = [...(block.rows||[])]
              rows[i] = e.target.value.split('|').map(s=>s.trim())
              onChange({ ...block, rows })
            }} style={{ ...inp, flex:1 }} placeholder="Cell 1 | Cell 2 | Cell 3" />
            <button onClick={() => onChange({ ...block, rows:(block.rows||[]).filter((_,j)=>j!==i) })} style={delBtn}>✕</button>
          </div>
        ))}
        <button onClick={() => onChange({ ...block, rows:[...(block.rows||[]), Array(block.headers?.length||3).fill('')] })} style={addBtn}>+ Add Row</button>
      </div>
    )

    case 'divider': return (
      <div style={f}>
        <Row>
          <F label="Line Color"><I val={block.color} set={set('color')} ph="#e8e8e6" /></F>
          <Chk val={block.thin} set={set('thin')} label="No padding (thin separator)" />
        </Row>
      </div>
    )

    default: return <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#999' }}>No editor for block type: {block.type}</p>
  }
}

// ── MINI COMPONENTS ───────────────────────────────────────────────────────────

const f   = { display:'flex', flexDirection:'column', gap:'0.75rem' }
const lbl = { fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'#555', marginBottom:'-0.25rem' }
const inp = { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'3px', outline:'none', boxSizing:'border-box' }
const addBtn = { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600', color:'var(--red)', background:'none', border:'1px dashed var(--red)', padding:'0.375rem 0.875rem', borderRadius:'3px', cursor:'pointer' }
const delBtn = { fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#e53e3e', background:'none', border:'1px solid #fca5a5', borderRadius:'3px', padding:'0.25rem 0.4rem', cursor:'pointer', flexShrink:0 }

function F({ label, children }) {
  return (
    <div>
      <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600', color:'#555', display:'block', marginBottom:'0.25rem' }}>{label}</label>
      {children}
    </div>
  )
}
function Row({ children }) { return <div style={{ display:'flex', gap:'0.75rem', alignItems:'end' }}>{children}</div> }
function I({ val, set, ph }) { return <input value={val||''} onChange={set} style={inp} placeholder={ph||''} /> }
function T({ val, set, rows=3 }) { return <textarea value={val||''} onChange={set} style={{ ...inp, minHeight:`${rows*1.5}rem`, resize:'vertical' }} /> }
function Chk({ val, set, label }) {
  return (
    <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#555', display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer' }}>
      <input type="checkbox" checked={!!val} onChange={set} />
      {label}
    </label>
  )
}
function Btn({ onClick, disabled, danger, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.2rem 0.45rem', border:`1px solid ${danger?'#fca5a5':'#e8e8e6'}`, borderRadius:'3px', background:'#fff', cursor:disabled?'default':'pointer', color:danger?'#e53e3e':'#666', opacity:disabled?0.3:1 }}>
      {children}
    </button>
  )
}

const s = {
  header:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1.25rem', borderBottom:'1px solid #e8e8e6' },
  backBtn:    { fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#999', background:'none', border:'1px solid #e8e8e6', padding:'0.5rem 0.875rem', borderRadius:'3px', cursor:'pointer' },
  previewBtn: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'600', color:'#555', border:'1px solid #e8e8e6', padding:'0.625rem 1.125rem', borderRadius:'3px', textDecoration:'none', background:'#fff' },
  saveBtn:    { background:'#0f0f0f', color:'#fff', border:'none', padding:'0.625rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  label:      { display:'block', fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600', color:'#555', marginBottom:'0.25rem' },
  input:      { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  hint:       { fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#bbb', marginTop:'0.2rem' },
}

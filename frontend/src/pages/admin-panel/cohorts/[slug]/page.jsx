/**
 * GRADSKOOL Admin — Cohort Page Designer
 * Route: /admin-panel/cohorts/[slug]/page
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../../../../lib/api'
import { AdminLayout } from '../../../../components/admin/AdminLayout'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff',
  bg:'#f7f6f3', border:'#e8e8e6', gray50:'#fafaf9',
  gray400:'#999', gray500:'#666', green:'#22c55e',
}

const BLOCKS = [
  { type:'hero',         icon:'🎯', label:'Hero Banner',     desc:'Big headline + CTA' },
  { type:'text',         icon:'📝', label:'Text Block',      desc:'Paragraphs + heading' },
  { type:'features',     icon:'⚡', label:'Feature Cards',   desc:'2-4 column benefits' },
  { type:'countdown',    icon:'⏱️', label:'Countdown Timer', desc:'Live countdown to deadline' },
  { type:'cta',          icon:'🔔', label:'CTA Banner',      desc:'Call to action + button' },
  { type:'testimonials', icon:'💬', label:'Testimonials',    desc:'Student quotes + results' },
  { type:'faq',          icon:'❓', label:'FAQ',             desc:'Accordion Q&A' },
  { type:'video',        icon:'▶️', label:'Video Embed',     desc:'YouTube or Bunny' },
  { type:'table',        icon:'📊', label:'Table',           desc:'Comparison / data table' },
  { type:'image',        icon:'🖼️', label:'Image',           desc:'Full or contained image' },
  { type:'divider',      icon:'—',  label:'Divider',         desc:'Visual separator' },
]

const DEFAULTS = {
  hero:         { title:'Join This Cohort', title_red:'', subtitle:'27 students. Focused. Intense.', eyebrow:'Applications Open', cta_text:'Apply Now', cta_href:'/checkout/cat', cta2_text:'', cta2_href:'', bg:'#0f0f0f', dark:false },
  text:         { title:'', eyebrow:'', body:'Write your content here.', bg:'#ffffff' },
  features:     { title:'What You Get', eyebrow:'Included', subtitle:'', bg:'#fafaf9', items:[{ icon:'📹', title:'Video Lectures', body:'All sections recorded' },{ icon:'📡', title:'Live Classes', body:'Weekly with ALP Sir' },{ icon:'📝', title:'Mock Analysis', body:'Post-mock breakdowns' },{ icon:'🎤', title:'GDPI Prep', body:'Interview coaching' }] },
  countdown:    { title:'Enrolment closes in', deadline:'', bg:'#0f0f0f', dark:false },
  cta:          { title:'Ready to crack CAT?', subtitle:'Only 27 seats per cohort.', eyebrow:'', bg:'#ff5e5f', dark:false, cta_text:'Apply for This Cohort', cta_href:'/checkout/cat', cta_phone:'' },
  testimonials: { title:'Students Who Made It', eyebrow:'Results', bg:'#fafaf9', items:[{ name:'Arjun Sharma', exam:'CAT 2025', score:'99.2 %ile', college:'IIM Calcutta', quote:'The structure changed how I think about RC.' }] },
  faq:          { title:'Common Questions', eyebrow:'FAQ', bg:'#ffffff', items:[{ q:'When does it start?', a:'The cohort begins on the start date.' },{ q:'How many students?', a:'Exactly 27 per cohort.' }] },
  video:        { url:'', title:'Watch our free demo class', bg:'#ffffff' },
  table:        { title:"What's Included", bg:'#ffffff', headers:['Feature','Included','Notes'], rows:[['Live Classes','✓','Weekly'],['Recordings','✓','All sections'],['Mock Tests','✓','Testfunda']] },
  image:        { src:'', alt:'', caption:'', full:false, bg:'#ffffff' },
  divider:      { thin:false, bg:'#ffffff', color:'#e8e8e6' },
}

export default function CohortPageDesigner() {
  const router = useRouter()
  const { slug } = router.query

  const [cohort,   setCohort]  = useState(null)
  const [blocks,   setBlocks]  = useState([])
  const [pageSlug, setPageSlug]= useState('')
  const [loading,  setLoad]    = useState(true)
  const [saving,   setSaving]  = useState(false)
  const [msg,      setMsg]     = useState(null)
  const [editIdx,  setEditIdx] = useState(null)

  useEffect(() => {
    if (!slug) return
    api.get('/courses/cohorts/' + slug + '/')
      .then(({ data }) => {
        setCohort(data)
        const ps = data.custom_page_slug || slug + '-page'
        setPageSlug(ps)
        return api.get('/dashboard/pages/' + ps + '/')
          .then(({ data: page }) => setBlocks(page.blocks || []))
          .catch(() => setBlocks([
            { id:1, type:'hero',         data:{ ...DEFAULTS.hero, title:'Join ' + (data.title||'This Cohort'), eyebrow:data.exam_name||'' } },
            { id:2, type:'features',     data:{ ...DEFAULTS.features } },
            { id:3, type:'countdown',    data:{ ...DEFAULTS.countdown } },
            { id:4, type:'testimonials', data:{ ...DEFAULTS.testimonials } },
            { id:5, type:'faq',          data:{ ...DEFAULTS.faq } },
            { id:6, type:'cta',          data:{ ...DEFAULTS.cta } },
          ]))
      })
      .catch(() => setMsg({ type:'error', text:'Cohort not found' }))
      .finally(() => setLoad(false))
  }, [slug])

  const notify = (text, type='success') => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000) }

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/dashboard/pages/', { slug:pageSlug, title:(cohort?.title||'Cohort')+' — Page', blocks, is_published:true })
        .catch(() => api.put('/dashboard/pages/' + pageSlug + '/', { blocks, is_published:true }))
      await api.patch('/courses/cohorts/' + slug + '/', { custom_page_slug:pageSlug }).catch(()=>{})
      notify('Page published! Live at /p/' + pageSlug)
    } catch { notify('Save failed', 'error') }
    finally { setSaving(false) }
  }

  const addBlock  = (type) => setBlocks(b => [...b, { id:Date.now(), type, data:{ ...DEFAULTS[type] } }])
  const removeBlock = (idx) => { if (!confirm('Remove this block?')) return; setBlocks(b => b.filter((_,i)=>i!==idx)); if(editIdx===idx) setEditIdx(null) }
  const moveUp    = (idx) => { if(idx===0) return; const b=[...blocks]; [b[idx-1],b[idx]]=[b[idx],b[idx-1]]; setBlocks(b) }
  const moveDown  = (idx) => { if(idx===blocks.length-1) return; const b=[...blocks]; [b[idx],b[idx+1]]=[b[idx+1],b[idx]]; setBlocks(b) }
  const updateBlock = (idx, data) => setBlocks(b => b.map((bl,i)=>i===idx?{...bl,data}:bl))

  return (
    <AdminLayout title="Cohort">
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head><title>Page Designer — {cohort?.title||slug}</title></Head>

      <div style={{ height:'56px', background:C.black, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link href="/admin-panel/cohorts" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>← Cohorts</Link>
          <span style={{ color:'rgba(255,255,255,0.2)' }}>|</span>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', fontWeight:'700', color:'#fff' }}>{cohort?.title||slug} — Page Designer</p>
          {cohort && <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.15rem 0.5rem', borderRadius:'3px', background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)' }}>{cohort.exam_name}</span>}
        </div>
        <div style={{ display:'flex', gap:'0.625rem' }}>
          <a href={'/p/' + pageSlug} target="_blank" rel="noreferrer"
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'rgba(255,255,255,0.5)', textDecoration:'none', padding:'0.375rem 0.75rem', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'4px' }}>
            Preview ↗
          </a>
          <button onClick={save} disabled={saving}
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', padding:'0.5rem 1.25rem', background:saving?'#666':C.red, color:'#fff', border:'none', borderRadius:'4px', cursor:saving?'not-allowed':'pointer' }}>
            {saving?'Saving…':'Publish Page'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', maxWidth:'400px',
          background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding:'4rem', textAlign:'center', color:C.gray400, fontFamily:'Georgia,serif' }}>Loading…</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', minHeight:'calc(100vh - 56px)' }}>

          {/* Sidebar */}
          <div style={{ background:C.white, borderRight:'1px solid '+C.border, overflowY:'auto', padding:'1.25rem' }}>
            <p style={s.sl}>On Page ({blocks.length} blocks)</p>
            {blocks.map((bl, idx) => {
              const cfg = BLOCKS.find(b=>b.type===bl.type)
              return (
                <div key={bl.id} onClick={() => setEditIdx(editIdx===idx?null:idx)}
                  style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.625rem', borderRadius:'4px', marginBottom:'0.2rem', cursor:'pointer',
                    background:editIdx===idx?'#fff5f5':C.gray50, border:'1px solid '+(editIdx===idx?C.red:C.border) }}>
                  <span style={{ fontSize:'0.875rem' }}>{cfg?.icon}</span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:editIdx===idx?'700':'400', color:C.black, flex:1 }}>{cfg?.label}</span>
                  <button onClick={e=>{e.stopPropagation();moveUp(idx)}} disabled={idx===0} style={{ ...s.ib, opacity:idx===0?0.3:1 }}>↑</button>
                  <button onClick={e=>{e.stopPropagation();moveDown(idx)}} disabled={idx===blocks.length-1} style={{ ...s.ib, opacity:idx===blocks.length-1?0.3:1 }}>↓</button>
                  <button onClick={e=>{e.stopPropagation();removeBlock(idx)}} style={{ ...s.ib, color:C.red }}>✕</button>
                </div>
              )
            })}

            <div style={{ height:'1px', background:C.border, margin:'1rem 0' }} />
            <p style={s.sl}>Add Block</p>
            {BLOCKS.map(b => (
              <button key={b.type} onClick={()=>addBlock(b.type)}
                style={{ display:'flex', alignItems:'center', gap:'0.625rem', width:'100%', padding:'0.625rem 0.75rem', background:C.white, border:'1px solid '+C.border, borderRadius:'4px', cursor:'pointer', textAlign:'left', marginBottom:'0.375rem' }}>
                <span style={{ fontSize:'1rem' }}>{b.icon}</span>
                <div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'600', color:C.black }}>{b.label}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:C.gray400 }}>{b.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Main */}
          <div style={{ overflowY:'auto' }}>
            {editIdx !== null && blocks[editIdx] && (
              <BlockEditor block={blocks[editIdx]} onUpdate={data=>updateBlock(editIdx,data)} onClose={()=>setEditIdx(null)} />
            )}

            {blocks.length === 0 ? (
              <div style={{ padding:'5rem', textAlign:'center' }}>
                <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎨</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:'700', color:C.black, marginBottom:'0.5rem' }}>Start building your cohort page</p>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray400, marginBottom:'2rem', lineHeight:1.7 }}>Add blocks from the left. Start with a Hero block.</p>
                <button onClick={()=>addBlock('hero')}
                  style={{ padding:'0.875rem 2rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', cursor:'pointer' }}>
                  + Add Hero Block
                </button>
              </div>
            ) : (
              <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400 }}>Click any block to edit · Drag ↑↓ to reorder</p>
                  <a href={'/p/'+pageSlug} target="_blank" rel="noreferrer"
                    style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.red, textDecoration:'none', fontWeight:'700' }}>
                    Preview live ↗
                  </a>
                </div>
                {blocks.map((bl, idx) => {
                  const cfg = BLOCKS.find(b=>b.type===bl.type)
                  const isEdit = editIdx===idx
                  return (
                    <div key={bl.id} onClick={()=>setEditIdx(isEdit?null:idx)}
                      style={{ border:'2px solid '+(isEdit?C.red:C.border), borderRadius:'8px', overflow:'hidden', background:C.white, cursor:'pointer', transition:'border-color 0.15s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', background:isEdit?'#fff5f5':C.gray50, borderBottom:'1px solid '+C.border }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                          <span>{cfg?.icon}</span>
                          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:C.black }}>{cfg?.label}</span>
                          {bl.data?.title && <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:C.gray400 }}>— {String(bl.data.title).substring(0,40)}</span>}
                        </div>
                        <div style={{ display:'flex', gap:'0.375rem', alignItems:'center' }}>
                          <button onClick={e=>{e.stopPropagation();moveUp(idx)}} disabled={idx===0} style={{ ...s.ib, border:'1px solid '+C.border, padding:'0.2rem 0.5rem', borderRadius:'3px', opacity:idx===0?0.3:1 }}>↑</button>
                          <button onClick={e=>{e.stopPropagation();moveDown(idx)}} disabled={idx===blocks.length-1} style={{ ...s.ib, border:'1px solid '+C.border, padding:'0.2rem 0.5rem', borderRadius:'3px', opacity:idx===blocks.length-1?0.3:1 }}>↓</button>
                          <button onClick={e=>{e.stopPropagation();removeBlock(idx)}} style={{ ...s.ib, border:'1px solid #fca5a5', padding:'0.2rem 0.5rem', borderRadius:'3px', color:C.red }}>✕</button>
                          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:isEdit?C.red:C.gray400, fontWeight:'700' }}>{isEdit?'▲ Close':'✎ Edit'}</span>
                        </div>
                      </div>
                      <div style={{ padding:'0.75rem 1rem' }}>
                        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray500, lineHeight:1.5 }}>
                          {bl.type==='hero' && '"'+bl.data?.title+'" — '+bl.data?.subtitle?.substring(0,60)}
                          {bl.type==='text' && (bl.data?.body||'').substring(0,100)}
                          {bl.type==='features' && (bl.data?.items?.length||0)+' features — "'+bl.data?.title+'"'}
                          {bl.type==='countdown' && 'Countdown to: '+(bl.data?.deadline?new Date(bl.data.deadline).toLocaleDateString('en-IN'):'(not set)')}
                          {bl.type==='cta' && '"'+bl.data?.title+'" → '+bl.data?.cta_text}
                          {bl.type==='testimonials' && (bl.data?.items?.length||0)+' testimonials'}
                          {bl.type==='faq' && (bl.data?.items?.length||0)+' FAQ items'}
                          {bl.type==='video' && (bl.data?.url||'(no URL set)')}
                          {bl.type==='table' && (bl.data?.rows?.length||0)+' rows × '+(bl.data?.headers?.length||0)+' cols'}
                          {bl.type==='image' && (bl.data?.src||'(no image URL set)')}
                          {bl.type==='divider' && 'Horizontal divider'}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <button onClick={save} disabled={saving}
                  style={{ padding:'1rem', background:C.red, color:'#fff', border:'none', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'700', cursor:'pointer', marginTop:'0.5rem' }}>
                  {saving?'Publishing…':'Publish Page →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

function BlockEditor({ block, onUpdate, onClose }) {
  const [data, setData] = useState({ ...block.data })
  const set = (k, v) => setData(d => ({ ...d, [k]:v }))
  const apply = () => { onUpdate(data); onClose() }

  const presets = ['#ffffff','#fafaf9','#f7f6f3','#0f0f0f','#ff5e5f','#1a1a2e','#f0f9ff','#f0fdf4','#fff7ed']

  const BgRow = ({ val, onChange, darkToggle, dark, onDark }) => (
    <div>
      <label style={s.lbl}>Background</label>
      <div style={{ display:'flex', gap:'0.375rem', alignItems:'center', flexWrap:'wrap' }}>
        {presets.map(c => <button key={c} onClick={()=>onChange(c)} title={c} style={{ width:'24px', height:'24px', borderRadius:'4px', background:c, border:val===c?'2px solid #ff5e5f':'1px solid #e8e8e6', cursor:'pointer' }} />)}
        <input type="color" value={val} onChange={e=>onChange(e.target.value)} style={{ width:'32px', height:'28px', border:'1px solid #e8e8e6', borderRadius:'4px', cursor:'pointer' }} />
        {darkToggle && <label style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', marginLeft:'0.5rem' }}><input type="checkbox" checked={!!dark} onChange={e=>onDark(e.target.checked)} /><span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem' }}>Light text</span></label>}
      </div>
    </div>
  )

  const Fld = ({ label, value, onChange, placeholder, textarea, rows=3 }) => (
    <div>
      {label && <label style={s.lbl}>{label}</label>}
      {textarea
        ? <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ ...s.inp, height:rows*28+'px', resize:'vertical' }} />
        : <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s.inp} />}
    </div>
  )

  return (
    <div style={{ background:'#fff5f5', border:'2px solid #ff5e5f', borderRadius:'8px', margin:'1.5rem', padding:'1.5rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:'#0f0f0f' }}>
          Edit {BLOCKS.find(b=>b.type===block.type)?.label}
        </p>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button onClick={apply} style={{ padding:'0.5rem 1.25rem', background:'#ff5e5f', color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:'pointer' }}>Apply</button>
          <button onClick={onClose} style={{ padding:'0.5rem 0.875rem', background:'#fff', border:'1px solid #e8e8e6', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer', color:'#666' }}>Cancel</button>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
        {block.type==='hero' && <>
          <Fld label="Eyebrow" value={data.eyebrow} onChange={v=>set('eyebrow',v)} placeholder="e.g. Applications Open" />
          <Fld label="Headline" value={data.title} onChange={v=>set('title',v)} placeholder="e.g. Join the CAT 2026 Cohort" />
          <Fld label="Red part of headline" value={data.title_red} onChange={v=>set('title_red',v)} placeholder="e.g. CAT 2026" />
          <Fld label="Subtitle" value={data.subtitle} onChange={v=>set('subtitle',v)} placeholder="Supporting text" textarea />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <Fld label="Button 1 text" value={data.cta_text} onChange={v=>set('cta_text',v)} placeholder="Apply Now" />
            <Fld label="Button 1 link" value={data.cta_href} onChange={v=>set('cta_href',v)} placeholder="/checkout/cat" />
            <Fld label="Button 2 text" value={data.cta2_text} onChange={v=>set('cta2_text',v)} placeholder="Watch Demo (optional)" />
            <Fld label="Button 2 link" value={data.cta2_href} onChange={v=>set('cta2_href',v)} placeholder="/tools" />
          </div>
          <BgRow val={data.bg||'#0f0f0f'} onChange={v=>set('bg',v)} darkToggle dark={data.dark} onDark={v=>set('dark',v)} />
        </>}

        {block.type==='text' && <>
          <Fld label="Eyebrow (optional)" value={data.eyebrow} onChange={v=>set('eyebrow',v)} placeholder="e.g. About This Cohort" />
          <Fld label="Heading (optional)" value={data.title} onChange={v=>set('title',v)} placeholder="e.g. What Makes This Different" />
          <Fld label="Body text *" value={data.body} onChange={v=>set('body',v)} placeholder="Your content..." textarea rows={6} />
          <BgRow val={data.bg||'#ffffff'} onChange={v=>set('bg',v)} />
        </>}

        {block.type==='features' && <>
          <Fld label="Section Title" value={data.title} onChange={v=>set('title',v)} placeholder="What You Get" />
          <Fld label="Eyebrow" value={data.eyebrow} onChange={v=>set('eyebrow',v)} placeholder="Included" />
          <label style={s.lbl}>Feature Cards</label>
          {(data.items||[]).map((item,i) => (
            <div key={i} style={{ border:'1px solid #e8e8e6', borderRadius:'6px', padding:'0.75rem', marginBottom:'0.5rem', background:'#fff' }}>
              <div style={{ display:'grid', gridTemplateColumns:'50px 1fr 1fr', gap:'0.5rem' }}>
                <Fld label="Icon" value={item.icon} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],icon:v}; set('items',it) }} placeholder="✓" />
                <Fld label="Title" value={item.title} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],title:v}; set('items',it) }} placeholder="Feature" />
                <Fld label="Body" value={item.body} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],body:v}; set('items',it) }} placeholder="Description" />
              </div>
              <button onClick={()=>set('items',data.items.filter((_,j)=>j!==i))} style={s.rem}>Remove</button>
            </div>
          ))}
          <button onClick={()=>set('items',[...(data.items||[]),{icon:'✓',title:'Feature',body:'Description'}])} style={s.add}>+ Add Feature</button>
          <BgRow val={data.bg||'#fafaf9'} onChange={v=>set('bg',v)} />
        </>}

        {block.type==='countdown' && <>
          <Fld label="Title" value={data.title} onChange={v=>set('title',v)} placeholder="Enrolment closes in" />
          <div><label style={s.lbl}>Deadline</label><input type="datetime-local" value={data.deadline||''} onChange={e=>set('deadline',e.target.value)} style={s.inp} /></div>
          <BgRow val={data.bg||'#0f0f0f'} onChange={v=>set('bg',v)} darkToggle dark={data.dark} onDark={v=>set('dark',v)} />
        </>}

        {block.type==='cta' && <>
          <Fld label="Headline" value={data.title} onChange={v=>set('title',v)} placeholder="Ready to crack CAT?" />
          <Fld label="Subtext" value={data.subtitle} onChange={v=>set('subtitle',v)} placeholder="Only 27 seats." />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <Fld label="Button text" value={data.cta_text} onChange={v=>set('cta_text',v)} placeholder="Apply Now" />
            <Fld label="Button link" value={data.cta_href} onChange={v=>set('cta_href',v)} placeholder="/checkout/cat" />
          </div>
          <Fld label="WhatsApp number (optional)" value={data.cta_phone} onChange={v=>set('cta_phone',v)} placeholder="916360597966" />
          <BgRow val={data.bg||'#ff5e5f'} onChange={v=>set('bg',v)} darkToggle dark={data.dark} onDark={v=>set('dark',v)} />
        </>}

        {block.type==='testimonials' && <>
          <Fld label="Section Title" value={data.title} onChange={v=>set('title',v)} placeholder="Students Who Made It" />
          <label style={s.lbl}>Testimonials</label>
          {(data.items||[]).map((item,i) => (
            <div key={i} style={{ border:'1px solid #e8e8e6', borderRadius:'6px', padding:'0.75rem', marginBottom:'0.5rem', background:'#fff' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem' }}>
                <Fld label="Name" value={item.name} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],name:v}; set('items',it) }} />
                <Fld label="Score" value={item.score} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],score:v}; set('items',it) }} placeholder="99.2 %ile" />
                <Fld label="College" value={item.college} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],college:v}; set('items',it) }} placeholder="IIM Calcutta" />
                <Fld label="Exam" value={item.exam} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],exam:v}; set('items',it) }} placeholder="CAT 2025" />
              </div>
              <Fld label="Quote" value={item.quote} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],quote:v}; set('items',it) }} placeholder="What they said..." textarea />
              <button onClick={()=>set('items',data.items.filter((_,j)=>j!==i))} style={s.rem}>Remove</button>
            </div>
          ))}
          <button onClick={()=>set('items',[...(data.items||[]),{name:'',score:'',college:'',exam:'',quote:''}])} style={s.add}>+ Add Testimonial</button>
          <BgRow val={data.bg||'#fafaf9'} onChange={v=>set('bg',v)} />
        </>}

        {block.type==='faq' && <>
          <Fld label="Section Title" value={data.title} onChange={v=>set('title',v)} placeholder="Common Questions" />
          <label style={s.lbl}>FAQ Items</label>
          {(data.items||[]).map((item,i) => (
            <div key={i} style={{ border:'1px solid #e8e8e6', borderRadius:'6px', padding:'0.75rem', marginBottom:'0.5rem', background:'#fff' }}>
              <Fld label="Question" value={item.q} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],q:v}; set('items',it) }} placeholder="Question?" />
              <Fld label="Answer" value={item.a} onChange={v=>{ const it=[...data.items]; it[i]={...it[i],a:v}; set('items',it) }} placeholder="Answer..." textarea />
              <button onClick={()=>set('items',data.items.filter((_,j)=>j!==i))} style={s.rem}>Remove</button>
            </div>
          ))}
          <button onClick={()=>set('items',[...(data.items||[]),{q:'',a:''}])} style={s.add}>+ Add FAQ Item</button>
          <BgRow val={data.bg||'#ffffff'} onChange={v=>set('bg',v)} />
        </>}

        {block.type==='video' && <>
          <Fld label="Video URL (YouTube or Bunny)" value={data.url} onChange={v=>set('url',v)} placeholder="https://youtube.com/..." />
          <Fld label="Caption" value={data.title} onChange={v=>set('title',v)} placeholder="Watch our free demo class" />
          <BgRow val={data.bg||'#ffffff'} onChange={v=>set('bg',v)} />
        </>}

        {block.type==='table' && <>
          <Fld label="Title" value={data.title} onChange={v=>set('title',v)} placeholder="What's Included" />
          <div>
            <label style={s.lbl}>Headers</label>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.5rem' }}>
              {(data.headers||[]).map((h,i) => <input key={i} value={h} onChange={e=>{ const hs=[...data.headers]; hs[i]=e.target.value; set('headers',hs) }} style={{ ...s.inp, width:'120px' }} />)}
              <button onClick={()=>set('headers',[...(data.headers||[]),'Column'])} style={s.add}>+ Col</button>
            </div>
          </div>
          <div>
            <label style={s.lbl}>Rows</label>
            {(data.rows||[]).map((row,i) => (
              <div key={i} style={{ display:'flex', gap:'0.375rem', marginBottom:'0.375rem', alignItems:'center' }}>
                {row.map((cell,j) => <input key={j} value={cell} onChange={e=>{ const rs=[...data.rows]; rs[i]=[...rs[i]]; rs[i][j]=e.target.value; set('rows',rs) }} style={{ ...s.inp, flex:1, fontSize:'0.78rem' }} />)}
                <button onClick={()=>set('rows',data.rows.filter((_,k)=>k!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'#ff5e5f', fontSize:'0.875rem' }}>✕</button>
              </div>
            ))}
            <button onClick={()=>set('rows',[...(data.rows||[]),(data.headers||[]).map(()=>(''))])} style={s.add}>+ Add Row</button>
          </div>
        </>}

        {block.type==='image' && <>
          <Fld label="Image URL" value={data.src} onChange={v=>set('src',v)} placeholder="https://..." />
          <Fld label="Alt text" value={data.alt} onChange={v=>set('alt',v)} placeholder="Describe the image" />
          <Fld label="Caption" value={data.caption} onChange={v=>set('caption',v)} placeholder="Optional caption" />
          <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}><input type="checkbox" checked={!!data.full} onChange={e=>set('full',e.target.checked)} /><span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem' }}>Full width</span></label>
          <BgRow val={data.bg||'#ffffff'} onChange={v=>set('bg',v)} />
        </>}

        {block.type==='divider' && <>
          <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}><input type="checkbox" checked={!!data.thin} onChange={e=>set('thin',e.target.checked)} /><span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem' }}>Thin line</span></label>
          <BgRow val={data.bg||'#ffffff'} onChange={v=>set('bg',v)} />
        </>}
      </div>
    </div>
  )
}

const s = {
  sl:  { fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:'#999', marginBottom:'0.5rem', display:'block' },
  lbl: { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp: { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box' },
  ib:  { background:'none', border:'none', cursor:'pointer', color:'#999', fontSize:'0.75rem', padding:'1px 3px' },
  add: { fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', padding:'0.375rem 0.75rem', background:'#fff', border:'1px solid #ff5e5f', borderRadius:'4px', color:'#ff5e5f', cursor:'pointer', marginTop:'0.375rem' },
  rem: { fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#ff5e5f', background:'none', border:'none', cursor:'pointer', padding:'0.375rem 0 0', display:'block' },
}

/**
 * GRADSKOOL Admin — Dynamic Pages
 * Route: /admin-panel/pages
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

export default function AdminPagesPage() {
  const [pages,   setPages]  = useState([])
  const [loading, setLoad]   = useState(true)
  const [creating,setCreate] = useState(false)
  const [newSlug, setNewSlug]= useState('')
  const [newTitle,setNewTitle]= useState('')
  const [msg,     setMsg]    = useState(null)

  const load = () => {
    setLoad(true)
    api.get('/dashboard/pages/')
      .then(({ data }) => setPages(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load pages' }))
      .finally(() => setLoad(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newTitle) return
    try {
      const { data } = await api.post('/dashboard/pages/', {
        title: newTitle,
        slug: newSlug || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        blocks: [],
      })
      setCreate(false); setNewSlug(''); setNewTitle('')
      window.location.href = `/admin-panel/pages/${data.slug}`
    } catch (err) {
      setMsg({ type:'error', text: typeof err.response?.data?.error === 'string' ? err.response.data.error : JSON.stringify(err.response?.data?.error || 'Failed') || 'Create failed' })
    }
  }

  const handleDelete = async (slug) => {
    if (!confirm(`Delete page /p/${slug}? This cannot be undone.`)) return
    await api.delete(`/dashboard/pages/${slug}/`)
    setMsg({ type:'success', text:`Deleted /p/${slug}` })
    load()
  }

  const handleToggle = async (page) => {
    await api.patch(`/dashboard/pages/${page.slug}/`, { is_active: !page.is_active })
    load()
  }

  return (
    <AdminLayout title="Dynamic Pages">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Content</p>
          <h1 style={s.title}>Dynamic Pages</h1>
          <p style={s.sub}>Create landing pages accessible at <code style={s.code}>/p/[slug]</code>. Edit blocks via the page editor.</p>
        </div>
        <button onClick={() => setCreate(true)} style={s.btn}>+ New Page</button>
      </div>

      {msg && (
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem 1rem', borderRadius:'4px', marginBottom:'1.25rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', background:msg.type==='success'?'#f0fdf4':'#fff5f5', border:`1px solid ${msg.type==='success'?'#86efac':'#fca5a5'}`, color:msg.type==='success'?'#166534':'#991b1b' }}>
          {msg.text}<button onClick={() => setMsg(null)} style={{ background:'none',border:'none',cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <SectionBox style={{ marginBottom:'1.5rem' }}>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:'var(--black)', marginBottom:'1rem' }}>New Page</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            <div>
              <label style={s.label}>Page Title *</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} style={s.input} placeholder="e.g. CAT 2026 Flash Sale" autoFocus />
            </div>
            <div>
              <label style={s.label}>Slug (URL path)</label>
              <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} style={s.input} placeholder="e.g. sale (auto-generated if blank)" />
              {(newSlug || newTitle) && <p style={s.hint}>URL: <strong>/p/{newSlug || newTitle.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}</strong></p>}
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button onClick={handleCreate} disabled={!newTitle} style={{ ...s.btn, opacity:newTitle?1:0.5 }}>Create & Open Editor →</button>
            <button onClick={() => { setCreate(false); setNewSlug(''); setNewTitle('') }} style={s.cancelBtn}>Cancel</button>
          </div>
        </SectionBox>
      )}

      {/* Pages list */}
      {loading ? (
        <div style={{ padding:'3rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'#999' }}>Loading…</div>
      ) : pages.length === 0 ? (
        <SectionBox>
          <div style={{ padding:'3rem', textAlign:'center' }}>
            <p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>📄</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'600', color:'var(--black)', marginBottom:'0.375rem' }}>No pages yet</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#999' }}>Create your first page to use as a sale landing page, webinar registration, or any custom campaign.</p>
          </div>
        </SectionBox>
      ) : (
        <SectionBox>
          {/* Table header */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 80px 100px 180px', gap:'1rem', padding:'0.625rem 1.5rem', background:'var(--gray-50)', borderBottom:'1px solid var(--gray-100)' }}>
            {['Title','URL','Blocks','Status','Actions'].map(h => (
              <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:'#999' }}>{h}</span>
            ))}
          </div>

          {pages.map((page, i) => (
            <div key={page.slug} style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 80px 100px 180px', gap:'1rem', padding:'1rem 1.5rem', borderBottom: i<pages.length-1?'1px solid var(--gray-100)':'none', alignItems:'center' }}>
              <div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'600', color:'var(--black)', marginBottom:'0.1rem' }}>{page.title}</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#bbb' }}>
                  Last updated {new Date(page.updated_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                </p>
              </div>
              <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer"
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'var(--red)', textDecoration:'none' }}>
                /p/{page.slug} ↗
              </a>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#999' }}>{page.block_count}</span>
              <button onClick={() => handleToggle(page)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', padding:'0.25rem 0.625rem', borderRadius:'100px', border:'none', cursor:'pointer', background: page.is_active?'#f0fdf4':'#fff5f5', color: page.is_active?'#166534':'#991b1b' }}>
                {page.is_active ? '● Live' : '○ Inactive'}
              </button>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <Link href={`/admin-panel/pages/${page.slug}`} style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.625rem', border:'1px solid var(--gray-200)', borderRadius:'3px', textDecoration:'none', color:'var(--gray-600)', background:'var(--white)' }}>
                  Edit
                </Link>
                <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer" style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.625rem', border:'1px solid var(--gray-200)', borderRadius:'3px', textDecoration:'none', color:'var(--gray-600)', background:'var(--white)' }}>
                  Preview ↗
                </a>
                <button onClick={() => handleDelete(page.slug)} style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.625rem', border:'1px solid #fca5a5', borderRadius:'3px', background:'var(--white)', cursor:'pointer', color:'#991b1b' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </SectionBox>
      )}

      {/* Usage examples */}
      <div style={{ marginTop:'2rem', padding:'1.5rem', background:'#f8faff', border:'1px solid #dbeafe', borderRadius:'4px' }}>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:'#1d4ed8', marginBottom:'0.75rem' }}>Example use cases</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem' }}>
          {[
            ['/p/sale',       'Flash sale — limited-time pricing'],
            ['/p/webinar',    'Webinar registration page'],
            ['/p/scholarship','Scholarship programme details'],
            ['/p/cat-results','CAT results analysis + offer'],
            ['/p/workshop',   'Weekend workshop registration'],
            ['/p/free-trial', 'Free trial or demo access page'],
          ].map(([url, desc]) => (
            <div key={url} style={{ background:'#fff', border:'1px solid #dbeafe', borderRadius:'3px', padding:'0.625rem 0.875rem' }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', color:'#1d4ed8', marginBottom:'0.1rem' }}>{url}</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#999' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

const s = {
  header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' },
  eyebrow:   { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.2rem' },
  title:     { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.25rem' },
  sub:       { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  code:      { fontFamily:'monospace', fontSize:'0.875rem', background:'var(--gray-100)', padding:'0.1rem 0.4rem', borderRadius:'3px' },
  btn:       { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
  cancelBtn: { background:'none', border:'1px solid var(--gray-200)', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', cursor:'pointer', color:'var(--gray-500)' },
  label:     { display:'block', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'var(--gray-700)', marginBottom:'0.3rem' },
  input:     { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  hint:      { fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'var(--gray-400)', marginTop:'0.25rem' },
}

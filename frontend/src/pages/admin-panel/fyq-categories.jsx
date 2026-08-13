/**
 * GRADSKOOL Admin — FYQ Categories
 * Route: /admin-panel/fyq-categories
 *
 * Manages the Section → Category → Topic browse tree for FYQs.
 * Drill-down card navigation: Sections at the top level, then either
 * Categories (for sections with has_categories=True, i.e. Quants) or
 * Topics directly (LRDI/VARC) one level down, then Topics under a
 * Category for sections that do use them.
 */
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

const C = {
  red:'#d94f50', black:'#1a1a18', white:'#fff',
  border:'#e6e5e1', gray:'#7a7974', g100:'#f4f3ef', g200:'#e6e5e1', off:'#fafaf8',
}

function inp(extra={}) {
  return {
    fontFamily:'var(--font-sans)', fontSize:13, padding:'8px 10px',
    border:`1px solid ${C.border}`, borderRadius:2, background:C.white,
    outline:'none', width:'100%', boxSizing:'border-box', color:C.black,
    ...extra,
  }
}

function errorText(err, fallback = 'Something went wrong') {
  if (!err) return fallback
  if (typeof err === 'string') return err
  if (typeof err === 'object') return err.message || err.detail || JSON.stringify(err)
  return fallback
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position:'fixed', top:68, right:24, zIndex:999, padding:'10px 18px', borderRadius:3,
      fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500,
      background: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
      border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#86efac'}`,
      color: msg.type === 'error' ? '#991b1b' : '#166534',
      boxShadow:'0 4px 16px rgba(0,0,0,.1)',
    }}>{errorText(msg.text, '')}</div>
  )
}

function Card({ title, sub, onClick, onEdit, onDelete }) {
  return (
    <div onClick={onClick} style={{ border:`1px solid ${C.border}`, borderRadius:6, background:C.white, padding:'18px 20px', cursor: onClick ? 'pointer' : 'default', display:'flex', flexDirection:'column', gap:4, transition:'box-shadow .15s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.08)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:C.black }}>{title}</div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
          {onEdit && <button onClick={onEdit} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'3px 8px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer' }}>Edit</button>}
          {onDelete && <button onClick={onDelete} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'3px 8px', border:'1px solid #fca5a5', borderRadius:2, background:C.white, cursor:'pointer', color:C.red }}>✕</button>}
        </div>
      </div>
      {sub && <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>{sub}</div>}
      {onClick && <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.red, marginTop:6 }}>Open →</div>}
    </div>
  )
}

function AddCardButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      border:`1px dashed ${C.border}`, borderRadius:6, background:'none', padding:'18px 20px',
      cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, textAlign:'left',
    }}>
      + {label}
    </button>
  )
}

function InlineForm({ initial, placeholder, onSave, onCancel, showHasCategories }) {
  const [name, setName] = useState(initial?.name || '')
  const [hasCategories, setHasCategories] = useState(initial?.has_categories || false)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), ...(showHasCategories ? { has_categories: hasCategories } : {}) })
    setSaving(false)
  }

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:6, background:C.off, padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={placeholder} style={inp()}
        onKeyDown={e => e.key === 'Enter' && submit()} />
      {showHasCategories && (
        <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-sans)', fontSize:12, color:C.gray, cursor:'pointer' }}>
          <input type="checkbox" checked={hasCategories} onChange={e => setHasCategories(e.target.checked)} />
          Uses categories (like Quants → Arithmetic/Algebra/...) — leave unchecked for sections like LRDI/VARC where topics attach directly
        </label>
      )}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={submit} disabled={saving || !name.trim()} style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'7px 16px', background:C.red, color:C.white, border:'none', borderRadius:2, cursor:'pointer', opacity: saving || !name.trim() ? .6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} style={{ fontFamily:'var(--font-sans)', fontSize:12, padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function FYQCategoriesAdmin() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  // Drill-down state
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [activeCategoryId, setActiveCategoryId] = useState(null)

  // Which "add" form is open, and which item is being edited
  const [addingSection, setAddingSection] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)
  const [addingTopic, setAddingTopic] = useState(false)
  const [editing, setEditing] = useState(null) // { type: 'section'|'category'|'topic', item }

  const notify = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500) }

  const load = useCallback(() => {
    setLoading(true)
    console.log('[FYQ CATEGORIES DEBUG] Requesting: /dashboard/fyq/sections/')
    api.get('/dashboard/fyq/sections/')
      .then(({ data }) => { console.log('[FYQ CATEGORIES DEBUG] Success:', data); setSections(data) })
      .catch((err) => {
        console.error('[FYQ CATEGORIES DEBUG] Failed:', err.response?.status, err.response?.data || err.message)
        setSections([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const activeSection  = sections.find(s => s.id === activeSectionId)
  const activeCategory = activeSection?.categories?.find(c => c.id === activeCategoryId)

  // ── Section actions ──
  const saveSection = async (payload) => {
    try {
      await api.post('/dashboard/fyq/sections/', payload)
      notify('Section added ✓'); setAddingSection(false); load()
    } catch (e) { notify(errorText(e.response?.data?.error), 'error') }
  }
  const updateSection = async (payload) => {
    try {
      await api.patch(`/dashboard/fyq/sections/${editing.item.id}/`, payload)
      notify('Section updated ✓'); setEditing(null); load()
    } catch (e) { notify(errorText(e.response?.data?.error), 'error') }
  }
  const deleteSection = async (s) => {
    if (!confirm(`Delete "${s.name}"? This deletes every category and topic inside it too.`)) return
    try { await api.delete(`/dashboard/fyq/sections/${s.id}/`); notify('Deleted'); load() }
    catch { notify('Failed to delete', 'error') }
  }

  // ── Category actions ──
  const saveCategory = async (payload) => {
    try {
      await api.post('/dashboard/fyq/categories/', { ...payload, section_id: activeSectionId })
      notify('Category added ✓'); setAddingCategory(false); load()
    } catch (e) { notify(errorText(e.response?.data?.error), 'error') }
  }
  const updateCategory = async (payload) => {
    try {
      await api.patch(`/dashboard/fyq/categories/${editing.item.id}/`, payload)
      notify('Category updated ✓'); setEditing(null); load()
    } catch (e) { notify(errorText(e.response?.data?.error), 'error') }
  }
  const deleteCategory = async (c) => {
    if (!confirm(`Delete "${c.name}"? This deletes every topic inside it too.`)) return
    try { await api.delete(`/dashboard/fyq/categories/${c.id}/`); notify('Deleted'); load() }
    catch { notify('Failed to delete', 'error') }
  }

  // ── Topic actions ──
  const saveTopic = async (payload) => {
    try {
      await api.post('/dashboard/fyq/topics/', { ...payload, section_id: activeSectionId, category_id: activeCategoryId || null })
      notify('Topic added ✓'); setAddingTopic(false); load()
    } catch (e) { notify(errorText(e.response?.data?.error), 'error') }
  }
  const updateTopic = async (payload) => {
    try {
      await api.patch(`/dashboard/fyq/topics/${editing.item.id}/`, payload)
      notify('Topic updated ✓'); setEditing(null); load()
    } catch (e) { notify(errorText(e.response?.data?.error), 'error') }
  }
  const deleteTopic = async (t) => {
    if (!confirm(`Delete "${t.name}"? Questions inside it won't be deleted, but will lose their topic.`)) return
    try { await api.delete(`/dashboard/fyq/topics/${t.id}/`); notify('Deleted'); load() }
    catch { notify('Failed to delete', 'error') }
  }

  return (
    <AdminLayout title="FYQ Categories">
    <div style={{ minHeight:'100vh', background:C.off }}>
      <Head><title>FYQ Categories — Admin — GRADSKOOL</title></Head>
      <Toast msg={msg} />

      <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12, padding:'0 32px', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, textDecoration:'none' }}>← Admin</Link>
        <span style={{ color:C.border }}>|</span>
        <Link href="/admin-panel/fyq" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, textDecoration:'none' }}>FYQ Questions</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.black }}>Categories</span>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
        {/* breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, marginBottom:24, flexWrap:'wrap' }}>
          <button onClick={() => { setActiveSectionId(null); setActiveCategoryId(null) }} style={{ background:'none', border:'none', cursor:'pointer', color: activeSectionId ? C.gray : C.black, fontWeight: activeSectionId ? 400 : 600, fontFamily:'var(--font-sans)', fontSize:13, padding:0 }}>
            All Sections
          </button>
          {activeSection && (
            <>
              <span>/</span>
              <button onClick={() => setActiveCategoryId(null)} style={{ background:'none', border:'none', cursor:'pointer', color: activeCategoryId ? C.gray : C.black, fontWeight: activeCategoryId ? 400 : 600, fontFamily:'var(--font-sans)', fontSize:13, padding:0 }}>
                {activeSection.name}
              </button>
            </>
          )}
          {activeCategory && (
            <>
              <span>/</span>
              <span style={{ color:C.black, fontWeight:600 }}>{activeCategory.name}</span>
            </>
          )}
        </div>

        {loading ? (
          <p style={{ fontFamily:'var(--font-sans)', color:C.gray, textAlign:'center', padding:'3rem' }}>Loading…</p>

        /* ── LEVEL 0: Sections ── */
        ) : !activeSection ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
            {sections.map(s => (
              editing?.type === 'section' && editing.item.id === s.id ? (
                <InlineForm key={s.id} initial={s} showHasCategories
                  onSave={updateSection} onCancel={() => setEditing(null)} />
              ) : (
                <Card key={s.id} title={s.name}
                  sub={s.has_categories ? `${(s.categories||[]).length} categories` : `${(s.topics||[]).length} topics`}
                  onClick={() => setActiveSectionId(s.id)}
                  onEdit={() => setEditing({ type:'section', item:s })}
                  onDelete={() => deleteSection(s)} />
              )
            ))}
            {addingSection ? (
              <InlineForm placeholder="e.g. Quants" showHasCategories onSave={saveSection} onCancel={() => setAddingSection(false)} />
            ) : (
              <AddCardButton label="Add Section" onClick={() => setAddingSection(true)} />
            )}
          </div>

        /* ── LEVEL 1: Categories (if section uses them) or Topics directly ── */
        ) : activeSection.has_categories && !activeCategory ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
            {(activeSection.categories || []).map(c => (
              editing?.type === 'category' && editing.item.id === c.id ? (
                <InlineForm key={c.id} initial={c} onSave={updateCategory} onCancel={() => setEditing(null)} />
              ) : (
                <Card key={c.id} title={c.name} sub={`${(c.topics||[]).length} topics`}
                  onClick={() => setActiveCategoryId(c.id)}
                  onEdit={() => setEditing({ type:'category', item:c })}
                  onDelete={() => deleteCategory(c)} />
              )
            ))}
            {addingCategory ? (
              <InlineForm placeholder="e.g. Arithmetic" onSave={saveCategory} onCancel={() => setAddingCategory(false)} />
            ) : (
              <AddCardButton label="Add Category" onClick={() => setAddingCategory(true)} />
            )}
          </div>

        /* ── LEVEL 2: Topics (under a category, or directly under a non-category section) ── */
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
            {(activeCategory ? activeCategory.topics : activeSection.topics || []).map(t => (
              editing?.type === 'topic' && editing.item.id === t.id ? (
                <InlineForm key={t.id} initial={t} onSave={updateTopic} onCancel={() => setEditing(null)} />
              ) : (
                <Card key={t.id} title={t.name} sub={`${t.question_count} question${t.question_count === 1 ? '' : 's'}`}
                  onEdit={() => setEditing({ type:'topic', item:t })}
                  onDelete={() => deleteTopic(t)} />
              )
            ))}
            {addingTopic ? (
              <InlineForm placeholder="e.g. Averages & Mixtures" onSave={saveTopic} onCancel={() => setAddingTopic(false)} />
            ) : (
              <AddCardButton label="Add Topic" onClick={() => setAddingTopic(true)} />
            )}
          </div>
        )}
      </div>
    </div>
  </AdminLayout>
  )
}

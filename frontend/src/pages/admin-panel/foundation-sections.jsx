/**
 * GRADSKOOL Admin — Foundation Sections
 * Route: /admin-panel/foundation-sections
 *
 * Manages topic tags (e.g. "Decision Making") that Foundation classes can
 * be filed under — separate from which series a class belongs to, so
 * students can browse "every class about X" across series and dates.
 * Same card-grid pattern as fyq-categories.jsx, but flat (no nested
 * Section → Category → Topic drill-down — sections here don't nest).
 */
import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import api from '../../lib/api'

const C = {
  red:'#d94f50', black:'#1a1a18', white:'#fff',
  border:'#e6e5e1', gray:'#7a7974', g100:'#f4f3ef', g200:'#e6e5e1', off:'#fafaf8',
}

const EXAM_OPTS = [
  { value:'xat',  label:'XAT' },
  { value:'nmat', label:'NMAT' },
  { value:'snap', label:'SNAP' },
  { value:'cat',  label:'CAT' },
  { value:'gmat', label:'GMAT' },
]

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

function Card({ title, sub, onEdit, onDelete }) {
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:6, background:C.white, padding:'18px 20px', display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:17, color:C.black }}>{title}</div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <button onClick={onEdit} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'3px 8px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer' }}>Edit</button>
          <button onClick={onDelete} style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'3px 8px', border:'1px solid #fca5a5', borderRadius:2, background:C.white, cursor:'pointer', color:C.red }}>✕</button>
        </div>
      </div>
      {sub && <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray }}>{sub}</div>}
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

function SectionForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [exams, setExams] = useState(initial?.exams || [])
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), description, exams, order, is_active: isActive })
    setSaving(false)
  }

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:6, background:C.off, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12, gridColumn:'1 / -1', maxWidth:420 }}>
      <div>
        <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Name</label>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Decision Making" style={inp()} />
      </div>
      <div>
        <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Description (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inp(), resize:'vertical' }} />
      </div>
      <div>
        <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Exams</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, padding:'10px 12px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white }}>
          {EXAM_OPTS.map(e => (
            <label key={e.value} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13 }}>
              <input type="checkbox" checked={exams.includes(e.value)}
                onChange={ev => setExams(x => ev.target.checked ? [...x, e.value] : x.filter(v => v !== e.value))} />
              {e.label}
            </label>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
        <div>
          <label style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:C.gray, display:'block', marginBottom:6 }}>Order</label>
          <input type="number" value={order} onChange={e => setOrder(e.target.value)} min={0} style={inp({ width:70 })} />
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13, paddingBottom:8 }}>
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          Active
        </label>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={submit} disabled={saving || !name.trim()} style={{ fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'7px 16px', background:C.red, color:C.white, border:'none', borderRadius:2, cursor:'pointer', opacity: saving || !name.trim() ? .6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} style={{ fontFamily:'var(--font-sans)', fontSize:12, padding:'7px 16px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function FoundationSectionsAdmin() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const notify = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500) }

  const load = useCallback(() => {
    setLoading(true)
    api.get('/dashboard/foundations/sections/')
      .then(({ data }) => setSections(data))
      .catch(() => setSections([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (payload) => {
    try {
      await api.post('/dashboard/foundations/sections/', payload)
      notify('Section added ✓'); setAdding(false); load()
    } catch (e) { notify(errorText(e.response?.data?.error), 'error') }
  }
  const update = async (id, payload) => {
    try {
      await api.patch(`/dashboard/foundations/sections/${id}/`, payload)
      notify('Section updated ✓'); setEditingId(null); load()
    } catch (e) { notify(errorText(e.response?.data?.error), 'error') }
  }
  const del = async (sec) => {
    if (!confirm(`Delete "${sec.name}"? Classes tagged to it will just become untagged, not deleted.`)) return
    try { await api.delete(`/dashboard/foundations/sections/${sec.id}/`); notify('Deleted'); load() }
    catch { notify('Failed to delete', 'error') }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.off }}>
      <Head><title>Foundation Sections — Admin — GRADSKOOL</title></Head>
      <Toast msg={msg} />

      <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12, padding:'0 32px', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, textDecoration:'none' }}>← Admin</Link>
        <span style={{ color:C.border }}>|</span>
        <Link href="/admin-panel/foundations" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, textDecoration:'none' }}>Foundations</Link>
        <span style={{ color:C.border }}>|</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.black }}>Sections</span>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, marginBottom:24 }}>
          Topic tags classes can be filed under (e.g. "Decision Making", "Quant Basics") — separate from which series a class belongs to. Tag a class to a section when adding or editing it under <Link href="/admin-panel/foundations" style={{ color:C.red }}>Foundations</Link>.
        </p>

        {loading ? (
          <p style={{ fontFamily:'var(--font-sans)', color:C.gray, textAlign:'center', padding:'3rem' }}>Loading…</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
            {sections.map(sec => (
              editingId === sec.id ? (
                <SectionForm key={sec.id} initial={sec} onSave={payload => update(sec.id, payload)} onCancel={() => setEditingId(null)} />
              ) : (
                <Card key={sec.id} title={sec.name}
                  sub={`${(sec.exams||[]).map(e=>e.toUpperCase()).join(', ') || 'No exams'} · ${sec.class_count} classes · ${sec.is_active ? 'Active' : 'Hidden'}`}
                  onEdit={() => setEditingId(sec.id)}
                  onDelete={() => del(sec)} />
              )
            ))}
            {adding ? (
              <SectionForm onSave={save} onCancel={() => setAdding(false)} />
            ) : (
              <AddCardButton label="Add Section" onClick={() => setAdding(true)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
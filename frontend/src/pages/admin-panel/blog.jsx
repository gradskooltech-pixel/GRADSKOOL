/**
 * GRADSKOOL Admin — Blog
 * Route: /admin-panel/blog
 * Create, edit, publish/unpublish blog posts.
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox, DataTable, Badge } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

export default function AdminBlogPage() {
  const [posts, setPosts]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoad]    = useState(true)
  const [filter, setFilter]   = useState('all')  // all | published | draft
  const [editing, setEditing] = useState(null)   // null | 'new' | post object
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null)
  const [form, setForm]       = useState({
    title: '', slug: '', body: '', meta_desc: '', status: 'draft', tags: '',
  })

  const load = useCallback(() => {
    setLoad(true)
    const params = new URLSearchParams({ status: filter !== 'all' ? filter : '' })
    api.get(`/blog/posts/admin/?${params}`)
      .then(({ data }) => { setPosts(data.results || data || []); setTotal(data.count || (data.results || data || []).length) })
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm({ title: '', slug: '', body: '', meta_desc: '', status: 'draft', tags: '' })
    setEditing('new')
  }

  const openEdit = (post) => {
    setForm({
      title:     post.title || '',
      slug:      post.slug  || '',
      body:      post.body  || '',
      meta_desc: post.meta_desc || '',
      status:    post.status || 'draft',
      tags:      (post.tags || []).map(t => t.name || t).join(', '),
    })
    setEditing(post)
  }

  const handleSave = async () => {
    if (!form.title || !form.body) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      if (editing === 'new') {
        await api.post('/blog/posts/', payload)
        setMsg({ type: 'success', text: 'Post created' })
      } else {
        await api.patch(`/blog/posts/${editing.slug}/`, payload)
        setMsg({ type: 'success', text: 'Post updated' })
      }
      setEditing(null)
      load()
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    await api.patch(`/blog/posts/${post.slug}/`, { status: newStatus })
    setMsg({ type: 'success', text: `Post ${newStatus}` })
    load()
  }

  const handleDelete = async (post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    await api.delete(`/blog/posts/${post.slug}/`)
    setMsg({ type: 'success', text: 'Post deleted' })
    load()
  }

  const COLS = [
    { key: 'title',  label: 'Title',   render: r => (
      <div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--black)', marginBottom: '0.1rem' }}>{r.title}</p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gray-400)' }}>/blog/{r.slug}</p>
      </div>
    )},
    { key: 'status', label: 'Status',  render: r => (
      <Badge color={r.status === 'published' ? 'green' : 'yellow'}>{r.status}</Badge>
    )},
    { key: 'words',  label: 'Words',   render: r => r.word_count || '—' },
    { key: 'date',   label: 'Updated', render: r => r.updated_at?.slice(0, 10) || '—' },
    { key: 'actions',label: '',        render: r => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => openEdit(r)} style={s.editBtn}>Edit</button>
        <button onClick={() => handleToggle(r)} style={r.status === 'published' ? s.draftBtn : s.publishBtn}>
          {r.status === 'published' ? 'Unpublish' : 'Publish'}
        </button>
        <button onClick={() => handleDelete(r)} style={s.deleteBtn}>Delete</button>
      </div>
    )},
  ]

  return (
    <AdminLayout title="Blog">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Content</p>
          <h1 style={s.title}>Blog Posts</h1>
        </div>
        <button onClick={openNew} style={s.createBtn}>+ New Post</button>
      </div>

      {msg && (
        <div style={{ ...s.msg, background: msg.type === 'success' ? '#f0fdf4' : '#fff5f5',
          border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: msg.type === 'success' ? '#166534' : '#991b1b' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={s.msgClose}>✕</button>
        </div>
      )}

      <div style={s.filterBtns}>
        {['all', 'published', 'draft'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && ` (${total})`}
          </button>
        ))}
      </div>

      <SectionBox>
        {loading
          ? <div style={s.loading}>Loading…</div>
          : posts.length === 0
            ? <div style={s.empty}>No posts found. <button onClick={openNew} style={s.inlineLink}>Create one →</button></div>
            : <DataTable columns={COLS} rows={posts} />
        }
      </SectionBox>

      {/* Editor slide-over */}
      {editing && (
        <div style={s.overlay}>
          <div style={s.editor}>
            <div style={s.editorHeader}>
              <h2 style={s.editorTitle}>{editing === 'new' ? 'New Post' : 'Edit Post'}</h2>
              <button onClick={() => setEditing(null)} style={s.closeBtn}>✕</button>
            </div>

            <div style={s.editorForm}>
              <div style={s.formRow}>
                <label style={s.label}>Title *</label>
                <input value={form.title}
                  onChange={e => {
                    const title = e.target.value
                    const slug  = editing === 'new'
                      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'')
                      : form.slug
                    setForm(f => ({ ...f, title, slug }))
                  }}
                  style={s.input} placeholder="Post title…" />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Slug</label>
                <input value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  style={s.input} placeholder="url-friendly-slug" />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Meta Description</label>
                <input value={form.meta_desc}
                  onChange={e => setForm(f => ({ ...f, meta_desc: e.target.value }))}
                  style={s.input} placeholder="160 chars for SEO…" />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Tags (comma separated)</label>
                <input value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  style={s.input} placeholder="CAT, Strategy, IIM…" />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Status</label>
                <div style={s.radioGroup}>
                  {[['draft', 'Draft — not visible to students'], ['published', 'Published — live on site']].map(([val, lbl]) => (
                    <label key={val} style={s.radioLabel}>
                      <input type="radio" name="status"
                        checked={form.status === val}
                        onChange={() => setForm(f => ({ ...f, status: val }))} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Body * (Markdown supported)</label>
                <textarea value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  style={s.textarea} rows={20} placeholder="Write your post here…" />
              </div>
              <button onClick={handleSave} disabled={saving || !form.title || !form.body}
                style={s.saveBtn}>
                {saving ? 'Saving…' : editing === 'new' ? 'Create Post →' : 'Save Changes →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' },
  eyebrow: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.25rem' },
  title: { fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--black)' },
  createBtn: { background: 'var(--black)', color: 'var(--white)', border: 'none', padding: '0.7rem 1.25rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' },
  msg: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem' },
  msgClose: { background: 'none', border: 'none', cursor: 'pointer' },
  filterBtns: { display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' },
  filterBtn: { padding: '0.5rem 0.875rem', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', background: 'var(--white)', cursor: 'pointer' },
  filterBtnActive: { background: 'var(--black)', color: 'var(--white)', borderColor: 'var(--black)' },
  loading: { padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--gray-400)' },
  empty: { padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-sans)', color: 'var(--gray-400)' },
  inlineLink: { background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '600' },
  editBtn:    { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer' },
  publishBtn: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#166534', background: '#f0fdf4', border: '1px solid #86efac', padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer' },
  draftBtn:   { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#92400e', background: '#fef9c3', border: '1px solid #fde68a', padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer' },
  deleteBtn:  { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#991b1b', background: '#fff5f5', border: '1px solid #fca5a5', padding: '0.2rem 0.5rem', borderRadius: '3px', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' },
  editor: { width: '600px', height: '100%', background: 'var(--white)', overflowY: 'auto', padding: '2rem', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--white)', paddingBottom: '1rem', borderBottom: '1px solid var(--gray-100)' },
  editorTitle: { fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--black)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--gray-400)' },
  editorForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formRow: {},
  label: { fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: '600', color: 'var(--gray-700)', display: 'block', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.6rem 0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.75rem', fontFamily: 'var(--font-serif)', fontSize: '0.9rem', lineHeight: '1.7', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  radioLabel: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  saveBtn: { width: '100%', padding: '0.8rem', background: 'var(--black)', color: 'var(--white)', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' },
}

/**
 * GRADSKOOL Admin — Blog CMS (Rich Text Editor)
 * Route: /admin-panel/blog-manage
 *
 * Editor: Quill.js (loaded from CDN — no npm install needed)
 * Features: H1/H2/H3 · Bold/Italic/Underline · Lists · Blockquote
 *           Code block · Links · Images (paste Bunny CDN URL) · Clean
 *
 * Flow: List posts → click Edit (or New Post) → full editor opens
 * Saving: POST (new) or PATCH (existing) to /dashboard/blog/
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Script from 'next/script'
import Link from 'next/link'
import api from '../../lib/api'
import { AdminLayout } from '../../components/admin/AdminLayout'

/* ── design tokens ── */
const C = {
  red:'#d94f50', black:'#1a1a18', white:'#fff', bg:'#fafaf8',
  border:'#e6e5e1', gray:'#7a7974', g100:'#f4f3ef', g200:'#e6e5e1',
}

const TAGS_LIST = [
  // Blog tags
  'CAT','CAT Strategy','VARC','DILR','QA',
  'GMAT','XAT','SNAP','NMAT','MHCET',
  'IIM','Placements','MBA Abroad','Mindset','PI WAT GD',
  // Foundations — tag with these to appear in /foundations/xat etc.
  'foundations-xat','foundations-nmat','foundations-snap',
]

const TAG_GROUPS = [
  { label:'Blog', tags:['CAT','CAT Strategy','VARC','DILR','QA','GMAT','XAT','SNAP','NMAT','MHCET','IIM','Placements','MBA Abroad','Mindset','PI WAT GD'] },
  { label:'Foundations (free classes)', tags:['foundations-xat','foundations-nmat','foundations-snap'] },
]

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
function BlogManageInner() {
  const [view,    setView]    = useState('list')      // 'list' | 'editor'
  const [posts,   setPosts]   = useState([])
  const [loading, setLoad]    = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [resubmitting, setResubmitting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [msg,     setMsg]     = useState(null)
  const [editSlug,setEditSlug]= useState(null)        // null = new post
  const [form,    setForm]    = useState(emptyForm())
  const quillRef  = useRef(null)
  const editorDiv = useRef(null)

  /* ── load posts ── */
  const loadPosts = useCallback(() => {
    setLoad(true)
    api.get('/dashboard/blog/')
      .then(({ data }) => setPosts(data.posts || data.results || data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoad(false))
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  const notify = (text, type='success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3500)
  }

  const [quillLoadFailed, setQuillLoadFailed] = useState(false)

  /* ── init Quill when editor view is shown ── */
  useEffect(() => {
    if (view !== 'editor') return
    if (typeof window === 'undefined') return

    setQuillLoadFailed(false)
    let attempts = 0

    const init = () => {
      if (!window.Quill) {
        attempts += 1
        // Previously polled forever with zero feedback if the CDN script
        // never actually loaded — the editor area just stayed permanently
        // blank with nothing telling you why. ~4s of retries (80ms * 50)
        // is generous for a CDN script that's genuinely just slow; past
        // that, something is actually wrong and staying silent about it
        // just wastes the admin's time wondering what's broken.
        if (attempts > 50) { setQuillLoadFailed(true); return }
        setTimeout(init, 80)
        return
      }
      if (quillRef.current) return   // already running

      const q = new window.Quill('#gs-blog-editor-body', {
        theme: 'snow',
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              ['blockquote', 'code-block'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ align: [] }],
              ['link', 'image'],
              ['clean'],
            ],
            handlers: {
              image: () => {
                const url = prompt('Paste Bunny CDN image URL:')
                if (!url) return
                const range = q.getSelection() || { index: 0 }
                q.insertEmbed(range.index, 'image', url)
              },
            },
          },
        },
        placeholder: 'Write your blog post here…\n\nUse the toolbar above for headings, bold, lists, links, and images.',
      })

      // Load existing content into editor
      if (form.body) {
        q.root.innerHTML = form.body
      }

      // Sync editor → form state on every keystroke
      q.on('text-change', () => {
        const html = q.root.innerHTML
        setForm(f => ({ ...f, body: html === '<p><br></p>' ? '' : html }))
      })

      quillRef.current = q
    }

    init()

    // Destroy Quill when leaving editor view
    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
    }
  }, [view])

  /* ── open editor for new post ── */
  const openNew = () => {
    quillRef.current = null
    setForm(emptyForm())
    setEditSlug(null)
    setView('editor')
  }

  /* ── open editor for existing post ── */
  const openEdit = async (slug) => {
    try {
      const { data } = await api.get(`/dashboard/blog/${slug}/`)
      quillRef.current = null
      setForm({
        title:            data.title            || '',
        slug:             data.slug             || '',
        excerpt:          data.excerpt          || '',
        body:             data.body             || '',
        tags:             data.tags             || [],
        og_image_url:         data.og_image_url         || '',
        thumbnail_video_url:  data.thumbnail_video_url  || '',
        meta_title:       data.meta_title       || '',
        // Was meta_description — the actual model field (and every
        // backend view touching it) is meta_desc. Same root cause as the
        // slug and thumbnail_video_url bugs fixed earlier: whatever you
        // typed here was silently discarded on save (backend's fields
        // list only checked for 'meta_desc'), and loading an existing
        // post for editing showed it as blank even when a value existed
        // in the database, since the GET response returns meta_desc but
        // this was reading data.meta_description.
        meta_desc: data.meta_desc || '',
        // Was is_published (boolean) — the actual model field, and every
        // API response, is `status` ('draft'|'published'), not a boolean.
        // Meant is_published was always undefined here, always defaulting
        // to false — every post opened for editing showed as "Draft" in
        // the UI regardless of its real, saved status.
        status:           data.status            || 'draft',
        is_featured:      data.is_featured      ?? false,
        related_posts:    (data.related_posts || []).map(p => p.slug),
      })
      setEditSlug(slug)
      setView('editor')
    } catch {
      notify('Failed to load post', 'error')
    }
  }

  /* ── save post ── */
  const save = async (publish) => {
    if (!form.title.trim()) { notify('Title is required', 'error'); return }
    if (!form.body.trim() || form.body === '<p><br></p>') { notify('Body cannot be empty', 'error'); return }

    setSaving(true)
    const payload = {
      ...form,
      slug:   form.slug || slugify(form.title),
      // Was is_published: publish ?? form.is_published — the backend's
      // PATCH/POST handlers only ever check request.data['status'], never
      // 'is_published', so this was silently ignored on every single
      // save. Both buttons always call save() with an explicit true/false
      // (see onClick handlers below), so the ?? fallback was dead code
      // regardless — simplified along with the field-name fix.
      status: publish ? 'published' : 'draft',
    }
    try {
      if (editSlug) {
        await api.patch(`/dashboard/blog/${editSlug}/`, payload)
        notify(publish ? 'Published ✓' : 'Saved ✓')
      } else {
        await api.post('/dashboard/blog/', payload)
        notify(publish ? 'Published ✓' : 'Draft saved ✓')
      }
      quillRef.current = null
      setView('list')
      loadPosts()
    } catch (e) {
      notify(e.response?.data?.error || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── delete ── */
  const del = async (slug) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    try {
      await api.delete(`/dashboard/blog/${slug}/`)
      notify('Post deleted')
      loadPosts()
    } catch {
      notify('Failed to delete', 'error')
    }
  }

  /* ── quick toggle publish ── */
  const togglePublish = async (post) => {
    try {
      // Was { is_published: !post.is_published } — post.is_published was
      // always undefined (list endpoint returns `status`, not
      // is_published), so this always sent `true`, and the backend PATCH
      // handler ignored it anyway since it only checks `status`. Net
      // effect: this button silently did nothing, ever.
      const newStatus = post.status === 'published' ? 'draft' : 'published'
      await api.patch(`/dashboard/blog/${post.slug}/`, { status: newStatus })
      loadPosts()
    } catch {
      notify('Failed', 'error')
    }
  }

  /* ── manual IndexNow resubmit (Bing/Yandex etc — not Google, see
     backend shared/utils.py for why) — publishing a post already triggers
     this automatically; this button is for bulk situations, e.g. right
     after a deploy that changed a lot of pages at once. ── */
  const resubmitToIndexNow = async () => {
    setResubmitting(true)
    try {
      const { data } = await api.post('/dashboard/indexnow/resubmit/')
      if (data.success) {
        notify(`Submitted ${data.url_count} URLs to IndexNow ✓`)
      } else {
        notify('IndexNow submission failed — check server logs', 'error')
      }
    } catch (e) {
      notify(e.response?.data?.error || 'Failed to resubmit', 'error')
    } finally {
      setResubmitting(false)
    }
  }

  /* ── import a .md file → new draft post ──
     A separate entry point INTO the editor (mirroring openNew, not a
     mid-edit action) — Quill only reads form.body into the visible
     editor once, at initial mount (see the init effect above), so
     pre-filling the form BEFORE the editor view ever mounts is what
     makes the imported content actually show up correctly, rather than
     needing to force a fragile re-init. Always lands as a Draft — never
     auto-publishes, review/edit normally before hitting Publish. */
  const importFromMarkdown = async () => {
    if (!importText.trim()) { notify('Paste or upload a markdown file first', 'error'); return }
    setImporting(true)
    try {
      const { data } = await api.post('/dashboard/blog/import-markdown/', { markdown: importText })
      quillRef.current = null
      setForm({ ...emptyForm(), title: data.title, slug: data.slug, excerpt: data.excerpt, body: data.body })
      setEditSlug(null)
      setShowImportModal(false)
      setImportText('')
      setView('editor')
      notify('Imported — review before publishing ✓')
    } catch (e) {
      notify(e.response?.data?.error || 'Import failed', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleImportFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setImportText(e.target.result)
    reader.readAsText(file)
  }

  /* ── image upload to Bunny ── */
  const uploadImage = async (file) => {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await api.post('/dashboard/blog/upload-image/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data.url && quillRef.current) {
        const range = quillRef.current.getSelection() || { index: 0 }
        quillRef.current.insertEmbed(range.index, 'image', data.url)
        notify('Image inserted ✓')
      }
    } catch {
      notify('Image upload failed — paste Bunny CDN URL instead', 'error')
    }
  }

  const set = (key) => (e) => {
    const val = e.target ? e.target.value : e
    setForm(f => ({
      ...f,
      [key]: val,
      ...(key === 'title' && !f._slugEdited ? { slug: slugify(val) } : {}),
    }))
  }

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
  }

  /* ══════════════════════════════════════════════
     RENDER — LIST VIEW
  ══════════════════════════════════════════════ */
  if (view === 'list') {
    return (
      <div style={{ minHeight:'100vh', background:C.bg }}>
        <Head>
          <title>Blog — Admin — GRADSKOOL</title>
        </Head>

        {msg && <Toast msg={msg} />}

        {/* header */}
        <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, zIndex:100 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Link href="/admin-panel" style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, textDecoration:'none' }}>← Admin</Link>
            <span style={{ color:C.border }}>|</span>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.black }}>Blog</span>
            <span style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray, background:C.g100, padding:'2px 8px', borderRadius:2 }}>{posts.length} posts</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={resubmitToIndexNow} disabled={resubmitting}
              title="Notify Bing/Yandex/etc of every URL in the sitemap — Google doesn't participate in this protocol"
              style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, padding:'8px 16px', background:C.white, color:C.black, border:`1px solid ${C.border}`, borderRadius:2, cursor:resubmitting?'not-allowed':'pointer' }}>
              {resubmitting ? 'Submitting…' : 'Resubmit to IndexNow'}
            </button>
            <button onClick={() => setShowImportModal(true)}
              style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, padding:'8px 16px', background:C.white, color:C.black, border:`1px solid ${C.border}`, borderRadius:2, cursor:'pointer' }}>
              Import from Markdown
            </button>
            <button onClick={openNew}
              style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'8px 20px', background:C.red, color:'#fff', border:'none', borderRadius:2, cursor:'pointer' }}>
              + New Post
            </button>
          </div>
        </div>

        <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
          {loading ? (
            <p style={{ textAlign:'center', color:C.gray, fontFamily:'var(--font-sans)', padding:'4rem' }}>Loading posts…</p>
          ) : posts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'5rem', background:C.white, border:`1px dashed ${C.border}`, borderRadius:4 }}>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:15, color:C.gray, marginBottom:20 }}>No blog posts yet.</p>
              <button onClick={openNew}
                style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'10px 24px', background:C.red, color:'#fff', border:'none', borderRadius:2, cursor:'pointer' }}>
                Write your first post →
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:1, background:C.border, border:`1px solid ${C.border}`, borderRadius:4, overflow:'hidden' }}>
              {/* table header */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 80px 80px 120px', gap:12, padding:'10px 20px', background:C.g100, fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:C.gray }}>
                {['Title','Tags','Status','Featured','Actions'].map(h => <span key={h}>{h}</span>)}
              </div>
              {posts.map(post => (
                <div key={post.slug} style={{ display:'grid', gridTemplateColumns:'1fr 110px 80px 80px 120px', gap:12, padding:'14px 20px', background:C.white, alignItems:'center' }}>
                  {/* title */}
                  <div>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.black, marginBottom:3 }}>{post.title}</div>
                    <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray }}>/{post.slug}</div>
                  </div>
                  {/* tags */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                    {/* post.tags is an array of tag OBJECTS ({id, name, slug,
                        post_count} — see BlogTagSerializer), not plain
                        strings. Rendering `t` directly crashed with React
                        error #31 ("Objects are not valid as a React child")
                        on every page load — pre-existing bug, not something
                        from recent changes; just hadn't been hit/reported
                        before now. */}
                    {(post.tags || []).slice(0,3).map(t => (
                      <span key={t.id} style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:2, background:'#fff5f5', color:C.red }}>{t.name}</span>
                    ))}
                  </div>
                  {/* status */}
                  <button onClick={() => togglePublish(post)}
                    style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:2, border:'none', cursor:'pointer',
                      background: post.status === 'published' ? '#dcfce7' : C.g100,
                      color: post.status === 'published' ? '#166534' : C.gray }}>
                    {post.status === 'published' ? 'Live' : 'Draft'}
                  </button>
                  {/* featured */}
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:18, textAlign:'center', cursor:'pointer', color: post.is_featured ? '#f59e0b' : C.border }}
                    onClick={() => api.patch(`/dashboard/blog/${post.slug}/`, { is_featured: !post.is_featured }).then(loadPosts)}>
                    ★
                  </span>
                  {/* actions */}
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openEdit(post.slug)}
                      style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:600, padding:'5px 12px', border:`1px solid ${C.border}`, borderRadius:2, cursor:'pointer', background:C.white }}>
                      Edit
                    </button>
                    <button onClick={() => del(post.slug)}
                      style={{ fontFamily:'var(--font-sans)', fontSize:11, padding:'5px 10px', border:`1px solid #fca5a5`, borderRadius:2, cursor:'pointer', background:C.white, color:C.red }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showImportModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => !importing && setShowImportModal(false)}>
            <div style={{ background:C.white, borderRadius:4, padding:'28px 32px', maxWidth:560, width:'100%', maxHeight:'85vh', display:'flex', flexDirection:'column' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:16, fontWeight:700, color:C.black, marginBottom:6 }}>
                Import from Markdown
              </div>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:12, color:C.gray, marginBottom:16, lineHeight:1.5 }}>
                The file's first <code># Heading</code> becomes the title. Tables, bold/italic, and links are all supported.
                Lands as a <strong>Draft</strong> — nothing publishes automatically, review it in the editor first.
              </p>
              <input type="file" accept=".md,.markdown,text/markdown,text/plain"
                onChange={e => handleImportFile(e.target.files[0])}
                style={{ fontFamily:'var(--font-sans)', fontSize:12, marginBottom:12 }} />
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="…or paste the markdown content directly"
                rows={12}
                style={{ fontFamily:'ui-monospace, monospace', fontSize:12, padding:12, border:`1px solid ${C.border}`, borderRadius:2, resize:'vertical', width:'100%', boxSizing:'border-box', flex:1 }}
              />
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
                <button onClick={() => { setShowImportModal(false); setImportText('') }} disabled={importing}
                  style={{ fontFamily:'var(--font-sans)', fontSize:13, padding:'8px 16px', background:C.white, color:C.black, border:`1px solid ${C.border}`, borderRadius:2, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={importFromMarkdown} disabled={importing}
                  style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'8px 20px', background:C.red, color:'#fff', border:'none', borderRadius:2, cursor:importing?'not-allowed':'pointer' }}>
                  {importing ? 'Importing…' : 'Import & Review →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ══════════════════════════════════════════════
     RENDER — EDITOR VIEW
  ══════════════════════════════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <Head>
        <title>{editSlug ? 'Edit Post' : 'New Post'} — Blog Admin — GRADSKOOL</title>
        {/* Quill CSS */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css" />
      </Head>

      {/* Quill JS — next/script instead of a raw <script> tag in JSX.
          Raw script tags rendered via React are unreliable for actually
          triggering execution (this is a known Next.js/React gotcha,
          not specific to this file) — if it silently never ran,
          window.Quill never became defined, and the init() polling loop
          above just spun forever with zero visible feedback that
          anything was wrong. next/script is Next.js's own mechanism
          specifically built to load third-party scripts reliably. */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js" strategy="afterInteractive" />

      {/* Quill custom styles matching GRADSKOOL design */}
      <style>{`
        #gs-blog-editor .ql-toolbar.ql-snow {
          border: 1px solid ${C.border};
          border-bottom: none;
          border-radius: 3px 3px 0 0;
          padding: 8px 12px;
          background: #fff;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        #gs-blog-editor .ql-container.ql-snow {
          border: 1px solid ${C.border};
          border-radius: 0 0 3px 3px;
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 16px;
        }
        #gs-blog-editor .ql-editor {
          min-height: 500px;
          padding: 24px 28px;
          line-height: 1.85;
          color: ${C.black};
        }
        #gs-blog-editor .ql-editor h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 32px; margin-bottom: 16px; }
        #gs-blog-editor .ql-editor h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; margin: 28px 0 12px; }
        #gs-blog-editor .ql-editor h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 21px; margin: 22px 0 10px; }
        #gs-blog-editor .ql-editor p  { margin-bottom: 14px; }
        #gs-blog-editor .ql-editor a  { color: ${C.red}; }
        #gs-blog-editor .ql-editor blockquote {
          border-left: 3px solid ${C.red};
          padding-left: 18px;
          color: ${C.gray};
          font-style: italic;
          margin: 20px 0;
        }
        #gs-blog-editor .ql-editor pre.ql-syntax {
          background: ${C.g100};
          border: 1px solid ${C.border};
          border-radius: 3px;
          padding: 14px 18px;
          font-size: 13px;
          color: ${C.black};
        }
        #gs-blog-editor .ql-editor img {
          max-width: 100%;
          border-radius: 3px;
          margin: 16px 0;
        }
        #gs-blog-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: ${C.gray};
          font-family: 'Source Serif 4', Georgia, serif;
        }
        #gs-blog-editor .ql-snow .ql-picker-label { font-family: 'DM Sans', system-ui, sans-serif; }
        #gs-blog-editor .ql-snow.ql-toolbar button:hover,
        #gs-blog-editor .ql-snow .ql-toolbar button:hover { color: ${C.red}; }
        #gs-blog-editor .ql-snow .ql-stroke { stroke: #4a4946; }
        #gs-blog-editor .ql-snow button:hover .ql-stroke { stroke: ${C.red}; }
        #gs-blog-editor .ql-snow .ql-active .ql-stroke { stroke: ${C.red}; }
      `}</style>

      {msg && <Toast msg={msg} />}

      {/* ── top bar ── */}
      <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => { quillRef.current = null; setView('list') }}
            style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, background:'none', border:'none', cursor:'pointer', padding:0 }}>
            ← All posts
          </button>
          <span style={{ color:C.border }}>|</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.black }}>
            {editSlug ? 'Edit Post' : 'New Post'}
          </span>
          {form.status === 'published' && (
            <span style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:2, background:'#dcfce7', color:'#166534' }}>Live</span>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => save(false)} disabled={saving}
            style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500, padding:'8px 18px', border:`1px solid ${C.border}`, borderRadius:2, background:C.white, cursor:saving?'not-allowed':'pointer', color:C.black }}>
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          <button onClick={() => save(true)} disabled={saving}
            style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'8px 22px', background:C.red, color:'#fff', border:'none', borderRadius:2, cursor:saving?'not-allowed':'pointer' }}>
            {saving ? 'Publishing…' : form.status === 'published' ? 'Update live' : 'Publish →'}
          </button>
        </div>
      </div>

      {/* ── editor layout ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', maxWidth:1200, margin:'0 auto', padding:'32px 24px', gap:28, alignItems:'start' }}>

        {/* ── MAIN: title + editor ── */}
        <div>
          {/* Title */}
          <input
            value={form.title}
            onChange={e => {
              const title = e.target.value
              setForm(f => ({ ...f, title, slug: slugify(title) }))
            }}
            placeholder="Post title"
            style={{ width:'100%', fontFamily:'Playfair Display, Georgia, serif', fontSize:28, fontWeight:400, color:C.black, border:'none', background:'transparent', outline:'none', marginBottom:8, lineHeight:1.3, padding:0 }}
          />
          {/* Slug */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:24, fontFamily:'var(--font-sans)', fontSize:12 }}>
            <span style={{ color:C.gray }}>gradskool.in/blog/</span>
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value, _slugEdited: true }))}
              style={{ flex:1, fontFamily:'var(--font-sans)', fontSize:12, color:C.gray, border:`1px solid ${C.border}`, borderRadius:2, padding:'3px 8px', background:C.white, outline:'none', maxWidth:320 }}
            />
          </div>

          {/* ── QUILL EDITOR ── */}
          {quillLoadFailed ? (
            <div style={{ padding:'32px 24px', textAlign:'center', border:`1px dashed ${C.red}`, borderRadius:3, background:'#fff5f5' }}>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, color:C.red, marginBottom:6 }}>
                Editor failed to load
              </div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray, marginBottom:14 }}>
                The Quill editor script didn't load from the CDN. Check your connection, or an ad-blocker/extension may be blocking cdnjs.cloudflare.com.
              </div>
              <button onClick={() => window.location.reload()}
                style={{ fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, padding:'8px 18px', background:C.red, color:'#fff', border:'none', borderRadius:2, cursor:'pointer' }}>
                Reload page
              </button>
            </div>
          ) : (
            <div id="gs-blog-editor">
              <div id="quill-toolbar" />
              <div id="gs-blog-editor-body" />
            </div>
          )}

          {/* Image upload */}
          <div style={{ marginTop:12 }}>
            <label
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'14px 20px', border:`2px dashed ${C.border}`, borderRadius:3, background:C.g100, cursor:'pointer', transition:'border-color .15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='#d94f50'}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='#d94f50'}}
              onDragLeave={e=>e.currentTarget.style.borderColor=C.border}
              onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor=C.border;const f=e.dataTransfer.files[0];if(f)uploadImage(f)}}>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:13, color:C.gray }}>↑ Click or drag image to upload</span>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'#cccbc7' }}>JPEG · PNG · WEBP · GIF · max 5MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display:'none' }} onChange={e => uploadImage(e.target.files[0])} />
            </label>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, marginTop:6 }}>
              Image is uploaded to Bunny Storage and inserted at cursor position in the editor.
              Use the 🖼 toolbar button to insert by URL instead.
            </p>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Status */}
          <SideBox label="Status">
            <div style={{ display:'flex', gap:6 }}>
              {[['Draft', 'draft'],['Published', 'published']].map(([label, val]) => (
                <button key={label} onClick={() => setForm(f => ({ ...f, status: val }))}
                  style={{ flex:1, fontFamily:'var(--font-sans)', fontSize:12, fontWeight:600, padding:'8px', border:`1px solid ${form.status === val ? C.red : C.border}`, borderRadius:2, background: form.status === val ? '#fff5f5' : C.white, color: form.status === val ? C.red : C.gray, cursor:'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
          </SideBox>

          {/* Excerpt */}
          <SideBox label="Excerpt" hint="Shown on blog listing + SEO description if meta desc is blank">
            <textarea
              value={form.excerpt}
              onChange={set('excerpt')}
              rows={3}
              placeholder="One or two sentences summarising the post…"
              style={sideInput}
            />
          </SideBox>

          {/* Tags */}
          <SideBox label="Tags">
            {TAG_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom:10 }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, letterSpacing:'.07em', textTransform:'uppercase', color:'#aaa', marginBottom:5 }}>{group.label}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {group.tags.map(tag => {
                    const active = form.tags.includes(tag)
                    const isFoundation = tag.startsWith('foundations-')
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:active?700:400, padding:'3px 8px',
                          border:`1px solid ${active ? (isFoundation ? '#1a6e3c' : C.red) : C.border}`,
                          borderRadius:2,
                          background: active ? (isFoundation ? '#dcfce7' : '#fff5f5') : C.white,
                          color: active ? (isFoundation ? '#166534' : C.red) : C.gray,
                          cursor:'pointer' }}>
                        {isFoundation ? tag.replace('foundations-','') + ' (foundations)' : tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <p style={{ fontFamily:'var(--font-sans)', fontSize:10, color:C.gray, marginTop:4, lineHeight:1.5 }}>
              Tag with foundations-xat/nmat/snap to publish under /foundations/[exam]
            </p>
          </SideBox>

          {/* Related Articles — manual picks take priority over automatic
              tag-matching on the public page (see pages/blog/[slug].jsx);
              leave empty to fall back to automatic. Reuses the `posts`
              list already loaded for the main table (loadPosts()) instead
              of firing a new search request per keystroke. */}
          <SideBox label="Related Articles" hint="Shown in 'More Articles' sidebar">
            <RelatedPostsPicker
              allPosts={posts}
              currentSlug={editSlug}
              selected={form.related_posts}
              onChange={(slugs) => setForm(f => ({ ...f, related_posts: slugs }))}
            />
            <p style={{ fontFamily:'var(--font-sans)', fontSize:10, color:C.gray, marginTop:4, lineHeight:1.5 }}>
              Leave empty to automatically show other posts with a matching exam tag instead.
            </p>
          </SideBox>

          {/* OG Image */}
          <SideBox label="OG / Hero Image URL" hint="Bunny CDN URL">
            <input
              value={form.og_image_url}
              onChange={set('og_image_url')}
              placeholder="https://cdn.gradskool.in/images/..."
              style={sideInput}
            />
            {form.og_image_url && (
              <img src={form.og_image_url} alt="OG preview"
                style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', borderRadius:3, marginTop:8, border:`1px solid ${C.border}` }}
                onError={e => e.target.style.display='none'}
              />
            )}
          </SideBox>

          {/* SEO */}
          <SideBox label="SEO" hint="Leave blank to use title & excerpt">
            <input value={form.meta_title} onChange={set('meta_title')} placeholder="SEO title (60 chars)" style={{ ...sideInput, marginBottom:6 }} />
            <textarea value={form.meta_desc} onChange={set('meta_desc')} rows={2} placeholder="Meta description (160 chars)" style={sideInput} />
            {form.meta_title && (
              <div style={{ marginTop:8, padding:10, background:C.g100, borderRadius:3 }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'#1a0dab', fontWeight:500 }}>{form.meta_title}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'#006621' }}>gradskool.in/blog/{form.slug}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, color:C.gray, marginTop:2 }}>{form.meta_desc || form.excerpt}</div>
              </div>
            )}
          </SideBox>

          {/* Thumbnail Video */}
          <SideBox label="Thumbnail Video" hint="YouTube or Bunny Stream URL">
            <input
              value={form.thumbnail_video_url}
              onChange={set('thumbnail_video_url')}
              placeholder="https://youtu.be/... or Bunny URL"
              style={sideInput}
            />
            {form.thumbnail_video_url && (
              <div style={{ marginTop:8, borderRadius:3, overflow:'hidden', border:`1px solid ${C.border}` }}>
                {getVideoEmbed(form.thumbnail_video_url)}
              </div>
            )}
            <p style={{ fontFamily:'var(--font-sans)', fontSize:10, color:C.gray, marginTop:6, lineHeight:1.5 }}>
              When set, this video renders as the article hero and thumbnail on the blog listing instead of the static OG image.
            </p>
          </SideBox>

          {/* Featured */}
          <SideBox label="Featured">
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13 }}>
              <input type="checkbox" checked={!!form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
              Show on homepage blog section
            </label>
          </SideBox>

        </div>
      </div>
    </div>
  )
}

/* ── helpers ── */

function getVideoEmbed(url) {
  if (!url) return null

  // YouTube — youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID,
  // or /live/ID (live-stream URLs — a real, increasingly common format
  // this regex never covered, which is why a valid YouTube Live link
  // fell all the way through to the raw-link fallback below instead of
  // rendering an embed. Same gap already fixed once this session in
  // components/foundations/FoundationsListing.jsx's YTThumb — that was a
  // separate regex in a different file, never carried over to this one).
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytMatch[1]}`}
        style={{ width:'100%', aspectRatio:'16/9', border:'none', display:'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video preview"
      />
    )
  }

  // Bunny Stream — iframe.mediadelivery.net or b-cdn.net
  if (url.includes('mediadelivery.net') || url.includes('b-cdn.net')) {
    const embedUrl = url.includes('/embed/') ? url : url.replace('stream.', 'iframe.')
    return (
      <iframe
        src={embedUrl}
        style={{ width:'100%', aspectRatio:'16/9', border:'none', display:'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video preview"
      />
    )
  }

  // Direct mp4 / video file
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video controls style={{ width:'100%', aspectRatio:'16/9', display:'block', background:'#000' }}>
        <source src={url} />
      </video>
    )
  }

  // Unknown — show as link
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'#d94f50', display:'block', padding:'8px', wordBreak:'break-all' }}>
      {url}
    </a>
  )
}

function emptyForm() {
  return { title:'', slug:'', excerpt:'', body:'', tags:[], og_image_url:'', thumbnail_video_url:'', meta_title:'', meta_desc:'', status:'draft', is_featured:false, related_posts:[] }
}

function SideBox({ label, hint, children }) {
  return (
    <div style={{ background:'#fff', border:`1px solid #e6e5e1`, borderRadius:3, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#7a7974' }}>{label}</span>
        {hint && <span style={{ fontFamily:'var(--font-sans)', fontSize:10, color:'#cccbc7' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function RelatedPostsPicker({ allPosts, currentSlug, selected, onChange }) {
  const [query, setQuery] = useState('')

  const selectedPosts = selected
    .map(slug => (allPosts || []).find(p => p.slug === slug))
    .filter(Boolean)

  const results = query.trim()
    ? (allPosts || [])
        .filter(p => p.slug !== currentSlug && !selected.includes(p.slug))
        .filter(p => p.title.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : []

  return (
    <div>
      {selectedPosts.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:8 }}>
          {selectedPosts.map(p => (
            <div key={p.slug} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'5px 8px', background:'#fff5f5', border:'1px solid #ffd0d0', borderRadius:2 }}>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:11, color:'#0f0f0f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</span>
              <button
                onClick={() => onChange(selected.filter(s => s !== p.slug))}
                style={{ flexShrink:0, border:'none', background:'transparent', color:'#999', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}
                title="Remove">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search posts by title…"
        style={{ width:'100%', fontFamily:'var(--font-sans)', fontSize:12, padding:'7px 10px', border:'1px solid #e6e5e1', borderRadius:2, outline:'none', boxSizing:'border-box' }}
      />
      {results.length > 0 && (
        <div style={{ marginTop:4, border:'1px solid #e6e5e1', borderRadius:2, overflow:'hidden' }}>
          {results.map(p => (
            <button
              key={p.slug}
              onClick={() => { onChange([...selected, p.slug]); setQuery('') }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 10px', border:'none', borderBottom:'1px solid #f0f0ee', background:'#fff', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:12, color:'#0f0f0f' }}>
              {p.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Toast({ msg }) {
  return (
    <div style={{ position:'fixed', top:68, right:24, zIndex:999, padding:'10px 18px', borderRadius:3, fontFamily:'var(--font-sans)', fontSize:13, fontWeight:500,
      background: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
      border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#86efac'}`,
      color: msg.type === 'error' ? '#991b1b' : '#166534',
      boxShadow: '0 4px 16px rgba(0,0,0,.1)',
    }}>
      {msg.text}
    </div>
  )
}

const sideInput = {
  width: '100%',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: '#1a1a18',
  border: '1px solid #e6e5e1',
  borderRadius: 2,
  padding: '7px 10px',
  background: '#fff',
  outline: 'none',
  resize: 'vertical',
  boxSizing: 'border-box',
}


export default function BlogManage(props) {
  return (
    <AdminLayout title="Blog CMS">
      <BlogManageInner {...props} />
    </AdminLayout>
  )
}
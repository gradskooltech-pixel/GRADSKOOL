/**
 * GRADSKOOL Admin — Topic-wise Question Manager
 * Route: /admin-panel/mocks/topic/[id]
 *
 * This topic's OWN question pool — authored directly here (Paste & Split
 * or single add), separate from any Mock/Sectional paper's questions.
 * Only standalone MCQ/TITA items — no RC/DILR passages (those belong to
 * a Sectional/Mock section instead).
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AdminLayout } from '../../../../components/admin/AdminLayout'
import { SectionBox } from '../../../../components/admin/AdminPrimitives'
import api from '../../../../lib/api'

const s = {
  eyebrow: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.2rem' },
  title: { fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: '700', color: 'var(--black)' },
  btn: { background: 'var(--black)', color: 'var(--white)', border: 'none', padding: '0.6rem 1rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' },
  btnGhost: { background: 'var(--white)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)', padding: '0.6rem 1rem', borderRadius: '3px', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' },
  textarea: { width: '100%', minHeight: '260px', fontFamily: "'SF Mono',monospace", fontSize: '0.8rem', padding: '0.875rem', border: '1px solid var(--gray-200)', borderRadius: '4px', boxSizing: 'border-box', lineHeight: 1.6 },
  input: { padding: '0.5rem 0.7rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', border: '1px solid var(--gray-200)', borderRadius: '3px', width: '100%', boxSizing: 'border-box' },
  qCard: { background: 'var(--white)', border: '1px solid var(--gray-100)', borderRadius: '6px', padding: '1rem 1.25rem', marginBottom: '0.75rem' },
  chip: { fontFamily: 'var(--font-sans)', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '100px', background: 'var(--gray-100)', color: 'var(--gray-600)', marginRight: '0.3rem' },
}

const HELP_TEXT = `[STANDALONE]
Q1. question text
A) option
B) option
C) option
D) option
ANS: B
EXP: explanation

[STANDALONE]
Q2. TITA - question text
TITA: 42
EXP: ...

(No PASSAGE blocks here — RC/DILR sets belong to a Sectional/Mock section, not a topic-wise drill. Any pasted in will be skipped.)`

export default function MockTopicManage() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPaste, setShowPaste] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [msg, setMsg] = useState(null)
  const [editingQ, setEditingQ] = useState(null)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    api.get(`/dashboard/mocks/topics/${id}/questions/`).then(({ data }) => setData(data)).finally(() => setLoading(false))
  }, [id])
  useEffect(() => { load() }, [load])

  if (loading || !data) return <AdminLayout title="Topic"><p style={{ padding: '2rem', color: 'var(--gray-400)' }}>Loading…</p></AdminLayout>

  const { topic, standalones } = data

  return (
    <AdminLayout title={topic.name}>
      <Link href="/admin-panel/mocks/topics" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--gray-500)', textDecoration: 'none' }}>← Topics</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '0.75rem 0 1.5rem' }}>
        <div>
          <p style={s.eyebrow}>{topic.section_name} — Topic-wise</p>
          <h1 style={s.title}>{topic.name}</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--gray-500)' }}>{standalones.length} question{standalones.length === 1 ? '' : 's'} in this topic's own pool</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowAdd(v => !v)} style={s.btnGhost}>{showAdd ? 'Close' : '+ Single Question'}</button>
          <button onClick={() => setShowPaste(v => !v)} style={s.btn}>{showPaste ? 'Close' : '📋 Paste & Split'}</button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.25rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', background: msg.type === 'success' ? '#f0fdf4' : '#fff5f5', border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`, color: msg.type === 'success' ? '#166534' : '#991b1b', whiteSpace: 'pre-wrap' }}>
          {msg.text}
        </div>
      )}

      {showPaste && <PasteSplitPanel topicId={id} onDone={() => { setShowPaste(false); load() }} setMsg={setMsg} />}
      {showAdd && <SingleAddForm topicId={id} onDone={() => { setShowAdd(false); load() }} setMsg={setMsg} />}

      {standalones.length > 0 ? (
        <SectionBox title={`Questions — ${standalones.length}`}>
          <div style={{ padding: '1rem 1.25rem' }}>
            {standalones.map(q => (
              <QuestionRow key={q.id} q={q} onEdit={() => setEditingQ(q)} onDeleted={load} />
            ))}
          </div>
        </SectionBox>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--white)', border: '1px dashed var(--gray-200)', borderRadius: '8px' }}>
          <p style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>No questions yet</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>Paste a batch, or add one manually.</p>
          <button onClick={() => setShowPaste(true)} style={s.btn}>📋 Paste & Split</button>
        </div>
      )}

      {editingQ && <EditModal q={editingQ} onClose={() => setEditingQ(null)} onSaved={() => { setEditingQ(null); load() }} />}
    </AdminLayout>
  )
}

// ── PASTE & SPLIT ────────────────────────────────────────────────────────────

function PasteSplitPanel({ topicId, onDone, setMsg }) {
  const [raw, setRaw] = useState('')
  const [difficulty, setDifficulty] = useState('moderate')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  const runPreview = async () => {
    setBusy(true); setMsg(null)
    try {
      const { data } = await api.post(`/dashboard/mocks/topics/${topicId}/paste-split/`, { raw_text: raw, action: 'preview' })
      setPreview(data)
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Preview failed' }) }
    finally { setBusy(false) }
  }

  const runImport = async () => {
    setBusy(true)
    try {
      const { data } = await api.post(`/dashboard/mocks/topics/${topicId}/paste-split/`, {
        raw_text: raw, action: 'import', difficulty,
      })
      const skippedNote = data.skipped_passages ? ` (${data.skipped_passages} passage block(s) skipped — not supported for topic-wise.)` : ''
      setMsg({ type: 'success', text: `Imported ${data.created_questions} question(s).${skippedNote}` })
      setRaw(''); setPreview(null)
      onDone()
    } catch (e) {
      setMsg({ type: 'error', text: (e.response?.data?.error || 'Import failed') + (e.response?.data?.errors ? '\n' + e.response.data.errors.map(er => `Q${er.question} (block ${er.block}): ${er.error}`).join('\n') : '') })
    } finally { setBusy(false) }
  }

  return (
    <SectionBox title="Paste & Split">
      <div style={{ padding: '1.25rem' }}>
        <details style={{ marginBottom: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--gray-500)' }}>Format help</summary>
          <pre style={{ fontFamily: "'SF Mono',monospace", fontSize: '0.72rem', background: 'var(--gray-50)', padding: '0.875rem', borderRadius: '4px', overflowX: 'auto', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{HELP_TEXT}</pre>
        </details>

        <textarea style={s.textarea} value={raw} onChange={e => setRaw(e.target.value)} placeholder="Paste your batch here…" />

        <div style={{ display: 'grid', gridTemplateColumns: '160px', gap: '1rem', margin: '0.875rem 0' }}>
          <div>
            <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: '700', color: 'var(--gray-600)', display: 'block', marginBottom: '0.25rem' }}>Difficulty</label>
            <select style={s.input} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {preview && (
          <div style={{ background: 'var(--gray-50)', borderRadius: '4px', padding: '1rem', marginBottom: '0.875rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>
            <p><strong>{preview.total_questions}</strong> questions parsed.{preview.skipped_passages > 0 && ` ${preview.skipped_passages} passage block(s) will be skipped (not supported here).`}</p>
            {preview.errors?.length > 0 && (
              <div style={{ marginTop: '0.5rem', color: '#991b1b' }}>
                {preview.errors.map((e, i) => <p key={i}>Block {e.block}, Q{e.question}: {e.error} — "{e.preview}…"</p>)}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={runPreview} disabled={busy || !raw.trim()} style={{ ...s.btnGhost, opacity: busy ? 0.6 : 1 }}>Preview</button>
          <button onClick={runImport} disabled={busy || !preview || preview.errors?.length > 0} style={{ ...s.btn, opacity: (busy || !preview || preview.errors?.length > 0) ? 0.5 : 1 }}>
            {busy ? 'Working…' : `Import ${preview ? preview.total_questions : ''} Question(s) →`}
          </button>
        </div>
      </div>
    </SectionBox>
  )
}

// ── SINGLE ADD ────────────────────────────────────────────────────────────────

function emptyQ() {
  return { question_type: 'MCQ', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', correct_option: '', tita_answer: '', difficulty: 'moderate', explanation: '', correct_marks: 3, negative_marks: 1 }
}

function SingleAddForm({ topicId, onDone, setMsg }) {
  const [form, setForm] = useState(emptyQ())
  const [busy, setBusy] = useState(false)
  const set = (f, v) => setForm(x => ({ ...x, [f]: v }))

  const save = async (addAnother) => {
    setBusy(true)
    try {
      await api.post(`/dashboard/mocks/topics/${topicId}/questions/add/`, form)
      setMsg({ type: 'success', text: 'Question added.' })
      if (addAnother) { setForm(emptyQ()) } else { onDone() }
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setBusy(false) }
  }

  return (
    <SectionBox title="Add a Single Question">
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <select style={s.input} value={form.question_type} onChange={e => set('question_type', e.target.value)}>
          <option value="MCQ">MCQ</option><option value="TITA">TITA</option>
        </select>
        <textarea style={{ ...s.input, minHeight: '70px' }} placeholder="Question text" value={form.question_text} onChange={e => set('question_text', e.target.value)} />
        {form.question_type === 'MCQ' ? (
          <>
            {['a', 'b', 'c', 'd', 'e'].map(l => (
              <input key={l} style={s.input} placeholder={`Option ${l.toUpperCase()}${l === 'e' ? ' (optional)' : ''}`} value={form[`option_${l}`]} onChange={e => set(`option_${l}`, e.target.value)} />
            ))}
            <select style={s.input} value={form.correct_option} onChange={e => set('correct_option', e.target.value)}>
              <option value="">Correct option…</option>
              {['A', 'B', 'C', 'D', 'E'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </>
        ) : (
          <input style={s.input} placeholder="TITA answer" value={form.tita_answer} onChange={e => set('tita_answer', e.target.value)} />
        )}
        <textarea style={{ ...s.input, minHeight: '50px' }} placeholder="Explanation" value={form.explanation} onChange={e => set('explanation', e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '0.5rem' }}>
          <select style={s.input} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            <option value="easy">Easy</option><option value="moderate">Moderate</option><option value="hard">Hard</option>
          </select>
          <input style={s.input} type="number" step="0.5" title="Correct marks" value={form.correct_marks} onChange={e => set('correct_marks', e.target.value)} />
          <input style={s.input} type="number" step="0.5" title="Negative marks" value={form.negative_marks} onChange={e => set('negative_marks', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => save(false)} disabled={busy} style={s.btn}>Save & Close</button>
          <button onClick={() => save(true)} disabled={busy} style={s.btnGhost}>Save & Add Another</button>
        </div>
      </div>
    </SectionBox>
  )
}

// ── QUESTION ROW ──────────────────────────────────────────────────────────────

function QuestionRow({ q, onEdit, onDeleted }) {
  const del = async () => {
    if (!confirm('Delete this question?')) return
    await api.delete(`/dashboard/mocks/questions/${q.id}/`)
    onDeleted()
  }
  return (
    <div style={s.qCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <p style={{ fontFamily: 'Georgia,serif', fontSize: '0.9rem', color: 'var(--black)', flex: 1 }}>Q{q.order}. {q.question_text.slice(0, 160)}{q.question_text.length > 160 ? '…' : ''}</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <button onClick={onEdit} style={{ ...s.btnGhost, padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Edit</button>
          <button onClick={del} style={{ ...s.btnGhost, padding: '0.3rem 0.6rem', fontSize: '0.72rem', color: '#991b1b', borderColor: '#fca5a5' }}>Delete</button>
        </div>
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        <span style={s.chip}>{q.question_type}</span>
        <span style={s.chip}>{q.difficulty}</span>
        <span style={s.chip}>Ans: {q.question_type === 'TITA' ? q.tita_answer : q.correct_option}</span>
      </div>
    </div>
  )
}

// ── EDIT MODAL ────────────────────────────────────────────────────────────────

function EditModal({ q, onClose, onSaved }) {
  const [form, setForm] = useState({ ...q })
  const [busy, setBusy] = useState(false)
  const set = (f, v) => setForm(x => ({ ...x, [f]: v }))

  const save = async () => {
    setBusy(true)
    try {
      await api.patch(`/dashboard/mocks/questions/${q.id}/`, form)
      onSaved()
    } finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem' }}>Edit Q{q.order}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <textarea style={{ ...s.input, minHeight: '70px' }} value={form.question_text} onChange={e => set('question_text', e.target.value)} />
          {form.question_type === 'MCQ' ? (
            <>
              {['a', 'b', 'c', 'd', 'e'].map(l => (
                <input key={l} style={s.input} placeholder={`Option ${l.toUpperCase()}`} value={form[`option_${l}`] || ''} onChange={e => set(`option_${l}`, e.target.value)} />
              ))}
              <select style={s.input} value={form.correct_option} onChange={e => set('correct_option', e.target.value)}>
                {['A', 'B', 'C', 'D', 'E'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </>
          ) : (
            <input style={s.input} value={form.tita_answer} onChange={e => set('tita_answer', e.target.value)} />
          )}
          <textarea style={{ ...s.input, minHeight: '50px' }} value={form.explanation} onChange={e => set('explanation', e.target.value)} />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={onClose} style={s.btnGhost}>Cancel</button>
            <button onClick={save} disabled={busy} style={s.btn}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * GRADSKOOL Admin — Mock Credentials
 * Route: /admin-panel/mock-credentials
 *
 * Send Testfunda login credentials to students after mock purchase.
 * Student sees their credentials on /courses/[exam]/mocks page.
 */
import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

const EXAMS = ['cat','xat','snap','nmat','gmat','gre','ipmat','cmat','mhcet','clat','cuet']

const PLATFORM_URLS = {
  cat:   'https://gradskool.testfunda.com/TestCentre/full-length--tests/cat',
  xat:   'https://gradskool.testfunda.com/TestCentre/mba/xat',
  snap:  'https://gradskool.testfunda.com/TestCentre/mba/snap',
  nmat:  'https://gradskool.testfunda.com/TestCentre/mba/nmat',
  gmat:  'https://gradskool.testfunda.com/TestCentre/gmat/gmat-focus',
  gre:   'https://gradskool.testfunda.com/TestCentre/gre/gre-general',
  ipmat: 'https://gradskool.testfunda.com/TestCentre/ug/ipmat',
  cmat:  'https://gradskool.testfunda.com/TestCentre/mba/cmat',
  mhcet: 'https://gradskool.testfunda.com/TestCentre/mba/mhcet',
  clat:  'https://gradskool.testfunda.com/TestCentre/law/clat',
  cuet:  'https://gradskool.testfunda.com/TestCentre/cuet-aptitude/cuet-(general-test)',
}

export default function AdminMockCredsPage() {
  const [creds,    setCreds]   = useState([])
  const [loading,  setLoad]    = useState(true)
  const [filter,   setFilter]  = useState('')
  const [showForm, setForm]    = useState(false)
  const [saving,   setSaving]  = useState(false)
  const [msg,      setMsg]     = useState(null)

  const EMPTY = {
    user_email: '', exam_slug: 'cat', username: '', password: '',
    platform_url: PLATFORM_URLS.cat,
    note: '',
  }
  const [form, setFormData] = useState(EMPTY)

  const load = useCallback(() => {
    setLoad(true)
    const params = filter ? `?exam=${filter}` : ''
    api.get(`/dashboard/mock-credentials/${params}`)
      .then(({ data }) => setCreds(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load' }))
      .finally(() => setLoad(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleSend = async () => {
    if (!form.user_email || !form.username || !form.password) {
      setMsg({ type:'error', text:'Email, username and password are required' })
      return
    }
    setSaving(true)
    try {
      await api.post('/dashboard/mock-credentials/', form)
      setMsg({ type:'success', text:`✓ Credentials sent to ${form.user_email}` })
      setForm(EMPTY); setForm(f => ({ ...EMPTY }))
      setForm(false); load()
    } catch (err) {
      setMsg({ type:'error', text: typeof err.response?.data?.error === 'string' ? err.response.data.error : JSON.stringify(err.response?.data?.error || 'Failed') || 'Failed to send' })
    } finally {
      setSaving(false); setForm(false)
    }
  }

  const handleDelete = async (id, email) => {
    if (!confirm(`Revoke credentials for ${email}?`)) return
    await api.delete(`/dashboard/mock-credentials/${id}/`)
    setMsg({ type:'success', text:'Revoked' }); load()
  }

  const set = f => e => setFormData(d => ({ ...d, [f]: e.target.value }))

  return (
    <AdminLayout title="Mock Credentials">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Management</p>
          <h1 style={s.title}>Mock Credentials</h1>
          <p style={s.sub}>Send Testfunda login credentials to students after purchase. Students see them on their mocks page.</p>
        </div>
        <button onClick={() => setForm(true)} style={s.btn}>+ Send Credentials</button>
      </div>

      {msg && (
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem 1rem', borderRadius:'4px', marginBottom:'1.25rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', background:msg.type==='success'?'#f0fdf4':'#fff5f5', border:`1px solid ${msg.type==='success'?'#86efac':'#fca5a5'}`, color:msg.type==='success'?'#166534':'#991b1b' }}>
          {msg.text}<button onClick={() => setMsg(null)} style={{ background:'none', border:'none', cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* How it works */}
      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'4px', padding:'1rem 1.25rem', marginBottom:'1.5rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#1d4ed8' }}>
        <strong>Workflow:</strong> Student buys mocks → pays → WhatsApp you → you create their Testfunda account on the platform → come here → Send Credentials → student sees username + password + link on their mocks page immediately.
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:'0.375rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {[['','All'],['cat','CAT'],['xat','XAT'],['snap','SNAP'],['nmat','NMAT'],['gmat','GMAT'],['gre','GRE'],['ipmat','IPMAT']].map(([val,lbl]) => (
          <button key={val+lbl} onClick={() => setFilter(val)}
            style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', padding:'0.3rem 0.75rem', border:'1px solid #e8e8e6', borderRadius:'3px', background: filter===val?'#0f0f0f':'#fff', color:filter===val?'#fff':'#999', cursor:'pointer' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Credentials list */}
      <SectionBox>
        {loading ? (
          <div style={{ padding:'2rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'#999' }}>Loading…</div>
        ) : creds.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'#999', marginBottom:'0.5rem' }}>No credentials sent yet.</p>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#bbb' }}>When a student buys mocks and you send their credentials, they'll appear here.</p>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1.5fr 80px 1.5fr 1.5fr 120px 80px', gap:'1rem', padding:'0.625rem 1.5rem', background:'#fafaf9', borderBottom:'1px solid #f0f0ee' }}>
              {['Student','Exam','Username','Password','Sent',''].map(h => (
                <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:'#bbb' }}>{h}</span>
              ))}
            </div>
            {creds.map(c => (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1.5fr 80px 1.5fr 1.5fr 120px 80px', gap:'1rem', padding:'1rem 1.5rem', borderBottom:'1px solid #f5f5f3', alignItems:'center' }}>
                <div>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:'#0f0f0f', marginBottom:'0.1rem' }}>{c.user_name}</p>
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#999' }}>{c.user_email}</p>
                </div>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:'#ff5e5f' }}>{c.exam_name}</span>
                <span style={{ fontFamily:'monospace', fontSize:'0.82rem', color:'#0f0f0f', background:'#f5f5f3', padding:'0.2rem 0.5rem', borderRadius:'3px' }}>{c.username}</span>
                <span style={{ fontFamily:'monospace', fontSize:'0.82rem', color:'#0f0f0f', background:'#f5f5f3', padding:'0.2rem 0.5rem', borderRadius:'3px' }}>{c.password}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#bbb' }}>
                  {new Date(c.sent_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                </span>
                <button onClick={() => handleDelete(c.id, c.user_email)}
                  style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', padding:'0.2rem 0.5rem', border:'1px solid #fca5a5', borderRadius:'3px', background:'#fff', cursor:'pointer', color:'#991b1b' }}>
                  Revoke
                </button>
              </div>
            ))}
          </>
        )}
      </SectionBox>

      {/* Send credentials panel */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', justifyContent:'flex-end' }}>
          <div style={{ width:'480px', height:'100%', background:'#fff', overflowY:'auto', padding:'2rem', boxShadow:'-4px 0 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid #f0f0ee' }}>
              <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:'700', color:'#0f0f0f' }}>Send Mock Credentials</h2>
              <button onClick={() => setForm(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'#bbb' }}>✕</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <Field label="Student Email *">
                <input value={form.user_email} onChange={set('user_email')} style={inp} placeholder="student@email.com" />
                <p style={hint}>Student must be registered on GRADSKOOL.</p>
              </Field>

              <Field label="Exam *">
                <select value={form.exam_slug} onChange={e => {
                  const slug = e.target.value
                  setFormData(d => ({ ...d, exam_slug: slug, platform_url: PLATFORM_URLS[slug] || '' }))
                }} style={inp}>
                  {EXAMS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
              </Field>

              <Field label="Testfunda Username *">
                <input value={form.username} onChange={set('username')} style={inp} placeholder="e.g. student123@gmail.com or gradskool_cat_001" />
              </Field>

              <Field label="Testfunda Password *">
                <input value={form.password} onChange={set('password')} style={inp} placeholder="e.g. GS@2026cat" />
                <p style={hint}>This is shown to the student on the mocks page.</p>
              </Field>

              <Field label="Platform URL">
                <input value={form.platform_url} onChange={set('platform_url')} style={inp} placeholder="https://gradskool.testfunda.com/..." />
                <p style={hint}>Pre-filled based on exam. Change if different.</p>
              </Field>

              <Field label="Note to Student (optional)">
                <textarea value={form.note} onChange={set('note')}
                  style={{ ...inp, minHeight:'80px', resize:'vertical' }}
                  placeholder="e.g. Access all 30 CAT mocks + 30 sectionals here. Use the same credentials for both full-length and sectional tests." />
              </Field>

              <div style={{ padding:'0.875rem 1rem', background:'#fff8f0', border:'1px solid #ffe4c0', borderRadius:'4px' }}>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'#92400e', lineHeight:'1.5' }}>
                  Once you click Send, the student will immediately see these credentials on their mocks page at <strong>/courses/{form.exam_slug}/mocks</strong>.
                </p>
              </div>

              <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.25rem' }}>
                <button onClick={handleSend} disabled={saving || !form.user_email || !form.username || !form.password}
                  style={{ ...s.btn, flex:1, opacity: (saving||!form.user_email||!form.username||!form.password) ? 0.5 : 1 }}>
                  {saving ? 'Sending…' : 'Send Credentials →'}
                </button>
                <button onClick={() => setForm(false)}
                  style={{ background:'none', border:'1px solid #e8e8e6', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', cursor:'pointer', color:'#666' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'#555', display:'block', marginBottom:'0.25rem' }}>{label}</label>
      {children}
    </div>
  )
}

const s = {
  header:  { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' },
  eyebrow: { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.2rem' },
  title:   { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.25rem' },
  sub:     { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  btn:     { background:'var(--black)', color:'var(--white)', border:'none', padding:'0.7rem 1.25rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer' },
}
const inp  = { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid #e8e8e6', borderRadius:'3px', outline:'none', boxSizing:'border-box' }
const hint = { fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#bbb', marginTop:'0.2rem' }

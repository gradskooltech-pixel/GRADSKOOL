/**
 * GRADSKOOL Admin — Student Detail
 * Route: /admin-panel/student/[id]
 *
 * Tabs: Profile · Activity · Enrollments · Payments · Mocks
 * Actions: Edit · Reset password · Suspend · Send message
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import api from '../../../lib/api'
import { AdminLayout } from '../../../components/admin/AdminLayout'

const C = {
  red:'#ff5e5f', black:'#0f0f0f', white:'#fff', bg:'#f7f6f3',
  border:'#e8e8e6', gray:'#999', green:'#22c55e', amber:'#f59e0b',
  blue:'#3b82f6', muted:'#f4f3f0', purple:'#7b2d8b',
}

const TABS = ['Profile', 'Activity', 'Enrollments', 'Payments', 'Mocks']

function StudentDetailInner() {
  const router             = useRouter()
  const { id }             = router.query
  const [data,    setData] = useState(null)
  const [loading, setLoad] = useState(true)
  const [tab,     setTab]  = useState('Profile')
  const [editing, setEdit] = useState(false)
  const [form,    setForm] = useState({})
  const [msg,     setMsg]  = useState(null)
  const [modal,   setModal]= useState(null) // 'reset_pw' | 'suspend' | 'nudge'
  const [pwValue, setPw]   = useState('')
  const [nudgeMsg,setNudge]= useState('')
  const [saving,  setSave] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoad(true)
    api.get('/dashboard/students/' + id + '/')
      .then(({ data: d }) => {
        setData(d)
        setForm({
          first_name:  d.first_name,
          last_name:   d.last_name,
          phone:       d.phone,
          target_exam: d.target_exam,
          is_verified: d.is_verified,
          role:        d.role,
        })
      })
      .catch(() => notify('Student not found', 'error'))
      .finally(() => setLoad(false))
  }, [id])

  const notify = (text, type = 'success') => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const save = async () => {
    setSave(true)
    try {
      await api.patch('/dashboard/students/' + id + '/', form)
      setData(prev => ({ ...prev, ...form }))
      setEdit(false)
      notify('Profile updated')
    } catch (e) { notify(e.response?.data?.error || 'Failed', 'error') }
    finally { setSave(false) }
  }

  const resetPassword = async () => {
    if (!pwValue.trim()) { notify('Enter a new password', 'error'); return }
    setSave(true)
    try {
      await api.post('/dashboard/students/' + id + '/reset-password/', { password: pwValue })
      notify('Password reset successfully')
      setModal(null)
      setPw('')
    } catch { notify('Failed to reset password', 'error') }
    finally { setSave(false) }
  }

  const toggleSuspend = async () => {
    setSave(true)
    try {
      await api.post('/dashboard/students/' + id + '/suspend/', { is_active: !data.is_active })
      setData(prev => ({ ...prev, is_active: !prev.is_active }))
      notify(data.is_active ? 'Account suspended' : 'Account reactivated')
      setModal(null)
    } catch { notify('Failed', 'error') }
    finally { setSave(false) }
  }

  const sendNudge = async () => {
    if (!nudgeMsg.trim()) { notify('Write a message', 'error'); return }
    setSave(true)
    try {
      await api.post('/dashboard/nudge/', {
        user_ids: [parseInt(id)],
        message:  nudgeMsg,
        title:    'Message from your instructor',
        type:     'inapp',
      })
      notify('Message sent')
      setModal(null)
      setNudge('')
    } catch { notify('Failed to send', 'error') }
    finally { setSave(false) }
  }

  if (loading) return <Shell id={null}><p style={{ padding:'3rem', textAlign:'center', color:C.gray, fontFamily:'Georgia,serif' }}>Loading…</p></Shell>
  if (!data)   return <Shell id={null}><p style={{ padding:'3rem', textAlign:'center', color:C.red }}>Student not found</p></Shell>

  return (
    <Shell id={id}>
      <Head><title>{data.first_name} {data.last_name} — Admin — GRADSKOOL</title></Head>

      {/* Toast */}
      {msg && (
        <div style={{ position:'fixed', top:'64px', right:'1.5rem', zIndex:999, padding:'0.75rem 1.25rem', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', background:msg.type==='error'?'#fee2e2':'#dcfce7', border:'1px solid '+(msg.type==='error'?'#fca5a5':'#86efac'), color:msg.type==='error'?'#991b1b':'#166534' }}>
          {msg.text}
        </div>
      )}

      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'2rem' }}>

        {/* ── STUDENT HEADER ─────────────────────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:C.red, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', flexShrink:0 }}>
              {data.first_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color:C.black, margin:0 }}>
                {data.first_name} {data.last_name}
              </h1>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray, marginTop:'0.2rem' }}>{data.email}</p>
              <div style={{ display:'flex', gap:'0.375rem', marginTop:'0.375rem', flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'100px', background:'#dcfce7', color:'#166534' }}>
                  {data.role}
                </span>
                {data.is_verified && (
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'100px', background:'#eff6ff', color:C.blue }}>
                    ✓ Verified
                  </span>
                )}
                {data.is_active === false && (
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', padding:'0.15rem 0.5rem', borderRadius:'100px', background:'#fee2e2', color:C.red }}>
                    Suspended
                  </span>
                )}
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:'100px', background:C.muted, color:C.gray }}>
                  {(data.target_exam || 'No exam').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            <button onClick={() => setModal('nudge')}
              style={s.btn}>💬 Message</button>
            <button onClick={() => setModal('reset_pw')}
              style={s.btn}>🔑 Reset Password</button>
            <button onClick={() => setModal('suspend')}
              style={{ ...s.btn, borderColor:C.red, color:C.red }}>
              {data.is_active === false ? '✓ Reactivate' : '⊘ Suspend'}
            </button>
            {!editing
              ? <button onClick={() => setEdit(true)} style={{ ...s.btn, background:C.black, color:'#fff', border:'none' }}>✎ Edit</button>
              : <>
                  <button onClick={() => setEdit(false)} style={s.btn}>Cancel</button>
                  <button onClick={save} disabled={saving} style={{ ...s.btn, background:C.red, color:'#fff', border:'none' }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
            }
          </div>
        </div>

        {/* ── QUICK STATS ──────────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:'0.75rem', marginBottom:'2rem' }}>
          {[
            ['Videos',       data.videos_watched   || 0, C.blue],
            ['Quiz attempts',data.quiz_attempts    || 0, C.purple],
            ['Avg score',    Math.round(data.avg_quiz_score || 0) + '%', data.avg_quiz_score >= 60 ? C.green : C.amber],
            ['Watch time',   Math.round((data.total_watch_mins || 0) / 60) + 'h', C.green],
            ['Enrollments',  data.enrollments?.length || 0, C.red],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background:C.white, border:'1px solid '+C.border, borderRadius:'8px', padding:'0.875rem', textAlign:'center' }}>
              <p style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.15rem' }}>{val}</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', color:C.gray }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:'0', borderBottom:'2px solid '+C.border, marginBottom:'1.5rem' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:tab===t?'700':'400', padding:'0.625rem 1.25rem', background:'none', border:'none', borderBottom:'2px solid '+(tab===t?C.red:'transparent'), marginBottom:'-2px', color:tab===t?C.red:C.gray, cursor:'pointer' }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ──────────────────────────────────────────────────── */}
        {tab === 'Profile' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.5rem' }}>
            <div style={s.card}>
              <p style={s.cl}>Personal Info</p>
              {editing ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'1rem' }}>
                  {[['First Name','first_name'],['Last Name','last_name'],['Phone','phone'],['Target Exam','target_exam']].map(([label, key]) => (
                    <div key={key}>
                      <label style={s.fl}>{label}</label>
                      <input value={form[key]||''} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={s.inp} />
                    </div>
                  ))}
                  <div>
                    <label style={s.fl}>Role</label>
                    <select value={form.role||'student'} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={s.inp}>
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}>
                    <input type="checkbox" checked={!!form.is_verified} onChange={e=>setForm(f=>({...f,is_verified:e.target.checked}))} />
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem' }}>Email Verified</span>
                  </label>
                </div>
              ) : (
                <div style={{ marginTop:'1rem' }}>
                  {[
                    ['Email',     data.email],
                    ['Phone',     data.phone || '—'],
                    ['Target',    (data.target_exam || '—').toUpperCase()],
                    ['Role',      data.role],
                    ['Verified',  data.is_verified ? '✓ Yes' : '✗ No'],
                    ['Status',    data.is_active === false ? 'Suspended' : 'Active'],
                    ['Joined',    data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'],
                    ['Last login',data.last_login  ? new Date(data.last_login).toLocaleDateString('en-IN',  { day:'numeric', month:'short', year:'numeric' }) : 'Never'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid '+C.border }}>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray }}>{l}</span>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:C.black }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.card}>
              <p style={s.cl}>Account Actions</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'1rem' }}>
                <button onClick={() => setModal('nudge')}
                  style={{ padding:'0.75rem', background:C.muted, border:'1px solid '+C.border, borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', cursor:'pointer', textAlign:'left' }}>
                  💬 Send in-app message
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray, fontWeight:'400', marginTop:'2px' }}>Send a direct message or nudge</p>
                </button>
                <button onClick={() => setModal('reset_pw')}
                  style={{ padding:'0.75rem', background:C.muted, border:'1px solid '+C.border, borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', cursor:'pointer', textAlign:'left' }}>
                  🔑 Reset password
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray, fontWeight:'400', marginTop:'2px' }}>Set a new password for this student</p>
                </button>
                <button onClick={() => setModal('suspend')}
                  style={{ padding:'0.75rem', background:C.muted, border:'1px solid #fca5a5', borderRadius:'6px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', cursor:'pointer', textAlign:'left', color:C.red }}>
                  {data.is_active === false ? '✓ Reactivate account' : '⊘ Suspend account'}
                  <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray, fontWeight:'400', marginTop:'2px' }}>
                    {data.is_active === false ? 'Restore full access' : 'Block login, student cannot access platform'}
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY TAB ─────────────────────────────────────────────────── */}
        {tab === 'Activity' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div style={s.card}>
              <p style={s.cl}>Learning Stats</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'1rem', marginTop:'1rem' }}>
                {[
                  ['Videos completed', data.videos_watched || 0,  C.blue],
                  ['Quiz attempts',    data.quiz_attempts   || 0,  C.purple],
                  ['Avg quiz score',   Math.round(data.avg_quiz_score || 0) + '%', data.avg_quiz_score >= 60 ? C.green : C.amber],
                  ['Total watch',      Math.round((data.total_watch_mins || 0) / 60) + 'h ' + Math.round((data.total_watch_mins || 0) % 60) + 'm', C.green],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background:C.muted, borderRadius:'6px', padding:'1rem' }}>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'1.75rem', fontWeight:'700', color, lineHeight:1, marginBottom:'0.2rem' }}>{val}</p>
                    <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'1rem 1.25rem' }}>
              <span style={{ fontSize:'1.25rem' }}>📊</span>
              <div>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.blue, marginBottom:'0.2rem' }}>See full analytics for this student</p>
                <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:'#1d4ed8' }}>
                  Go to <Link href="/admin-panel/content-performance" style={{ color:C.blue }}>Content Performance</Link> and <Link href="/admin-panel/batch-health" style={{ color:C.blue }}>Batch Health</Link> for detailed per-student drill-down.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── ENROLLMENTS TAB ──────────────────────────────────────────────── */}
        {tab === 'Enrollments' && (
          <div style={s.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <p style={s.cl}>Enrollments ({data.enrollments?.length || 0})</p>
              <Link href={'/admin-panel/enroll?student_id=' + id}
                style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', padding:'0.3rem 0.75rem', background:C.red, color:'#fff', borderRadius:'4px', textDecoration:'none' }}>
                + Enroll
              </Link>
            </div>
            {!data.enrollments?.length ? (
              <p style={{ fontFamily:'Georgia,serif', color:C.gray, padding:'2rem 0', textAlign:'center' }}>No enrollments yet.</p>
            ) : (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr', gap:'0.5rem', padding:'0.5rem 0', borderBottom:'2px solid '+C.border }}>
                  {['Exam','Plan','Status','Enrolled','Expires'].map(h => (
                    <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.07em', color:C.gray }}>{h}</span>
                  ))}
                </div>
                {data.enrollments.map(e => (
                  <div key={e.id} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr', gap:'0.5rem', padding:'0.625rem 0', borderBottom:'1px solid '+C.border, alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'600', color:C.black }}>{e.exam}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray }}>{e.plan}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', padding:'0.15rem 0.4rem', borderRadius:'3px', background:e.status==='active'?'#dcfce7':'#fef3c7', color:e.status==='active'?'#166534':'#92400e' }}>
                      {e.status}
                    </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>
                      {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—'}
                    </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray }}>
                      {e.expires_at ? new Date(e.expires_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENTS TAB ─────────────────────────────────────────────────── */}
        {tab === 'Payments' && (
          <div style={s.card}>
            <p style={s.cl}>Payment History ({data.orders?.length || 0})</p>
            {!data.orders?.length ? (
              <p style={{ fontFamily:'Georgia,serif', color:C.gray, padding:'2rem 0', textAlign:'center' }}>No payments yet.</p>
            ) : (
              <div style={{ marginTop:'1rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'0.5rem', padding:'0.5rem 0', borderBottom:'2px solid '+C.border }}>
                  {['Date','Amount','Status','Order ID'].map(h => (
                    <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.07em', color:C.gray }}>{h}</span>
                  ))}
                </div>
                {data.orders.map((o, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'0.5rem', padding:'0.625rem 0', borderBottom:'1px solid '+C.border, alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                    </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:C.black }}>₹{o.amount?.toLocaleString()}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', padding:'0.15rem 0.4rem', borderRadius:'3px', background:o.status==='paid'?'#dcfce7':'#fee2e2', color:o.status==='paid'?'#166534':C.red }}>
                      {o.status}
                    </span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', color:C.gray, fontFamily:'monospace' }}>#{o.id}</span>
                  </div>
                ))}
                <div style={{ marginTop:'1rem', paddingTop:'0.75rem', borderTop:'1px solid '+C.border, display:'flex', justifyContent:'flex-end' }}>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:C.black }}>
                    Total: ₹{data.orders.filter(o => o.status === 'paid').reduce((a, o) => a + (o.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MOCKS TAB ────────────────────────────────────────────────────── */}
        {tab === 'Mocks' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div style={s.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <p style={s.cl}>Mock Credentials</p>
                <Link href={'/admin-panel/mock-credentials?student_id=' + id}
                  style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'700', padding:'0.3rem 0.75rem', background:C.red, color:'#fff', borderRadius:'4px', textDecoration:'none' }}>
                  + Send Credentials
                </Link>
              </div>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray, textAlign:'center', padding:'1.5rem 0' }}>
                Go to Mock Credentials page to send and manage this student's Testfunda access.
              </p>
            </div>

            <div style={s.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <p style={s.cl}>Mock Scores (self-reported)</p>
              </div>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray, textAlign:'center', padding:'1.5rem 0' }}>
                Students log their own mock scores. See the full batch analysis in{' '}
                <Link href="/admin-panel/analytics" style={{ color:C.red }}>Analytics</Link>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e => e.target === e.currentTarget && (setModal(null), setPw(''), setNudge(''))}>
          <div style={{ background:C.white, borderRadius:'10px', width:'100%', maxWidth:'440px', padding:'2rem', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>

            {/* Reset Password */}
            {modal === 'reset_pw' && <>
              <p style={s.mTitle}>Reset Password</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:C.gray, marginBottom:'1.25rem' }}>
                Set a new password for {data.first_name}. They will need to use this to log in.
              </p>
              <label style={s.fl}>New Password</label>
              <input type="password" value={pwValue} onChange={e=>setPw(e.target.value)}
                placeholder="Min 8 characters" style={{ ...s.inp, marginBottom:'1.5rem' }} />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button onClick={() => { setModal(null); setPw('') }} style={s.btnSec}>Cancel</button>
                <button onClick={resetPassword} disabled={saving || !pwValue.trim()} style={s.btnPri}>
                  {saving ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </>}

            {/* Suspend / Reactivate */}
            {modal === 'suspend' && <>
              <p style={s.mTitle}>{data.is_active === false ? 'Reactivate Account' : 'Suspend Account'}</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray, marginBottom:'1.5rem', lineHeight:1.7 }}>
                {data.is_active === false
                  ? `Reactivating ${data.first_name}'s account will restore full access to the platform.`
                  : `Suspending ${data.first_name}'s account will prevent them from logging in. All their data will be preserved.`}
              </p>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button onClick={() => setModal(null)} style={s.btnSec}>Cancel</button>
                <button onClick={toggleSuspend} disabled={saving}
                  style={{ ...s.btnPri, background: data.is_active === false ? C.green : C.red }}>
                  {saving ? 'Please wait…' : data.is_active === false ? 'Reactivate' : 'Suspend'}
                </button>
              </div>
            </>}

            {/* Send Message */}
            {modal === 'nudge' && <>
              <p style={s.mTitle}>Send Message to {data.first_name}</p>
              <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray, marginBottom:'1.25rem' }}>
                Sends as an in-app notification. Student sees it on their dashboard.
              </p>
              <label style={s.fl}>Message</label>
              <textarea value={nudgeMsg} onChange={e=>setNudge(e.target.value)} rows={4}
                style={{ ...s.inp, height:'100px', resize:'vertical', marginBottom:'1.5rem' }}
                placeholder={`Hey ${data.first_name}, just wanted to check in on your prep…`} />
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button onClick={() => { setModal(null); setNudge('') }} style={s.btnSec}>Cancel</button>
                <button onClick={sendNudge} disabled={saving || !nudgeMsg.trim()} style={s.btnPri}>
                  {saving ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </>}
          </div>
        </div>
      )}
    </Shell>
  )
}

function Shell({ id, children }) {
  return (
    <div style={{ minHeight:'100vh', background:'#f7f6f3' }}>
      <div style={{ height:'56px', background:'#fff', borderBottom:'1px solid #e8e8e6', display:'flex', alignItems:'center', padding:'0 1.5rem', gap:'1rem', position:'sticky', top:0, zIndex:100 }}>
        <Link href="/admin-panel/students" style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', color:'#999', textDecoration:'none' }}>← Students</Link>
        <span style={{ color:'#e8e8e6' }}>|</span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', color:'#0f0f0f' }}>Student Detail</span>
        {id && (
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'#999', fontFamily:'monospace' }}>#{id}</span>
        )}
      </div>
      {children}
    </div>
  )
}

const s = {
  card:   { background:'#fff', border:'1px solid #e8e8e6', borderRadius:'8px', padding:'1.25rem' },
  cl:     { fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#999' },
  fl:     { fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', color:'#666', display:'block', marginBottom:'0.25rem' },
  inp:    { width:'100%', padding:'0.5rem 0.625rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', border:'1px solid #e8e8e6', borderRadius:'4px', outline:'none', color:'#0f0f0f', boxSizing:'border-box', background:'#fff' },
  btn:    { padding:'0.4rem 0.875rem', background:'#fff', border:'1px solid #e8e8e6', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.75rem', cursor:'pointer', color:'#0f0f0f' },
  mTitle: { fontFamily:'Georgia,serif', fontSize:'1.25rem', fontWeight:'700', color:'#0f0f0f', marginBottom:'0.5rem' },
  btnPri: { padding:'0.625rem 1.5rem', background:'#ff5e5f', color:'#fff', border:'none', borderRadius:'4px', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'700', cursor:'pointer' },
  btnSec: { padding:'0.625rem 1.25rem', border:'1px solid #e8e8e6', borderRadius:'4px', background:'#fff', fontFamily:'var(--font-sans)', fontSize:'0.82rem', cursor:'pointer' },
}


export default function StudentDetail(props) {
  return (
    <AdminLayout title="Student">
      <StudentDetailInner {...props} />
    </AdminLayout>
  )
}

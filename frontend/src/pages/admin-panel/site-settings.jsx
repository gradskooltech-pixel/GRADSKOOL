/**
 * GRADSKOOL Admin — Site Settings
 * Route: /admin-panel/site-settings
 */
import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { SectionBox } from '../../components/admin/AdminPrimitives'
import api from '../../lib/api'

const SECTIONS = [
  {
    title: 'Contact & Support',
    fields: [
      { key:'whatsapp_number',  label:'WhatsApp Number',  hint:'With country code, no +. e.g. 916360597966', type:'text' },
      { key:'contact_email',   label:'Contact Email',    type:'email' },
      { key:'support_email',   label:'Support Email',    type:'email' },
    ],
  },
  {
    title: 'Testfunda Mock URLs',
    hint: '⚠ CONFIRM BEFORE DEPLOY — replace placeholders with actual Testfunda URLs',
    fields: [
      { key:'testfunda_cat_url',         label:'CAT Full-Length Mocks',    type:'url' },
      { key:'testfunda_cat_sectional_url',label:'CAT Sectional Tests',     type:'url' },
      { key:'testfunda_xat_url',          label:'XAT Mocks',               type:'url' },
      { key:'testfunda_snap_url',         label:'SNAP Mocks',              type:'url' },
      { key:'testfunda_nmat_url',         label:'NMAT Mocks',              type:'url' },
      { key:'testfunda_cmat_url',         label:'CMAT Mocks',              type:'url' },
      { key:'testfunda_mhcet_url',        label:'MH CET Mocks',            type:'url' },
      { key:'testfunda_ipmat_url',        label:'IPMAT Mocks',             type:'url' },
      { key:'testfunda_clat_url',         label:'CLAT Mocks',              type:'url' },
      { key:'testfunda_cuet_url',         label:'CUET Mocks',              type:'url' },
    ],
  },
  {
    title: 'CDN & Storage',
    fields: [
      { key:'bunny_cdn_url',      label:'Bunny CDN URL',        hint:'e.g. https://gradskool.b-cdn.net', type:'url' },
      { key:'bunny_storage_zone', label:'Bunny Storage Zone',   type:'text' },
    ],
  },
  {
    title: 'Social Links',
    fields: [
      { key:'twitter_url',   label:'X / Twitter URL',  type:'url' },
      { key:'youtube_url',   label:'YouTube URL',       type:'url' },
      { key:'instagram_url', label:'Instagram URL',     type:'url' },
      { key:'linkedin_url',  label:'LinkedIn URL',      type:'url' },
      { key:'gradflix_url',  label:'GRADFLIX URL',      type:'url' },
    ],
  },
  {
    title: 'Site Identity',
    fields: [
      { key:'site_name',    label:'Site Name',    type:'text' },
      { key:'site_tagline', label:'Site Tagline', type:'text' },
    ],
  },
]

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState({})
  const [loading, setLoad]      = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [msg, setMsg]           = useState(null)

  useEffect(() => {
    api.get('/dashboard/site-settings/')
      .then(({ data }) => setSettings(data))
      .catch(() => setMsg({ type:'error', text:'Failed to load settings' }))
      .finally(() => setLoad(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/dashboard/site-settings/', settings)
      setMsg({ type:'success', text:'Settings saved ✓' })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setMsg({ type:'error', text:'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const set = (key) => (e) => {
    setSettings(s => ({ ...s, [key]: e.target.value }))
  }

  return (
    <AdminLayout title="Site Settings">
      <div style={s.header}>
        <div>
          <p style={s.eyebrow}>Configuration</p>
          <h1 style={s.title}>Site Settings</h1>
          <p style={s.subtitle}>Global configuration — contact info, URLs, social links, CDN config.</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ ...s.saveBtn, background: saved ? '#166534' : 'var(--black)' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save All Changes →'}
        </button>
      </div>

      {msg && (
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem 1rem', borderRadius:'4px', marginBottom:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', background:msg.type==='success'?'#f0fdf4':'#fff5f5', border:`1px solid ${msg.type==='success'?'#86efac':'#fca5a5'}`, color:msg.type==='success'?'#166534':'#991b1b' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background:'none',border:'none',cursor:'pointer' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding:'3rem', textAlign:'center', fontFamily:'var(--font-sans)', color:'var(--gray-400)' }}>Loading settings…</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>
          {SECTIONS.map(section => (
            <SectionBox key={section.title}>
              <h2 style={s.sectionTitle}>{section.title}</h2>
              {section.hint && (
                <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:'4px', padding:'0.75rem 1rem', marginBottom:'1rem', fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#92400e' }}>
                  {section.hint}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 1.5rem' }}>
                {section.fields.map(field => (
                  <div key={field.key} style={{ marginBottom:'1rem' }}>
                    <label style={s.label}>{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={settings[field.key] || ''}
                      onChange={set(field.key)}
                      style={s.input}
                      placeholder={field.hint || ''}
                    />
                    {field.hint && field.type !== 'text' && (
                      <p style={s.hint}>{field.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            </SectionBox>
          ))}

          {/* Maintenance mode */}
          <SectionBox>
            <h2 style={s.sectionTitle}>Maintenance</h2>
            <label style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-700)', display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer' }}>
              <input
                type="checkbox"
                checked={!!settings.maintenance_mode}
                onChange={e => setSettings(s => ({ ...s, maintenance_mode: e.target.checked }))}
              />
              <div>
                <span style={{ fontWeight:'600', display:'block' }}>Maintenance Mode</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'var(--gray-400)' }}>
                  When enabled, the site shows a maintenance page to visitors. Admin panel still accessible.
                </span>
              </div>
            </label>
          </SectionBox>
        </div>
      )}
    </AdminLayout>
  )
}

const s = {
  header:       { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' },
  eyebrow:      { fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--red)', marginBottom:'0.2rem' },
  title:        { fontFamily:'var(--font-serif)', fontSize:'2rem', fontWeight:'700', color:'var(--black)', marginBottom:'0.25rem' },
  subtitle:     { fontFamily:'var(--font-sans)', fontSize:'0.875rem', color:'var(--gray-500)' },
  saveBtn:      { color:'var(--white)', border:'none', padding:'0.7rem 1.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', cursor:'pointer', transition:'background 0.3s' },
  sectionTitle: { fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:'var(--black)', marginBottom:'1.25rem', paddingBottom:'0.75rem', borderBottom:'1px solid var(--gray-100)' },
  label:        { display:'block', fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'600', color:'var(--gray-700)', marginBottom:'0.3rem' },
  input:        { width:'100%', padding:'0.6rem 0.75rem', fontFamily:'var(--font-sans)', fontSize:'0.875rem', border:'1px solid var(--gray-200)', borderRadius:'3px', outline:'none', boxSizing:'border-box' },
  hint:         { fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:'var(--gray-400)', marginTop:'0.2rem' },
}

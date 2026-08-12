/**
 * GRADSKOOL — Checkout Page
 * Route: /checkout/[examSlug]?plan=<id>
 *
 * Renders plan summary + EnrolButton.
 * Pre-selects plan from query param.
 * Shows login gate if not authenticated.
 *
 * Rebuilt styling — the previous version referenced CSS variables like
 * --gray-200, --gray-50, --red-light, --radius-lg that don't exist
 * anywhere in the site's actual token file (tokens.css uses --g100
 * through --g700, --off, --red, --border). Every one of those undefined
 * var() references was silently falling back to nothing, which is why
 * this page looked unstyled and misaligned — it never had real values
 * to render with. All values below are the site's real tokens.
 */
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { EnrolButton } from '../../components/payments/EnrolButton'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'

const EXAMS = [
  { slug:'cat',   label:'CAT' },
  { slug:'xat',   label:'XAT' },
  { slug:'snap',  label:'SNAP' },
  { slug:'nmat',  label:'NMAT' },
  { slug:'gmat',  label:'GMAT' },
  { slug:'mhcet', label:'MH CET' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { examSlug, plan: planIdParam } = router.query
  const { isLoggedIn, user } = useAuth()

  const [plans, setPlans]           = useState([])
  const [examName, setExamName]     = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [isLoading, setIsLoading]   = useState(true)

  // Load exam plans
  useEffect(() => {
    if (!examSlug) return
    api.get(`/courses/exams/${examSlug}/plans/`)
      .then(({ data }) => {
        // The endpoint is paginated ({results, count, ...}), not a raw
        // array — this fallback also tolerates the endpoint one day
        // returning a plain array without breaking again.
        const plansArr = Array.isArray(data) ? data : (data.results || [])
        setPlans(plansArr)
        const preselect = plansArr.find(p => String(p.id) === String(planIdParam))
          || plansArr.find(p => p.slug === planIdParam)
          || plansArr.find(p => p.is_featured)
          || plansArr[0]
        if (preselect) setSelectedId(preselect.id)
      })
      .catch((err) => { console.error('Failed to load plans for', examSlug, err) })
      .finally(() => setIsLoading(false))

    api.get(`/courses/exams/${examSlug}/`)
      .then(({ data }) => setExamName(data.name))
      .catch((err) => { console.error('Failed to load exam details for', examSlug, err) })
  }, [examSlug, planIdParam])

  const selectedPlan = plans.find(p => p.id === selectedId)

  const switchExam = (slug) => {
    if (slug === examSlug) return
    router.push(`/checkout/${slug}`, undefined, { shallow: true })
  }

  return (
    <>
      <Head>
        <title>{examName ? `Enrol — ${examName} — GRADSKOOL` : 'Checkout — GRADSKOOL'}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <style>{`
        .co-exam-tabs { display:flex; overflow-x:auto; border-bottom:1px solid var(--g200); background:#fff; }
        .co-exam-tab { font-family:var(--font-sans); font-size:13px; font-weight:500; padding:16px 24px; border-bottom:2px solid transparent; color:var(--g500); cursor:pointer; transition:all var(--t); background:none; border-left:none; border-right:none; border-top:none; white-space:nowrap; }
        .co-exam-tab:hover { color:var(--black); }
        .co-exam-tab.active { color:var(--black); border-bottom-color:var(--red); font-weight:600; }
      `}</style>

      <div className="co-exam-tabs">
        {EXAMS.map(e => (
          <button key={e.slug} className={`co-exam-tab${examSlug === e.slug ? ' active' : ''}`} onClick={() => switchExam(e.slug)}>
            {e.label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingShell /> : <CheckoutContent
        examSlug={examSlug} examName={examName} plans={plans}
        selectedId={selectedId} setSelectedId={setSelectedId} selectedPlan={selectedPlan}
        isLoggedIn={isLoggedIn} user={user}
      />}
    </>
  )
}

function CheckoutContent({ examSlug, examName, plans, selectedId, setSelectedId, selectedPlan, isLoggedIn, user }) {
  return (
    <>
      <style>{`
        .co-page { min-height:100vh; display:grid; grid-template-columns:1fr 420px; background:#fff; }
        @media(max-width:860px){ .co-page{grid-template-columns:1fr!important} }
        .co-plan { display:flex; align-items:flex-start; gap:14px; padding:18px 20px; border:1px solid var(--g200); border-radius:4px; background:#fff; cursor:pointer; text-align:left; width:100%; transition:border-color var(--t), background var(--t); }
        .co-plan:hover { border-color:var(--g300); }
        .co-plan.selected { border-color:var(--black); background:var(--off); }
        .co-radio { width:18px; height:18px; border-radius:50%; border:2px solid var(--g300); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; transition:border-color var(--t); }
        .co-radio.selected { border-color:var(--red); }
        .co-radio-dot { width:8px; height:8px; border-radius:50%; background:var(--red); }
        .co-summary-right { position:sticky; top:24px; }
      `}</style>

      <div className="co-page">
        {/* ── LEFT: Plan selector ── */}
        <div style={{ borderRight:'1px solid var(--g200)' }}>
          <div style={{ padding:'48px', maxWidth:640, width:'100%', margin:'0 auto' }} className="co-left-pad">
          <Link href={`/courses/${examSlug}`} style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g500)', textDecoration:'none' }}>
            ← Back to {examName || examSlug?.toUpperCase()}
          </Link>

          <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--red)', marginTop:28, marginBottom:8 }}>Choose your plan</div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:36, fontWeight:400, color:'var(--black)', lineHeight:1.1, marginBottom:32 }}>{examName}</h1>

          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:40 }}>
            {plans.map((plan) => (
              <PlanOption
                key={plan.id}
                plan={plan}
                isSelected={plan.id === selectedId}
                onSelect={() => setSelectedId(plan.id)}
              />
            ))}
          </div>

          {(examSlug === 'nmat' || examSlug === 'snap') && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', padding:'16px 20px', background:'#fff8ee', border:'1px solid #f0dfb8', borderRadius:4, marginBottom:40 }}>
              <div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:11, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#a3730f', marginBottom:4 }}>Better deal</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:13.5, color:'var(--g700)' }}>Get {examSlug === 'nmat' ? 'SNAP' : 'NMAT'} mocks too — the bundle is ₹4,499 for both instead of ₹5,998 separately.</div>
              </div>
              <Link href="/checkout/nmat-snap" style={{ flexShrink:0, fontFamily:'var(--font-sans)', fontSize:13, fontWeight:600, color:'#a3730f', border:'1px solid #f0dfb8', borderRadius:3, padding:'8px 14px', textDecoration:'none', whiteSpace:'nowrap' }}>
                See the bundle →
              </Link>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {TRUST_POINTS.map((t) => (
              <div key={t.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:15 }}>{t.icon}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* ── RIGHT: Order summary + CTA ── */}
        <div style={{ padding:'48px 40px', background:'var(--off)', display:'flex', flexDirection:'column', gap:20 }}>
          <div className="co-summary-right">
            <div style={{ background:'#fff', border:'1px solid var(--g200)', borderRadius:4, padding:28, width:'100%', boxSizing:'border-box' }}>
              {selectedPlan ? (
                <>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--g500)', marginBottom:10 }}>Order Summary</div>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:21, color:'var(--black)', marginBottom:4 }}>{selectedPlan.name}</div>
                  <div style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)', marginBottom:20 }}>{examName}</div>

                  <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8, marginBottom:20, padding:0 }}>
                    {selectedPlan.features?.filter(f => f.is_included).map((f, i) => (
                      <li key={i} style={{ fontFamily:'var(--font-body)', fontSize:13.5, color:'var(--g700)', display:'flex', gap:8, lineHeight:1.5 }}>
                        <span style={{ color:'#166534', fontFamily:'var(--font-sans)', fontSize:13, flexShrink:0 }}>✓</span>{f.text}
                      </li>
                    ))}
                  </ul>

                  <div style={{ height:1, background:'var(--g100)', margin:'20px 0' }} />

                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font-sans)', fontSize:13.5, color:'var(--g700)' }}>
                      <span>Base price</span>
                      <span>₹{Number(selectedPlan.base_price_excl_gst).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font-sans)', fontSize:13.5, color:'var(--g700)' }}>
                      <span>GST (18%)</span>
                      <span>₹{Number(selectedPlan.gst_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font-serif)', fontSize:19, fontWeight:600, color:'var(--black)', paddingTop:12, marginTop:4, borderTop:'1px solid var(--g200)' }}>
                      <span>Total</span>
                      <span>₹{Number(selectedPlan.total_with_gst).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {!isLoggedIn ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:12, padding:20, background:'var(--off)', border:'1px solid var(--g200)', borderRadius:4 }}>
                      <p style={{ fontFamily:'var(--font-sans)', fontSize:13.5, color:'var(--g700)' }}>You'll need an account to complete your purchase.</p>
                      <Link href={`/auth/register?redirect=${encodeURIComponent(`/checkout/${examSlug}?plan=${selectedPlan.id}`)}`}
                        style={{ display:'block', textAlign:'center', padding:12, background:'var(--black)', color:'#fff', borderRadius:3, fontFamily:'var(--font-sans)', fontSize:14, fontWeight:600, textDecoration:'none' }}>
                        Create free account →
                      </Link>
                      <p style={{ textAlign:'center', fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)' }}>
                        Already have an account?{' '}
                        <Link href={`/auth/login?redirect=${encodeURIComponent(`/checkout/${examSlug}?plan=${selectedPlan.id}`)}`} style={{ color:'var(--red)', borderBottom:'1px solid rgba(217,79,80,.3)' }}>Log in</Link>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:'#166534', flexShrink:0 }} />
                        <span style={{ fontFamily:'var(--font-sans)', fontSize:12.5, color:'var(--g500)' }}>{user?.email}</span>
                      </div>
                      <EnrolButton
                        planId={selectedPlan.id}
                        planName={selectedPlan.name}
                        priceInr={selectedPlan.price_inr}
                        totalInr={selectedPlan.total_with_gst}
                        examSlug={examSlug}
                      />
                    </>
                  )}

                  <p style={{ fontFamily:'var(--font-sans)', fontSize:11.5, color:'var(--g500)', lineHeight:1.6, marginTop:14, textAlign:'center' }}>
                    By purchasing you agree to our{' '}
                    <Link href="/terms" style={{ color:'var(--g500)', borderBottom:'1px solid var(--g200)' }}>Terms</Link> and{' '}
                    <Link href="/refund-policy" style={{ color:'var(--g500)', borderBottom:'1px solid var(--g200)' }}>Refund Policy</Link>. All prices in INR.
                  </p>
                </>
              ) : (
                <p style={{ fontFamily:'var(--font-sans)', fontSize:14, color:'var(--g500)', textAlign:'center', padding:'32px 0' }}>Select a plan to continue.</p>
              )}
            </div>

            <a href="https://wa.me/916360597966" target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', border:'1px solid #d3f0d3', borderRadius:4, background:'#f0faf0', fontFamily:'var(--font-sans)', fontSize:13, color:'#1a6b1a', fontWeight:500, textDecoration:'none', marginTop:20 }}>
              <WhatsAppIcon />
              Have questions? Chat on WhatsApp before purchasing
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

// ── PLAN OPTION CARD ──────────────────────────────────────────────────────────

function PlanOption({ plan, isSelected, onSelect }) {
  return (
    <button onClick={onSelect} className={`co-plan${isSelected ? ' selected' : ''}`} aria-pressed={isSelected}>
      <div className={`co-radio${isSelected ? ' selected' : ''}`}>
        {isSelected && <div className="co-radio-dot" />}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:500, color:'var(--black)' }}>{plan.name}</span>
          {plan.badge_text && (
            <span style={{ fontFamily:'var(--font-sans)', fontSize:10, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', background:'rgba(217,79,80,.1)', color:'var(--red)', border:'1px solid rgba(217,79,80,.25)', padding:'2px 8px', borderRadius:2 }}>{plan.badge_text}</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
          {plan.original_price && (
            <span style={{ fontFamily:'var(--font-sans)', fontSize:13, color:'var(--g300)', textDecoration:'line-through' }}>₹{Number(plan.original_price).toLocaleString('en-IN')}</span>
          )}
          <span style={{ fontFamily:'var(--font-serif)', fontSize:19, fontWeight:600, color:'var(--black)' }}>₹{Number(plan.price_inr).toLocaleString('en-IN')}</span>
          <span style={{ fontFamily:'var(--font-sans)', fontSize:12, color:'var(--g500)' }}> incl. GST</span>
        </div>
      </div>
    </button>
  )
}

function LoadingShell() {
  return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--off)' }}>
      <p style={{ fontFamily:'var(--font-sans)', color:'var(--g500)', fontSize:14 }}>Loading…</p>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.856L.054 23.737a.5.5 0 00.609.637l6.054-1.592A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.917a9.9 9.9 0 01-5.05-1.381l-.362-.215-3.748.984.999-3.651-.236-.375A9.916 9.916 0 012.083 12C2.083 6.511 6.511 2.083 12 2.083S21.917 6.511 21.917 12 17.489 21.917 12 21.917z"/>
    </svg>
  )
}

const TRUST_POINTS = [
  { icon: '🔒', label: 'Secured by Razorpay' },
  { icon: '📄', label: 'GST invoice issued' },
  { icon: '↩', label: '7-day refund policy' },
  { icon: '💬', label: 'WhatsApp support' },
]
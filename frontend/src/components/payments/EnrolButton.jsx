/**
 * GRADSKOOL — EnrolButton
 *
 * Self-contained enrol CTA. Handles:
 *   1. Auth check → redirect to login
 *   2. Razorpay script load
 *   3. Order creation (POST /payments/create-order/)
 *   4. Razorpay modal open
 *   5. Client-side signature verify
 *   6. Success → redirect to dashboard
 *   7. Failure → inline error
 *
 * Props:
 *   planId     — PricingPlan.id
 *   planName   — display name
 *   priceInr   — base price (before GST)
 *   totalInr   — total incl. GST
 *   examSlug   — for redirect
 *   onSuccess  — optional callback after enrollment
 */
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'
import { useRazorpay, useCreateOrder, useVerifyPayment } from '../../hooks/usePaymentsAndContent'

export function EnrolButton({
  planId, planName, priceInr, totalInr, examSlug,
  onSuccess, style: styleProp = {},
}) {
  const router = useRouter()
  const { isLoggedIn, user } = useAuth()
  const { loadRazorpay }  = useRazorpay()
  const { createOrder }   = useCreateOrder()
  const { verify }        = useVerifyPayment()

  const [state, setState] = useState('idle') // idle | loading | error | success
  const [error, setError] = useState('')

  const handleEnrol = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/courses/${examSlug}`)
      return
    }

    setState('loading')
    setError('')

    // 1. Create server-side order
    const orderResult = await createOrder(planId)
    if (!orderResult.success) {
      setState('error')
      setError(orderResult.error)
      return
    }

    // 2. Load Razorpay + open modal
    let Razorpay
    try {
      Razorpay = await loadRazorpay()
    } catch {
      setState('error')
      setError('Payment gateway unavailable. Please try again or contact support.')
      return
    }

    const orderData = orderResult.data

    const rzp = new Razorpay({
      ...orderData,
      handler: async (response) => {
        // 3. Verify signature client-side (non-blocking)
        await verify(response)
        // 4. Redirect → webhook will activate enrollment in background
        setState('success')
        onSuccess?.()
        router.push(`/dashboard?enrolled=${examSlug}&plan=${encodeURIComponent(planName)}`)
      },
      modal: {
        ondismiss: () => setState('idle'),
      },
    })

    rzp.on('payment.failed', (response) => {
      setState('error')
      setError(response.error?.description || 'Payment failed. Please try again.')
    })

    rzp.open()
  }

  return (
    <div>
      <button
        onClick={handleEnrol}
        disabled={state === 'loading' || state === 'success'}
        style={{ ...btnStyle, ...styleProp, ...(state === 'loading' ? loadingStyle : {}) }}
        aria-busy={state === 'loading'}
      >
        {state === 'loading' && <span style={spinStyle} aria-hidden />}
        {state === 'success'  ? '✓ Enrolled!' :
         state === 'loading'  ? 'Processing…'  :
         `Enrol Now — ₹${Number(totalInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })} incl. GST`}
      </button>

      {state === 'error' && error && (
        <p style={errorStyle} role="alert">{error}</p>
      )}
    </div>
  )
}

const btnStyle = {
  width: '100%',
  padding: '0.85rem 1.5rem',
  background: 'var(--red)',
  color: 'var(--white)',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.9rem',
  fontWeight: '600',
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'background 0.2s, opacity 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
}
const loadingStyle = { opacity: 0.7, cursor: 'not-allowed' }
const spinStyle = {
  width: '14px', height: '14px',
  border: '2px solid rgba(255,255,255,0.4)',
  borderTopColor: 'white',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  flexShrink: 0,
}
const errorStyle = {
  marginTop: '0.5rem',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.8rem',
  color: 'var(--red-dark)',
  background: 'var(--red-light)',
  border: '1px solid var(--red-border)',
  borderRadius: 'var(--radius)',
  padding: '0.5rem 0.75rem',
  lineHeight: '1.4',
}

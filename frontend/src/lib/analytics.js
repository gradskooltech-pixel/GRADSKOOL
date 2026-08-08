/**
 * GRADSKOOL — Analytics Helper
 *
 * Thin wrapper around analytics events.
 * Currently wires to Google Analytics 4 via gtag.
 * All calls are no-ops if GA is not configured.
 *
 * Events we track:
 *   page_view          → automatic via Next.js router
 *   enrol_click        → user clicks "Enrol Now" on any plan
 *   checkout_start     → Razorpay modal opened
 *   purchase           → payment confirmed
 *   tool_gate_submit   → lead gate form submitted
 *   tool_question_answered → question answered in a tool
 *   video_play         → video started
 *   video_complete     → video marked complete
 *   blog_read          → blog post opened (60s+ on page)
 *
 * Usage:
 *   import { track } from '@/lib/analytics'
 *   track('enrol_click', { exam: 'cat', plan: 'live-mocks', value: 15999 })
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/**
 * Send a custom event to GA4.
 * @param {string} eventName
 * @param {object} params
 */
export function track(eventName, params = {}) {
  if (typeof window === 'undefined') return
  if (!GA_ID || !window.gtag) return

  try {
    window.gtag('event', eventName, {
      ...params,
      send_to: GA_ID,
    })
  } catch (e) {
    // Silent — analytics must never crash the app
  }
}

/**
 * Track a page view manually (used after client-side navigation).
 * Called from _app.jsx on router.events.on('routeChangeComplete').
 */
export function trackPageView(url) {
  if (typeof window === 'undefined' || !GA_ID || !window.gtag) return
  try {
    window.gtag('config', GA_ID, { page_path: url })
  } catch (e) {}
}

/**
 * Track purchase revenue for GA4 e-commerce.
 */
export function trackPurchase({ orderId, planName, examSlug, amountInr }) {
  track('purchase', {
    transaction_id: orderId,
    value:          amountInr,
    currency:       'INR',
    items: [{
      item_id:   examSlug,
      item_name: planName,
    }],
  })
}

/**
 * Set user properties after login (for attribution).
 * Does NOT send PII — only role and exam.
 */
export function identifyUser(user) {
  if (typeof window === 'undefined' || !GA_ID || !window.gtag) return
  try {
    window.gtag('set', 'user_properties', {
      user_role:   user.role,
      target_exam: user.target_exam,
    })
  } catch (e) {}
}

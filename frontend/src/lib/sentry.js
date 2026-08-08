/**
 * GRADSKOOL — Sentry Frontend (stub)
 *
 * @sentry/nextjs is NOT installed by default to keep the bundle small.
 * All functions are safe no-ops until you install Sentry.
 *
 * To enable Sentry:
 *   npm install @sentry/nextjs
 *   Then uncomment the real implementation below.
 */

export function initSentry() {
  // No-op — Sentry not configured
  // To enable: npm install @sentry/nextjs and add NEXT_PUBLIC_SENTRY_DSN to .env.local
}

export function captureError(error, context = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[captureError]', error, context)
  }
}

export function setUser(user) {
  // No-op
}

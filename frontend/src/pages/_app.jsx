/**
 * GRADSKOOL — App Root
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../store/authStore'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { initSentry, setUser } from '../lib/sentry'
import { trackPageView, identifyUser } from '../lib/analytics'
import '../styles/tokens.css'
import '../styles/globals.css'

const BARE_PREFIXES = ['/auth/', '/admin-panel', '/watch/', '/test/', '/learn/', '/dashboard']

function useBareLayout(pathname) {
  return BARE_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export default function App({ Component, pageProps }) {
  const hydrateSession = useAuthStore(s => s.hydrateSession)
  const user           = useAuthStore(s => s.user)
  const router         = useRouter()
  const bare           = useBareLayout(router.pathname)
  const [hydrated, setHydrated] = useState(false)

  // Init Sentry once
  useEffect(() => { initSentry() }, [])

  // Hydrate auth session on mount. Bare pages (admin-panel, dashboard,
  // watch, learn, test) wait for this to finish before rendering — those
  // pages' own child components fire authenticated API calls immediately
  // on mount, and doing that before the access token is restored from the
  // refresh token means the api.js interceptor kicks off its own,
  // independent refresh attempt using the same refresh token hydrateSession
  // is already using. With ROTATE_REFRESH_TOKENS on, whichever one loses
  // that race gets an already-used, invalid token back and force-logs-out
  // the user — even though the session itself was perfectly valid. Public
  // pages don't wait, since they don't make authenticated calls on mount.
  useEffect(() => {
    hydrateSession().finally(() => setHydrated(true))
  }, []) // eslint-disable-line

  // Identify user in Sentry + Analytics after login
  useEffect(() => {
    if (user) {
      setUser(user)
      identifyUser(user)
    }
  }, [user])

  // Track page views on route change
  useEffect(() => {
    const handleRouteChange = url => trackPageView(url)
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router.events])

  // Pages can define their own layout via getLayout
  const getLayout = Component.getLayout
  if (getLayout) return getLayout(<Component {...pageProps} />)

  // Auth / admin / watch pages manage their own chrome — and wait for
  // session hydration before rendering, per the comment above.
  if (bare) return hydrated ? <Component {...pageProps} /> : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Component {...pageProps} />
      </div>
      <Footer />
    </div>
  )
}
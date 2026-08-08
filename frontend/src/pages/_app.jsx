/**
 * GRADSKOOL — App Root
 */
import { useEffect } from 'react'
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

  // Init Sentry once
  useEffect(() => { initSentry() }, [])

  // Hydrate auth session on mount
  useEffect(() => { hydrateSession() }, []) // eslint-disable-line

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

  // Auth / admin / watch pages manage their own chrome
  if (bare) return <Component {...pageProps} />

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

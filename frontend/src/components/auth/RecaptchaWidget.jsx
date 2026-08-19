/**
 * GRADSKOOL — Google reCAPTCHA v2 widget
 *
 * Bot-protection challenge shown on Register, Login, and Password Reset
 * Request — the existing per-IP rate limits (apps/accounts/views.py) only
 * slow down one machine; they do nothing against a real botnet spreading
 * requests across many IPs, none of which individually cross the per-IP
 * threshold. This is the complementary layer: actually tells a human
 * apart from a script.
 *
 * (Originally built against Cloudflare Turnstile — swapped to reCAPTCHA
 * 2026-08-19 at the site owner's request, to avoid a Cloudflare account
 * dependency and reuse the Google Cloud project already in use for Google
 * OAuth login. Explicit render mode, matching TurnstileWidget's controlled-
 * by-React approach rather than the script's own auto-render scan.)
 *
 * Renders nothing if NEXT_PUBLIC_RECAPTCHA_SITE_KEY isn't set — mirrors
 * the backend's verify_recaptcha() graceful-skip behavior, so local dev
 * and any deploy that hasn't had the Google keys configured yet keep
 * working exactly as before, un-gated.
 */
import { useEffect, useRef } from 'react'

let scriptLoadingPromise = null
function loadRecaptchaScript() {
  if (typeof window !== 'undefined' && window.grecaptcha && window.grecaptcha.render) return Promise.resolve()
  if (scriptLoadingPromise) return scriptLoadingPromise
  scriptLoadingPromise = new Promise((resolve) => {
    // render=explicit — we call grecaptcha.render() ourselves once React has
    // mounted the container div, instead of letting the script auto-scan the
    // page for `.g-recaptcha` elements (which fights with React's own DOM
    // management and re-render cycle).
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
    script.async = true
    script.defer = true
    // grecaptcha.render is available slightly after the script's onload
    // fires in some browsers — poll briefly rather than trust onload alone.
    script.onload = () => {
      const check = () => {
        if (window.grecaptcha && window.grecaptcha.render) resolve()
        else setTimeout(check, 50)
      }
      check()
    }
    document.head.appendChild(script)
  })
  return scriptLoadingPromise
}

export function RecaptchaWidget({ onVerify }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  // Same fix as GoogleOAuthButton.jsx's own history — onVerify is typically
  // an inline setter from the parent form (e.g. onVerify={setToken}), which
  // gets a brand new function reference on every keystroke-driven re-render
  // of that form. Reading it via a ref instead of the effect's dependency
  // array means this widget renders exactly once per mount, rather than
  // tearing down and re-rendering (visibly resetting the challenge) on
  // every keystroke in the email/password fields.
  const onVerifyRef = useRef(onVerify)
  useEffect(() => { onVerifyRef.current = onVerify }, [onVerify])

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let cancelled = false

    loadRecaptchaScript().then(() => {
      if (cancelled || !containerRef.current || !window.grecaptcha) return
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onVerifyRef.current(token),
        'expired-callback': () => onVerifyRef.current(''),
        'error-callback': () => onVerifyRef.current(''),
      })
    })

    return () => {
      cancelled = true
      // No direct DOM-removal API like Turnstile's .remove() — the widget's
      // own DOM node goes away when React unmounts this container, which is
      // sufficient; nothing further to clean up here.
    }
    // Deliberately just [siteKey] — see the ref comment above for why
    // onVerify isn't a dependency.
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={containerRef} style={{ margin: '0.5rem 0' }} />
}

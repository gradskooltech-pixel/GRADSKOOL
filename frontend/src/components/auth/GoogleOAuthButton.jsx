/**
 * GRADSKOOL — Google OAuth Button
 *
 * Uses Google Identity Services (GIS) one-tap / sign-in button.
 * Calls our /auth/google/ endpoint with the credential ID token.
 */
import { useEffect, useRef } from 'react'

export function GoogleOAuthButton({ onSuccess, onError, label = 'Continue with Google' }) {
  const buttonRef = useRef(null)

  useEffect(() => {
    // Load GIS script if not present
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGoogle
      document.head.appendChild(script)
    } else {
      initGoogle()
    }

    function initGoogle() {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      })
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
        })
      }
    }

    function handleCredentialResponse(response) {
      if (response.credential) {
        onSuccess(response.credential)
      } else {
        onError?.('Google sign-in failed. Please try again.')
      }
    }
  }, [onSuccess, onError])

  return (
    <div style={{ width: '100%' }}>
      <div ref={buttonRef} style={{ width: '100%' }} />
      {/* Fallback if GIS button doesn't render (e.g. ad blocker) */}
      {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <button
          disabled
          style={{ ...fallbackStyle, opacity: 0.4, cursor: 'not-allowed' }}
          type="button"
          title="Google sign-in not configured"
        >
          <GoogleIcon />
          {label}
        </button>
      )}
    </div>
  )
}

const fallbackStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  border: '1px solid var(--gray-200)',
  borderRadius: 'var(--radius)',
  background: 'var(--white)',
  color: 'var(--gray-700)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.9rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.044l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.956L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

/**
 * GRADSKOOL — usePayments + useContent Hooks
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../lib/api'

// ── PAYMENTS ──────────────────────────────────────────────────────────────────

export function useRazorpay() {
  const loaded = useRef(false)

  const loadRazorpay = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (loaded.current && window.Razorpay) { resolve(window.Razorpay); return }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => { loaded.current = true; resolve(window.Razorpay) }
      script.onerror = () => reject(new Error('Razorpay script failed to load'))
      document.body.appendChild(script)
    })
  }, [])

  return { loadRazorpay }
}

export function useCreateOrder() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const createOrder = async (planId) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/payments/create-order/', { plan_id: planId })
      return { success: true, data }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create order.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsLoading(false)
    }
  }

  return { createOrder, isLoading, error }
}

export function useVerifyPayment() {
  const verify = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    try {
      const { data } = await api.post('/payments/verify/', {
        razorpay_order_id, razorpay_payment_id, razorpay_signature
      })
      return { success: true, data }
    } catch {
      return { success: false }
    }
  }
  return { verify }
}

export function useOrderHistory() {
  const [orders, setOrders]     = useState([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/payments/orders/')
      .then(({ data }) => setOrders(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { orders, isLoading }
}

// ── ENROLLMENT ACCESS ─────────────────────────────────────────────────────────

export function useExamAccess(examSlug) {
  const [access, setAccess]     = useState(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    if (!examSlug) return
    api.get(`/enrollments/access/${examSlug}/`)
      .then(({ data }) => setAccess(data))
      .catch(() => setAccess(null))
      .finally(() => setLoading(false))
  }, [examSlug])

  return {
    access,
    isLoading,
    canWatchRecordings: access?.can_watch_recordings ?? false,
    canAttendLive:      access?.can_attend_live      ?? false,
    canTakeMocks:       access?.can_take_mocks       ?? false,
    canDownloadBooks:   access?.can_download_books   ?? false,
  }
}

export function useAccessSummary(enabled = true) {
  const [accesses, setAccesses] = useState([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    // Requires auth (IsAuthenticated on the backend) — callers that render for
    // logged-out visitors too (e.g. the navbar) should pass enabled=false
    // until the user is actually logged in, to avoid a pointless 401.
    if (!enabled) { setAccesses([]); setLoading(false); return }
    api.get('/enrollments/access/')
      .then(({ data }) => setAccesses(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [enabled])

  return { accesses, isLoading }
}

// ── CONTENT / VIDEO ───────────────────────────────────────────────────────────

export function useVideoList(examSlug) {
  const [data, setData]         = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!examSlug) return
    api.get(`/content/${examSlug}/videos/`)
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load videos.'))
      .finally(() => setLoading(false))
  }, [examSlug])

  return { videos: data?.videos || [], grouped: data?.grouped || {}, isLoading, error }
}

export function useStreamURL(bunnyVideoId) {
  const [streamUrl, setStreamUrl] = useState(null)
  const [meta, setMeta]           = useState(null)
  const [isLoading, setLoading]   = useState(false)
  const [error, setError]         = useState(null)

  const fetchStream = useCallback(async () => {
    if (!bunnyVideoId) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/content/videos/${bunnyVideoId}/stream/`)
      setStreamUrl(data.stream_url)
      setMeta(data)
    } catch (err) {
      const code = err.response?.data?.error?.code
      if (code === 'access_denied') {
        setError({ type: 'access_denied', message: err.response.data.error.message })
      } else {
        setError({ type: 'error', message: 'Video unavailable.' })
      }
    } finally {
      setLoading(false)
    }
  }, [bunnyVideoId])

  useEffect(() => { fetchStream() }, [fetchStream])

  return { streamUrl, meta, isLoading, error }
}

export function useVideoProgress(bunnyVideoId) {
  const save = useCallback(async ({ positionSecs, watchedSecs, isCompleted = false }) => {
    if (!bunnyVideoId) return
    try {
      await api.post(`/content/videos/${bunnyVideoId}/progress/`, {
        position_secs: positionSecs,
        watched_secs:  watchedSecs,
        is_completed:  isCompleted,
      })
    } catch {
      // Silent fail — progress save is non-critical
    }
  }, [bunnyVideoId])

  return { save }
}

export function useAINotes(bunnyVideoId) {
  const [notes, setNotes]       = useState(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    if (!bunnyVideoId) return
    api.get(`/content/videos/${bunnyVideoId}/notes/`)
      .then(({ data }) => setNotes(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [bunnyVideoId])

  return { notes, isLoading }
}

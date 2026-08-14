/**
 * GRADSKOOL — usePdfs Hooks
 *
 * Mirrors the shape of hooks/usePaymentsAndContent.js on purpose so this
 * feels like the rest of the codebase, not a bolted-on module. Reuses the
 * same `useRazorpay` script-loader — no need to duplicate that.
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { useRazorpay } from './usePaymentsAndContent'

export { useRazorpay }

// ── BROWSE ─────────────────────────────────────────────────────────────────

export function usePdfList(examSlug, fyqOnly) {
  const [pdfs, setPdfs] = useState([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const params = examSlug ? { exam: examSlug } : {}
    if (fyqOnly) params.fyq_only = '1'
    api.get('/pdfs/', { params })
      .then(({ data }) => setPdfs(data.results || data || []))
      .catch(() => setPdfs([]))
      .finally(() => setLoading(false))
  }, [examSlug, fyqOnly])

  return { pdfs, isLoading }
}

export function usePdfDetail(slug) {
  const [pdf, setPdf] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const refetch = useCallback(() => {
    if (!slug) return
    setLoading(true)
    console.log('[PDF DEBUG] Fetching:', `/pdfs/${slug}/`)
    api.get(`/pdfs/${slug}/`)
      .then(({ data }) => { console.log('[PDF DEBUG] Success:', data); setPdf(data) })
      .catch((err) => {
        console.error('[PDF DEBUG] Failed - status:', err.response?.status, 'data:', err.response?.data, 'message:', err.message)
        setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => { refetch() }, [refetch])

  return { pdf, isLoading, notFound, refetch }
}

export function useMyPdfLibrary() {
  const [purchases, setPurchases] = useState([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pdfs/my-library/')
      .then(({ data }) => setPurchases(data.results || data || []))
      .catch(() => setPurchases([]))
      .finally(() => setLoading(false))
  }, [])

  return { purchases, isLoading }
}

// ── PURCHASE ───────────────────────────────────────────────────────────────

export function useCreatePdfOrder() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const createOrder = async (slug, phone) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/pdfs/${slug}/create-order/`, { phone })
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

// Free PDFs still require login (enforced server-side) AND a phone number —
// this is the ONLY way a free PDF's access record ever gets created.
export function useClaimFreePdf() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const claim = async (slug, phone) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/pdfs/${slug}/claim-free/`, { phone })
      return { success: true, data }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Could not claim this PDF.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsLoading(false)
    }
  }

  return { claim, isLoading, error }
}

export function useVerifyPdfPayment() {
  const verify = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    try {
      const { data } = await api.post('/pdfs/verify/', {
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
      })
      return { success: true, data }
    } catch {
      return { success: false }
    }
  }
  return { verify }
}

// ── READER — fetches one watermarked page image as a blob object URL ────────

export function usePdfPageImage(slug, pageNumber) {
  const [src, setSrc] = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug || !pageNumber) return
    let objectUrl = null
    let cancelled = false

    setLoading(true)
    setError(null)

    api.get(`/pdfs/${slug}/pages/${pageNumber}/`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(data)
        setSrc(objectUrl)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.status === 403 ? 'Purchase required.' : 'Could not load this page.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [slug, pageNumber])

  return { src, isLoading, error }
}

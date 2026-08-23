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

export function usePdfList(examSlug, fyqOnly, { enabled = true } = {}) {
  const [pdfs, setPdfs] = useState([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    // Guards against firing an unfiltered fetch before the caller actually
    // knows what to filter by. Without this, on a hard page reload (not a
    // client-side navigation) router.query is briefly {} before Next.js
    // resolves it — examSlug/fyqOnly would be undefined for that first
    // render, this effect would fire a fetch of ALL published PDFs with no
    // filter, and there was no cancellation of that stale request once the
    // real params arrived — so whichever response landed last won the race.
    // On a fresh navigation the correct one usually won by luck of timing;
    // on a hard reload the wrong (unfiltered) one reliably did.
    if (!enabled) return
    const params = examSlug ? { exam: examSlug } : {}
    if (fyqOnly) params.fyq_only = '1'
    // page_size=100 added — same real gap as the admin PDF listing page
    // (pages/admin-panel/pdfs.jsx): the backend paginates at 20/page by
    // default (shared.pagination.StandardPagination), and this call never
    // requested more, silently truncating any exam/FYQ list past the
    // first 20 results. With 34 real CAT Quant FYQ PDFs now existing
    // (see seed_upcoming_quant_pdfs), this was a real, public-facing bug
    // — up to 14 purchasable topics could be invisible to actual
    // students on the library page, not just an admin-panel display gap.
    params.page_size = 100
    api.get('/pdfs/', { params })
      .then(({ data }) => setPdfs(data.results || data || []))
      .catch(() => setPdfs([]))
      .finally(() => setLoading(false))
  }, [examSlug, fyqOnly, enabled])

  return { pdfs, isLoading }
}

// `initialData` lets a page seed this from getServerSideProps (see
// pages/pdfs/[slug].jsx) — without it, isLoading starts true and the server-
// rendered HTML is just a loading spinner with no <PageSEO> tags at all,
// which is what social crawlers (WhatsApp, etc.) were seeing for every PDF
// page, since they never execute the client-side fetch. With initialData
// present, real content renders on the very first paint, server-side
// included; the client-side fetch (once `enabled`) still runs afterward to
// refine it with the personalized is_owned status once auth resolves.
export function usePdfDetail(slug, { enabled = true, initialData = null } = {}) {
  const [pdf, setPdf] = useState(initialData)
  const [isLoading, setLoading] = useState(!initialData)
  const [notFound, setNotFound] = useState(false)

  const refetch = useCallback(() => {
    if (!slug || !enabled) return
    setLoading(true)
    console.log('[PDF DEBUG] Fetching:', `/pdfs/${slug}/`)
    api.get(`/pdfs/${slug}/`)
      .then(({ data }) => { console.log('[PDF DEBUG] Success:', data); setPdf(data) })
      .catch((err) => {
        console.error('[PDF DEBUG] Failed - status:', err.response?.status, 'data:', err.response?.data, 'message:', err.message)
        setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [slug, enabled])

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

// Bundle equivalent of useCreatePdfOrder above — same shape, hits the
// new POST /pdfs/bundle/order/ endpoint (see backend apps.pdfs.views.
// CreatePdfBundleOrderView) instead of the per-slug single-PDF one.
// Reuses useVerifyPdfPayment as-is afterward — that endpoint only checks
// the three Razorpay response fields against whatever order they match,
// so it already works for bundle orders with zero changes needed there.
export function useCreatePdfBundleOrder() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const createBundleOrder = async (pdfIds, phone) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/pdfs/bundle/order/', { pdf_ids: pdfIds, phone })
      return { success: true, data }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create bundle order.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsLoading(false)
    }
  }

  return { createBundleOrder, isLoading, error }
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
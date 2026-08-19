/**
 * GRADSKOOL — useTools + useBlog + useDashboard Hooks
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

// ── TOOL TOKEN STORAGE ────────────────────────────────────────────────────────

const TOOL_TOKEN_KEY = (slug) => `gs_tool_token_${slug}`

export function getToolToken(slug) {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOOL_TOKEN_KEY(slug))
}

export function setToolToken(slug, token) {
  if (typeof window !== 'undefined') localStorage.setItem(TOOL_TOKEN_KEY(slug), token)
}

export function hasToolAccess(slug) {
  const token = getToolToken(slug)
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp > Math.floor(Date.now() / 1000)
  } catch { return false }
}

// ── TOOLS ─────────────────────────────────────────────────────────────────────

export function useToolList() {
  const [tools, setTools]   = useState([])
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    api.get('/tools/')
      .then(({ data }) => setTools(data.results || data))
      .catch(() => setError('Failed to load tools.'))
      .finally(() => setLoad(false))
  }, [])
  return { tools, loading, error }
}

export function useToolDetail(slug) {
  const [tool, setTool]    = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    if (!slug) return
    api.get(`/tools/${slug}/`)
      .then(({ data }) => setTool(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [slug])
  return { tool, loading }
}

export function useToolGate(slug) {
  const [hasAccess, setHasAccess] = useState(() => hasToolAccess(slug))
  const [loading, setLoad]        = useState(false)
  const [error, setError]         = useState(null)

  const submitGate = useCallback(async ({ name, email, targetExam }) => {
    setLoad(true)
    setError(null)
    try {
      const { data } = await api.post(`/tools/${slug}/gate/`, {
        name, email, target_exam: targetExam,
      })
      setToolToken(slug, data.access_token)
      setHasAccess(true)
      return { success: true, isNewLead: data.is_new_lead }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Something went wrong.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoad(false)
    }
  }, [slug])

  return { hasAccess, submitGate, loading, error }
}

export function usePassageList(slug, params = {}) {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    if (!slug) return
    const token = getToolToken(slug)
    const query = new URLSearchParams(params).toString()
    api.get(`/tools/${slug}/passages/${query ? '?' + query : ''}`, {
      headers: token ? { 'X-Tool-Token': token } : {},
    })
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [slug, JSON.stringify(params)])

  return { passages: data?.passages || [], categories: data?.categories || [], loading }
}

export function usePassageDetail(slug, id) {
  const [passage, setPassage] = useState(null)
  const [loading, setLoad]    = useState(true)

  useEffect(() => {
    if (!slug || !id) return
    const token = getToolToken(slug)
    api.get(`/tools/${slug}/passages/${id}/`, {
      headers: token ? { 'X-Tool-Token': token } : {},
    })
      .then(({ data }) => setPassage(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [slug, id])

  return { passage, loading }
}

export function useVocabList(slug, params = {}) {
  const [words, setWords]  = useState([])
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    if (!slug) return
    const token = getToolToken(slug)
    const query = new URLSearchParams(params).toString()
    api.get(`/tools/${slug}/vocab/${query ? '?' + query : ''}`, {
      headers: token ? { 'X-Tool-Token': token } : {},
    })
      .then(({ data }) => setWords(data.results || data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [slug, JSON.stringify(params)])

  return { words, loading }
}

export function useQATopics(slug) {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    if (!slug) return
    const token = getToolToken(slug)
    api.get(`/tools/${slug}/qa-topics/`, {
      headers: token ? { 'X-Tool-Token': token } : {},
    })
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [slug])

  return { topics: data?.topics || [], categories: data?.categories || [], loading }
}

export function useQATopicDetail(slug, id) {
  const [topic, setTopic]  = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    if (!slug || !id) return
    const token = getToolToken(slug)
    api.get(`/tools/${slug}/qa-topics/${id}/`, {
      headers: token ? { 'X-Tool-Token': token } : {},
    })
      .then(({ data }) => setTopic(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [slug, id])

  return { topic, loading }
}

export function useAnswerCheck(slug) {
  const checkAnswer = useCallback(async ({ questionId, selected, timeSpent = 0 }) => {
    try {
      const { data } = await api.post(`/tools/${slug}/questions/answer/`, {
        question_id: questionId, selected, time_spent: timeSpent,
      })
      return data
    } catch { return null }
  }, [slug])
  return { checkAnswer }
}

// ── BLOG ──────────────────────────────────────────────────────────────────────

export function useBlogPosts(params = {}) {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    const query = new URLSearchParams(params).toString()
    api.get(`/blog/posts/${query ? '?' + query : ''}`)
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [JSON.stringify(params)])

  return { posts: data?.results || [], count: data?.count || 0, loading }
}

// `initialData` lets pages/blog/[slug].jsx seed this from
// getServerSideProps — without it, loading starts true and the server-
// rendered HTML is just a skeleton with no <Head> tags at all (the page
// bails out with `if (loading) return <Skel/>` before the Head block
// with title/og:image ever renders), which is what WhatsApp/social
// crawlers were seeing for every blog post, since they never execute the
// client-side fetch. Same fix already applied to PDF pages earlier.
export function useBlogPost(slug, initialData = null) {
  const [post, setPost]    = useState(initialData)
  const [loading, setLoad] = useState(!initialData)

  useEffect(() => {
    if (!slug) return
    api.get(`/blog/posts/${slug}/`)
      .then(({ data }) => setPost(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [slug])

  return { post, loading }
}

export function useBlogTags() {
  const [tags, setTags]    = useState([])
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    api.get('/blog/tags/')
      .then(({ data }) => setTags(data.results || data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [])

  return { tags, loading }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export function useDashboardSummary() {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    api.get('/dashboard/summary/')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [])

  return { summary: data, loading }
}

export function usePerformanceTrend(days = 30) {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)

  useEffect(() => {
    api.get(`/dashboard/performance/?days=${days}`)
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [days])

  return { trend: data, loading }
}

export function useRecentActivity() {
  const [events, setEvents] = useState([])
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    api.get('/dashboard/activity/')
      .then(({ data }) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [])

  return { events, loading }
}
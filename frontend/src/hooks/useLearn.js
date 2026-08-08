/**
 * GRADSKOOL — Learning Portal Hooks
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../lib/api'

// ── TOPIC SEQUENCE ────────────────────────────────────────────────────────────

export function useTopicSequence(examSlug, topicSlug) {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)
  const [error, setError]  = useState(null)

  const refetch = useCallback(() => {
    if (!examSlug || !topicSlug) return
    setLoad(true)
    api.get(`/learn/${examSlug}/${topicSlug}/`)
      .then(({ data }) => setData(data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoad(false))
  }, [examSlug, topicSlug])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refetch }
}

// ── WATCH PROGRESS ────────────────────────────────────────────────────────────

export function useLearnProgress(examSlug, topicSlug, topicVideoId) {
  const timerRef = useRef(null)

  const saveProgress = useCallback(({ watchPct, watchedSecs, positionSecs }) => {
    if (!topicVideoId) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      api.post(`/learn/${examSlug}/${topicSlug}/videos/${topicVideoId}/progress/`, {
        watch_pct:    watchPct,
        watched_secs: watchedSecs,
        position_secs: positionSecs,
      }).catch(() => {})
    }, 500)
  }, [examSlug, topicSlug, topicVideoId])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { saveProgress }
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────

export function useQuiz(examSlug, topicSlug, topicVideoId) {
  const [questions, setQs]  = useState([])
  const [loading, setLoad]  = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSub] = useState(false)

  const fetchQuestions = useCallback(async (reshuffle = false) => {
    if (!topicVideoId) return
    setLoad(true)
    setResult(null)
    try {
      const { data } = await api.get(
        `/learn/${examSlug}/${topicSlug}/videos/${topicVideoId}/quiz/`,
        { params: reshuffle ? { reshuffle: 'true' } : {} }
      )
      setQs(data.questions || [])
    } catch (err) {
      setQs([])
    } finally {
      setLoad(false)
    }
  }, [examSlug, topicSlug, topicVideoId])

  const submitAnswers = useCallback(async (answers, timeTakenSecs = 0) => {
    setSub(true)
    try {
      const { data } = await api.post(
        `/learn/${examSlug}/${topicSlug}/videos/${topicVideoId}/quiz/submit/`,
        { answers, time_taken_secs: timeTakenSecs }
      )
      setResult(data)
      return data
    } catch (err) {
      return { error: 'Submit failed' }
    } finally {
      setSub(false)
    }
  }, [examSlug, topicSlug, topicVideoId])

  return { questions, loading, result, submitting, fetchQuestions, submitAnswers }
}

// ── CHEAT SHEET ───────────────────────────────────────────────────────────────

export function useCheatSheet(examSlug, topicSlug, topicVideoId) {
  const [data, setData]      = useState(null)
  const [loading, setLoad]   = useState(false)
  const [opening, setOpening] = useState(false)

  const fetchCheatSheet = useCallback(async () => {
    if (!topicVideoId) return
    setLoad(true)
    try {
      const { data } = await api.get(
        `/learn/${examSlug}/${topicSlug}/videos/${topicVideoId}/cheatsheet/`
      )
      setData(data)
    } catch {
      setData({ available: false, reason: 'Failed to load' })
    } finally {
      setLoad(false)
    }
  }, [examSlug, topicSlug, topicVideoId])

  const markOpened = useCallback(async () => {
    setOpening(true)
    try {
      const { data } = await api.post(
        `/learn/${examSlug}/${topicSlug}/videos/${topicVideoId}/cheatsheet/open/`
      )
      return data
    } catch {
      return { success: false }
    } finally {
      setOpening(false)
    }
  }, [examSlug, topicSlug, topicVideoId])

  return { data, loading, opening, fetchCheatSheet, markOpened }
}

// ── useTopicDetail ────────────────────────────────────────────────────────────
export function useTopicDetail(examSlug, sectionSlug, topicSlug) {
  const [data,    setData]  = useState(null)
  const [loading, setLoad]  = useState(true)
  const [error,   setError] = useState(null)

  useEffect(() => {
    if (!examSlug || !sectionSlug || !topicSlug) return
    setLoad(true)
    api.get(`/learn/${examSlug}/sections/${sectionSlug}/${topicSlug}/`)
      .then(({ data: d }) => setData(d))
      .catch(e => setError(e))
      .finally(() => setLoad(false))
  }, [examSlug, sectionSlug, topicSlug])

  return { data, loading, error }
}

/**
 * GRADSKOOL — useExam Hooks
 *
 * Data-fetching hooks for the courses module.
 * Uses SWR for client-side caching + revalidation.
 * Falls back gracefully to loading / error states.
 */
import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

// Simple in-memory cache to avoid redundant fetches within a session
const _cache = new Map()

function useApiGet(url, { enabled = true } = {}) {
  const [data, setData] = useState(_cache.get(url) ?? null)
  const [isLoading, setIsLoading] = useState(!_cache.has(url) && enabled)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!url || !enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get(url)
      _cache.set(url, res.data)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load data.')
    } finally {
      setIsLoading(false)
    }
  }, [url, enabled])

  useEffect(() => {
    if (!_cache.has(url)) fetch()
  }, [url, fetch])

  return { data, isLoading, error, refetch: fetch }
}

// ── PUBLIC HOOKS ─────────────────────────────────────────────────────────────

export function useHomepageData() {
  return useApiGet('/courses/homepage/')
}

export function useExamList(params = {}) {
  const query = new URLSearchParams(params).toString()
  return useApiGet(`/courses/exams/${query ? '?' + query : ''}`)
}

export function useExamDetail(slug) {
  return useApiGet(slug ? `/courses/exams/${slug}/` : null, { enabled: !!slug })
}

export function useExamPlans(slug) {
  return useApiGet(slug ? `/courses/exams/${slug}/plans/` : null, { enabled: !!slug })
}

export function useInstructors() {
  return useApiGet('/courses/instructors/')
}

export function useTestimonials(params = {}) {
  const query = new URLSearchParams(params).toString()
  return useApiGet(`/courses/testimonials/${query ? '?' + query : ''}`)
}

// ── COUNTDOWN ────────────────────────────────────────────────────────────────

export function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(targetDate))

  useEffect(() => {
    if (!targetDate) return
    const timer = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

function calcTimeLeft(target) {
  if (!target) return null
  const diff = new Date(target) - new Date()
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, done: true }
  return {
    days:  Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    mins:  Math.floor((diff / 1000 / 60) % 60),
    secs:  Math.floor((diff / 1000) % 60),
    done: false,
  }
}

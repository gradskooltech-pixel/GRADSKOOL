/**
 * GRADSKOOL — Admin Analytics Hooks
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

function useAdminAPI(endpoint, params = {}) {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)
  const [error, setError]  = useState(null)

  useEffect(() => {
    const query = new URLSearchParams(params).toString()
    api.get(`/admin/${endpoint}${query ? '?' + query : ''}`)
      .then(({ data }) => setData(data))
      .catch(err => setError(err.response?.status === 403 ? 'Access denied' : 'Failed to load'))
      .finally(() => setLoad(false))
  }, [endpoint, JSON.stringify(params)])

  return { data, loading, error }
}

export const useAdminOverview    = ()      => useAdminAPI('overview/')
export const useAdminRevenue     = (days)  => useAdminAPI('revenue/', { days })
export const useAdminCohorts     = ()      => useAdminAPI('cohorts/')
export const useAdminTools       = ()      => useAdminAPI('tools-analytics/')
export const useAdminNotifications = ()    => useAdminAPI('notifications-analytics/')
export const useLeadAnalytics    = ()      => useAdminAPI('', {})  // from leads app

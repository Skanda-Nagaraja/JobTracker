import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Job } from '../types'

export function useJobs(filters?: { q?: string; company?: string; recentOnly?: boolean }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const from = (name: string) =>
      supabase.from(name).select('id, company, title, location, url, source, created_at')

    // Prefer recent-20 view if present, then public, then table
    const sourcesToTry = filters?.recentOnly
      ? ['jobs_public_recent_20', 'jobs_public', 'jobs']
      : ['jobs_public', 'jobs']

    let lastError: any = null
    for (const source of sourcesToTry) {
      let query: any = from(source).order('created_at', { ascending: false }).limit(50)
      if (filters?.company) query = query.ilike('company', `%${filters.company}%`)
      if (filters?.q) query = query.or(`title.ilike.%${filters.q}%,company.ilike.%${filters.q}%`)
      const { data, error } = await query
      if (!error) {
        let result = (data as Job[]) || []
        if (filters?.recentOnly) {
          result = result.slice(0, 20) // keep a rolling queue of 20 newest
        }
        setJobs(result)
        setLoading(false)
        setError(null)
        return
      }
      lastError = error
    }
    setError(lastError?.message || 'Failed to load jobs')
    setLoading(false)
  }, [filters?.company, filters?.q, filters?.recentOnly])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return { jobs, loading, error, refresh: fetchJobs }
}



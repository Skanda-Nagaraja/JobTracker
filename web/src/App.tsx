import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { Job } from './types'
import JobCard from './components/JobCard'
import SearchBar from './components/SearchBar'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [company, setCompany] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    // Prefer public view if present, fallback to base table
    const from = (name: string) =>
      supabase.from(name).select('id, company, title, location, url, source, created_at')
    let query = from('jobs_public')
      .order('created_at', { ascending: false })
      .limit(500)
    if (company) query = query.ilike('company', `%${company}%`)
    if (q) query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%`)
    let { data, error } = await query
    if (error && error.message?.toLowerCase().includes('not found')) {
      let q2 = from('jobs').order('created_at', { ascending: false }).limit(500)
      if (company) q2 = q2.ilike('company', `%${company}%`)
      if (q) q2 = q2.or(`title.ilike.%${q}%,company.ilike.%${q}%`)
      const res = await q2
      data = res.data as any
      error = res.error as any
    }
    if (error) {
      setError(error.message)
    } else {
      setJobs((data as Job[]) || [])
    }
    setLoading(false)
  }, [q, company])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const grouped = useMemo(() => groupJobsBySource(jobs), [jobs])

  return (
    <>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            JobTracker
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Newest per source first. Search and filter to narrow results.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <SearchBar
            onChange={(qVal, companyVal) => {
              setQ(qVal)
              setCompany(companyVal)
            }}
          />
        </Box>
        <Box component="main" sx={{ mt: 3 }}>
          {loading && <Typography color="text.secondary">Loading…</Typography>}
          {error && (
            <Box sx={{ border: '1px solid #fecaca', bgcolor: '#fee2e2', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            </Box>
          )}
          {!loading && !error && (
            <Box sx={{ display: 'grid', gap: 4 }}>
              {grouped.map((group) => (
                <section key={group.source}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {group.source}
                    </Typography>
                    <Chip label={group.jobs.length} size="small" />
                  </Box>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {group.jobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </Box>
                </section>
              ))}
              {grouped.length === 0 && (
                <Box sx={{ border: '1px solid #e5e7eb', p: 3, borderRadius: 1 }}>
                  <Typography color="text.secondary">No results. Try a broader search.</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </>
  )
}

function groupJobsBySource(jobs: Job[]): Array<{ source: string; jobs: Job[]; latest: number }> {
  const bySource = new Map<string, Job[]>()
  for (const job of jobs) {
    const key = job.source || 'Unknown'
    if (!bySource.has(key)) bySource.set(key, [])
    bySource.get(key)!.push(job)
  }
  const groups: Array<{ source: string; jobs: Job[]; latest: number }> = []
  for (const [source, list] of bySource.entries()) {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const latest = list.length ? new Date(list[0].created_at).getTime() : 0
    groups.push({ source, jobs: list, latest })
  }
  groups.sort((a, b) => b.latest - a.latest)
  return groups
}



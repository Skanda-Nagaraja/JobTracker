import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import JobCard from '../components/JobCard'
import { useJobs } from '../hooks/useJobs'
import { useProfile } from '../hooks/useProfile'
import { rankJobs, type JobMatch } from '../lib/jobMatcher'

export default function Jobs() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'match' | 'date'>('match')
  const [minScore, setMinScore] = useState(0)
  const { jobs, loading, error } = useJobs({ recentOnly: true })
  const { profile } = useProfile()

  const sources = useMemo(() => {
    const s = Array.from(new Set(jobs.map(j => j.source || 'Unknown')))
    return s.sort()
  }, [jobs])

  // Rank all jobs by match score
  const rankedJobs = useMemo(() => {
    return rankJobs(jobs, profile)
  }, [jobs, profile])

  // Apply filters
  const filteredMatches = useMemo(() => {
    let result = rankedJobs

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.job.title?.toLowerCase().includes(q) ||
        m.job.company?.toLowerCase().includes(q) ||
        m.job.location?.toLowerCase().includes(q)
      )
    }

    // Source filter
    if (sourceFilter !== 'all') {
      result = result.filter(m => (m.job.source || 'Unknown') === sourceFilter)
    }

    // Minimum score filter
    if (minScore > 0) {
      result = result.filter(m => m.score >= minScore)
    }

    // Sort
    if (sortBy === 'date') {
      result = [...result].sort((a, b) => 
        new Date(b.job.created_at).getTime() - new Date(a.job.created_at).getTime()
      )
    }
    // If sortBy === 'match', already sorted by score from rankJobs

    return result
  }, [rankedJobs, search, sourceFilter, minScore, sortBy])

  // Stats
  const avgScore = filteredMatches.length > 0 
    ? Math.round(filteredMatches.reduce((sum, m) => sum + m.score, 0) / filteredMatches.length)
    : 0
  const highMatches = filteredMatches.filter(m => m.score >= 60).length

  // Group by source for display (limited to 10 per source)
  const grouped = useMemo(() => {
    const bySource = new Map<string, JobMatch[]>()
    for (const match of filteredMatches) {
      const key = match.job.source || 'Unknown'
      if (!bySource.has(key)) bySource.set(key, [])
      bySource.get(key)!.push(match)
    }
    
    return Array.from(bySource.entries())
      .map(([source, list]) => ({
        source,
        matches: list.slice(0, 10),
        count: list.length,
        avgScore: Math.round(list.reduce((sum, m) => sum + m.score, 0) / list.length)
      }))
      .sort((a, b) => sortBy === 'match' ? b.avgScore - a.avgScore : b.count - a.count)
  }, [filteredMatches, sortBy])

  const totalDisplayed = grouped.reduce((sum, g) => sum + g.matches.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Job Listings</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${totalDisplayed} jobs from ${grouped.length} sources`}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="pl-9 w-52"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {formatSource(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'match' | 'date')}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="date">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Match Stats & Filter */}
        {profile && !loading && (
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                      {avgScore}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Match</p>
                      <p className="font-semibold text-sm">Score</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">High Matches</p>
                    <p className="font-semibold text-sm">{highMatches} jobs (60%+)</p>
                  </div>
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Min Score:</span>
                  <Slider
                    value={[minScore]}
                    onValueChange={([v]) => setMinScore(v)}
                    max={80}
                    step={10}
                    className="flex-1 max-w-xs"
                  />
                  <Badge variant="secondary" className="w-12 justify-center">
                    {minScore}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-700 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-6">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Listings */}
      {!loading && !error && (
        <div className="space-y-6">
          {grouped.map((group) => (
            <Card key={group.source}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${getSourceColor(group.source)}`}>
                      {getSourceIcon(group.source)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{formatSource(group.source)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Showing {group.matches.length} of {group.count} jobs • Avg match: {group.avgScore}%
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{group.count}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3 md:grid-cols-2">
                  {group.matches.map((match) => (
                    <JobCard 
                      key={match.job.id} 
                      job={match.job} 
                      matchScore={match.score}
                      matchReasons={match.matchReasons}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {grouped.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-semibold mb-1">No jobs found</h3>
                <p className="text-sm text-muted-foreground">
                  {minScore > 0 
                    ? `Try lowering the minimum match score (currently ${minScore}%)`
                    : 'Try adjusting your search or filters'}
                </p>
                {minScore > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setMinScore(0)}
                  >
                    Clear Score Filter
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function formatSource(source: string): string {
  if (source.includes('linkedin')) return 'LinkedIn Jobs'
  if (source.includes('simplify') || source.includes('SimplifyJobs')) return 'SimplifyJobs'
  if (source.includes('vansh')) return 'New Grad 2026'
  if (source.includes('speedy')) return 'SpeedyApply'
  if (source.includes('github')) return 'GitHub'
  return source.split('/').pop()?.replace(/-/g, ' ') || source
}

function getSourceColor(source: string): string {
  if (source.includes('linkedin')) return 'bg-blue-600'
  if (source.includes('simplify')) return 'bg-emerald-600'
  if (source.includes('vansh')) return 'bg-purple-600'
  if (source.includes('speedy')) return 'bg-orange-600'
  return 'bg-slate-600'
}

function getSourceIcon(source: string): string {
  if (source.includes('linkedin')) return 'in'
  if (source.includes('simplify')) return 'S'
  if (source.includes('vansh')) return 'V'
  if (source.includes('speedy')) return '⚡'
  return source[0]?.toUpperCase() || '?'
}

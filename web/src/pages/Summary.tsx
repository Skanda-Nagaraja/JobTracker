import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useJobs } from '../hooks/useJobs'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile, PERSONA_CONFIG } from '../hooks/useProfile'

const STATUS_OPTIONS = ['Saved', 'Applied', 'OA', 'Interview', 'Final', 'Offer', 'Rejected'] as const
type Status = typeof STATUS_OPTIONS[number]

const statusColors: Record<Status, string> = {
  Saved: 'bg-slate-100 text-slate-700 border-slate-200',
  Applied: 'bg-blue-100 text-blue-700 border-blue-200',
  OA: 'bg-purple-100 text-purple-700 border-purple-200',
  Interview: 'bg-amber-100 text-amber-700 border-amber-200',
  Final: 'bg-orange-100 text-orange-700 border-orange-200',
  Offer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
}

export default function Summary() {
  const { jobs, loading } = useJobs({ recentOnly: true })
  const { user } = useAuth()
  const { profile, getSkillRecommendations } = useProfile()
  const [apps, setApps] = useState<any[]>([])
  
  // Get persona names for display
  const targetRoleNames = profile?.target_roles?.map(r => PERSONA_CONFIG[r]?.name || r) || []
  const skillRecs = getSkillRecommendations().slice(0, 5)

  useEffect(() => {
    if (!user) return
    supabase
      .from('applications')
      .select('id,status,created_at,source,job_url,job_id,jobs(title,company)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(({ data }) => setApps(data || []))
      .catch(() => setApps([]))
  }, [user])

  const stats = useMemo(() => {
    const total = jobs.length
    const applied = apps.length
    const interviews = apps.filter(a => a.status === 'Interview' || a.status === 'Final').length
    const offers = apps.filter(a => a.status === 'Offer').length
    const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0
    const offerRate = applied > 0 ? Math.round((offers / applied) * 100) : 0
    return { total, applied, interviews, offers, interviewRate, offerRate }
  }, [jobs, apps])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    STATUS_OPTIONS.forEach(s => counts[s] = 0)
    apps.forEach(a => counts[a.status] = (counts[a.status] || 0) + 1)
    return counts
  }, [apps])

  const sourceData = useMemo(() => {
    const map = new Map<string, number>()
    jobs.forEach(j => {
      const src = j.source || 'Other'
      map.set(src, (map.get(src) || 0) + 1)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [jobs])

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const deleteApp = async (id: string) => {
    await supabase.from('applications').delete().eq('id', id)
    setApps(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 👋
          </h1>
          <p className="text-muted-foreground">Track your job search progress</p>
          {targetRoleNames.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Targeting:</span>
              {targetRoleNames.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
              <Link to="/onboarding">
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                  Edit →
                </Button>
              </Link>
            </div>
          )}
        </div>
        {skillRecs.length > 0 && (
          <Card className="w-64 shrink-0 hidden lg:block">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">🎯 Focus Skills</p>
              <div className="flex flex-wrap gap-1">
                {skillRecs.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Jobs Discovered"
          value={stats.total}
          subtitle="From all sources"
          trend={loading ? undefined : '+12 today'}
          icon="📊"
        />
        <StatCard
          title="Applications"
          value={stats.applied}
          subtitle="Total submitted"
          icon="📝"
        />
        <StatCard
          title="Interview Rate"
          value={`${stats.interviewRate}%`}
          subtitle={`${stats.interviews} interviews`}
          icon="💼"
        />
        <StatCard
          title="Offers"
          value={stats.offers}
          subtitle={stats.offerRate > 0 ? `${stats.offerRate}% success rate` : 'Keep going!'}
          icon="🎉"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline Overview - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Application Pipeline</CardTitle>
            <CardDescription>Your journey from discovery to offer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {STATUS_OPTIONS.map((status, i) => (
                <div key={status} className="flex items-center">
                  <PipelineStage
                    status={status}
                    count={statusCounts[status]}
                    isLast={i === STATUS_OPTIONS.length - 1}
                  />
                  {i < STATUS_OPTIONS.length - 1 && (
                    <div className="w-8 h-0.5 bg-slate-200 mx-1" />
                  )}
                </div>
              ))}
            </div>

            {/* Visual funnel */}
            <div className="mt-6 space-y-2">
              {['Applied', 'Interview', 'Offer'].map((stage) => {
                const count = statusCounts[stage] || 0
                const max = Math.max(apps.length, 1)
                const width = (count / max) * 100
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">{stage}</span>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg transition-all duration-500 flex items-center px-3 ${
                          stage === 'Applied' ? 'bg-blue-500' :
                          stage === 'Interview' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(width, count > 0 ? 10 : 0)}%` }}
                      >
                        {count > 0 && <span className="text-white text-sm font-medium">{count}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sources Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Job Sources</CardTitle>
            <CardDescription>Where your jobs come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sourceData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                sourceData.map(([source, count]) => {
                  const percent = Math.round((count / jobs.length) * 100)
                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{formatSource(source)}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Applications</CardTitle>
              <CardDescription>Manage and track your applications</CardDescription>
            </div>
            <Tabs defaultValue="all" className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="active" className="text-xs px-3">Active</TabsTrigger>
                <TabsTrigger value="archived" className="text-xs px-3">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold mb-1">No applications yet</h3>
              <p className="text-sm text-muted-foreground">
                Start applying to jobs from the Job Listings page
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {apps.slice(0, 10).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg shrink-0">
                      {app.jobs?.company?.[0]?.toUpperCase() || '💼'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{app.jobs?.title || 'Unknown Position'}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {app.jobs?.company || 'Unknown Company'} • {formatDate(app.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Select
                      value={app.status}
                      onValueChange={(v) => updateStatus(app.id, v)}
                    >
                      <SelectTrigger className={`w-28 h-8 text-xs border ${statusColors[app.status as Status] || ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteApp(app.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              ))}

              {apps.length > 10 && (
                <Button variant="ghost" className="w-full mt-2">
                  View all {apps.length} applications →
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, subtitle, trend, icon }: {
  title: string
  value: string | number
  subtitle: string
  trend?: string
  icon: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="text-2xl">{icon}</div>
        </div>
        {trend && (
          <div className="mt-3 pt-3 border-t">
            <span className="text-xs text-emerald-600 font-medium">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PipelineStage({ status, count, isLast }: { status: string; count: number; isLast: boolean }) {
  const colors: Record<string, string> = {
    Saved: 'bg-slate-500',
    Applied: 'bg-blue-500',
    OA: 'bg-purple-500',
    Interview: 'bg-amber-500',
    Final: 'bg-orange-500',
    Offer: 'bg-emerald-500',
    Rejected: 'bg-red-500',
  }

  return (
    <div className="flex flex-col items-center min-w-[70px]">
      <div className={`w-10 h-10 rounded-full ${colors[status]} flex items-center justify-center text-white font-semibold text-sm`}>
        {count}
      </div>
      <span className="text-xs text-muted-foreground mt-1.5 text-center">{status}</span>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

function formatSource(source: string): string {
  if (source.includes('linkedin')) return 'LinkedIn'
  if (source.includes('simplify')) return 'SimplifyJobs'
  if (source.includes('vansh')) return 'New Grad 2026'
  if (source.includes('speedy')) return 'SpeedyApply'
  return source.split('/').pop() || source
}

function formatDate(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

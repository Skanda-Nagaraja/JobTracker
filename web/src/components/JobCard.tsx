import { useEffect, useState } from 'react'
import { Job } from '../types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const STATUS_OPTIONS = ['Saved', 'Applied', 'OA', 'Interview', 'Final', 'Offer', 'Rejected'] as const

interface JobCardProps {
  job: Job
  matchScore?: number
  matchReasons?: string[]
}

export default function JobCard({ job, matchScore, matchReasons = [] }: JobCardProps) {
  const { user } = useAuth()
  const company = job.company || 'Unknown company'
  const title = job.title || company
  const location = job.location || ''
  const date = new Date(job.created_at)
  const dateLabel = isNaN(date.getTime()) ? '' : formatDate(date)
  
  const [status, setStatus] = useState<string>('')
  const [appId, setAppId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadStatus() {
      if (!user) return
      const { data, error } = await supabase
        .from('applications')
        .select('id,status')
        .eq('user_id', user.id)
        .eq('job_id', job.id)
        .limit(1)
        .maybeSingle()
      if (!mounted) return
      if (!error && data) {
        setAppId(data.id)
        setStatus(data.status)
      }
    }
    loadStatus()
    return () => { mounted = false }
  }, [user, job.id])

  async function upsertStatus(nextStatus: string) {
    try {
      if (!user) return
      setSaving(true)
      if (appId) {
        const { error } = await supabase
          .from('applications')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', appId)
        if (!error) setStatus(nextStatus)
      } else {
        const { data, error } = await supabase
          .from('applications')
          .insert({
            user_id: user.id,
            job_id: job.id,
            job_url: job.url,
            status: nextStatus,
            source: job.source,
          })
          .select('id')
          .single()
        if (!error && data) {
          setAppId(data.id)
          setStatus(nextStatus)
        }
      }
    } catch (e) {
      console.error('status update error', e)
    } finally {
      setSaving(false)
    }
  }

  async function handleApply() {
    await upsertStatus('Applied')
    window.open(job.url, '_blank')
  }

  // Match score colors
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500 text-white'
    if (score >= 50) return 'bg-amber-500 text-white'
    if (score >= 30) return 'bg-slate-400 text-white'
    return 'bg-slate-200 text-slate-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Great Match'
    if (score >= 50) return 'Good Match'
    if (score >= 30) return 'Fair Match'
    return 'Low Match'
  }

  return (
    <div className={`group p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200 ${
      matchScore && matchScore >= 70 ? 'ring-2 ring-emerald-500/20' : ''
    }`}>
      <div className="flex gap-3">
        {/* Company Logo Placeholder */}
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 shrink-0 relative">
          {company[0]?.toUpperCase() || '?'}
          {matchScore !== undefined && (
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${getScoreColor(matchScore)}`}>
              {matchScore}
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate pr-2" title={title}>
                {title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {company}
                {location && <span className="text-slate-300 mx-1.5">•</span>}
                {location}
              </p>
            </div>
          </div>

          {/* Match Reasons & Date */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {matchScore !== undefined && matchScore >= 30 && (
              <Badge 
                variant="secondary" 
                className={`text-[10px] px-1.5 py-0 h-5 ${
                  matchScore >= 70 ? 'bg-emerald-100 text-emerald-700' : 
                  matchScore >= 50 ? 'bg-amber-100 text-amber-700' : 
                  'bg-slate-100 text-slate-600'
                }`}
              >
                {getScoreLabel(matchScore)}
              </Badge>
            )}
            {matchReasons.slice(0, 2).map((reason, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                {reason}
              </Badge>
            ))}
            {dateLabel && (
              <span className="text-xs text-muted-foreground ml-auto">{dateLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
        {user && (
          <Select
            value={status || undefined}
            onValueChange={upsertStatus}
            disabled={saving}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Track status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Button
          size="sm"
          className="h-8 px-4 bg-primary hover:bg-primary/90"
          onClick={handleApply}
        >
          Apply →
        </Button>
      </div>
    </div>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

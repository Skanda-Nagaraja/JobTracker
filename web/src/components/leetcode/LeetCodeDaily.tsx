import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PROBLEMS, type Problem } from './problemData'

const difficultyStyles = {
  Easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  Medium: 'bg-amber-500/10 text-amber-600 border-amber-200',
  Hard: 'bg-red-500/10 text-red-600 border-red-200',
}

interface Props {
  onSelectProblem: (problem: Problem) => void
}

export default function LeetCodeDaily({ onSelectProblem }: Props) {
  const [todayProblem, setTodayProblem] = useState<Problem | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    // Get problem based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    setTodayProblem(PROBLEMS[dayOfYear % PROBLEMS.length])
    
    // Load streak from localStorage
    const savedStreak = localStorage.getItem('lc_streak')
    if (savedStreak) setStreak(parseInt(savedStreak))
  }, [])

  const markCompleted = () => {
    const newStreak = streak + 1
    setStreak(newStreak)
    localStorage.setItem('lc_streak', newStreak.toString())
    localStorage.setItem('lc_last_completed', new Date().toDateString())
  }

  if (!todayProblem) return null

  return (
    <div className="space-y-6">
      {/* Streak Banner */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Streak</p>
              <p className="text-4xl font-bold">{streak} days 🔥</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Today's Challenge</p>
              <Badge className={difficultyStyles[todayProblem.difficulty]} variant="secondary">
                {todayProblem.difficulty}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Problem Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{todayProblem.id}. {todayProblem.title}</CardTitle>
              <CardDescription className="mt-1">
                Acceptance Rate: {todayProblem.acceptance}
              </CardDescription>
            </div>
            <Badge className={difficultyStyles[todayProblem.difficulty]}>
              {todayProblem.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm line-clamp-3">
            {todayProblem.description.split('\n')[0]}
          </p>

          <div className="flex flex-wrap gap-1">
            {todayProblem.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="flex-1" onClick={() => onSelectProblem(todayProblem)}>
              Start Solving →
            </Button>
            <Button variant="outline" onClick={markCompleted}>
              ✅ Mark Complete
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">💡 Tips</p>
            <ul className="text-muted-foreground text-xs space-y-0.5">
              <li>• Try solving it yourself first (20-30 min)</li>
              <li>• Think about edge cases</li>
              <li>• Analyze time & space complexity</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

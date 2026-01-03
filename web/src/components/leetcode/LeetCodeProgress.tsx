import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PROBLEMS } from './problemData'

const MASTERY_LEVELS = [
  { name: 'Beginner', min: 0, max: 25, color: 'bg-slate-500', emoji: '🌱' },
  { name: 'Intermediate', min: 25, max: 50, color: 'bg-blue-500', emoji: '📚' },
  { name: 'Advanced', min: 50, max: 75, color: 'bg-purple-500', emoji: '🚀' },
  { name: 'Expert', min: 75, max: 100, color: 'bg-amber-500', emoji: '🏆' },
]

export default function LeetCodeProgress() {
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(new Set())
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('lc_completed')
    if (saved) setCompletedProblems(new Set(JSON.parse(saved)))
    
    const savedStreak = localStorage.getItem('lc_streak')
    if (savedStreak) setStreak(parseInt(savedStreak))
  }, [])

  const stats = useMemo(() => {
    const totalProblems = PROBLEMS.length
    const totalCompleted = completedProblems.size
    const overallProgress = totalProblems > 0 ? Math.round((totalCompleted / totalProblems) * 100) : 0
    
    const byDifficulty = {
      easy: PROBLEMS.filter(p => p.difficulty === 'Easy'),
      medium: PROBLEMS.filter(p => p.difficulty === 'Medium'),
      hard: PROBLEMS.filter(p => p.difficulty === 'Hard'),
    }
    
    return {
      totalProblems,
      totalCompleted,
      overallProgress,
      easy: { total: byDifficulty.easy.length, completed: byDifficulty.easy.filter(p => completedProblems.has(p.id)).length },
      medium: { total: byDifficulty.medium.length, completed: byDifficulty.medium.filter(p => completedProblems.has(p.id)).length },
      hard: { total: byDifficulty.hard.length, completed: byDifficulty.hard.filter(p => completedProblems.has(p.id)).length },
    }
  }, [completedProblems])

  const masteryLevel = useMemo(() => {
    return MASTERY_LEVELS.find(l => stats.overallProgress >= l.min && stats.overallProgress < l.max) || MASTERY_LEVELS[0]
  }, [stats.overallProgress])

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Problems Solved</CardDescription>
            <CardTitle className="text-3xl">{stats.totalCompleted}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">out of {stats.totalProblems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Current Streak</CardDescription>
            <CardTitle className="text-3xl">{streak} 🔥</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Progress</CardDescription>
            <CardTitle className="text-3xl">{stats.overallProgress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.overallProgress} className="h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-white/70">Mastery Level</CardDescription>
            <CardTitle className="text-2xl">{masteryLevel.emoji} {masteryLevel.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/70">Keep going!</p>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">By Difficulty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-emerald-500/10 text-emerald-600 w-20 justify-center">Easy</Badge>
            <div className="flex-1">
              <Progress value={stats.easy.total > 0 ? (stats.easy.completed / stats.easy.total) * 100 : 0} className="h-2 [&>div]:bg-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground w-16 text-right">{stats.easy.completed}/{stats.easy.total}</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-amber-500/10 text-amber-600 w-20 justify-center">Medium</Badge>
            <div className="flex-1">
              <Progress value={stats.medium.total > 0 ? (stats.medium.completed / stats.medium.total) * 100 : 0} className="h-2 [&>div]:bg-amber-500" />
            </div>
            <span className="text-sm text-muted-foreground w-16 text-right">{stats.medium.completed}/{stats.medium.total}</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-red-500/10 text-red-600 w-20 justify-center">Hard</Badge>
            <div className="flex-1">
              <Progress value={stats.hard.total > 0 ? (stats.hard.completed / stats.hard.total) * 100 : 0} className="h-2 [&>div]:bg-red-500" />
            </div>
            <span className="text-sm text-muted-foreground w-16 text-right">{stats.hard.completed}/{stats.hard.total}</span>
          </div>
        </CardContent>
      </Card>

      {/* Mastery Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mastery Journey</CardTitle>
          <CardDescription className="text-xs">Your path to interview readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex justify-between mb-2">
              {MASTERY_LEVELS.map((level) => (
                <div key={level.name} className="text-center flex-1">
                  <p className="text-lg">{level.emoji}</p>
                  <p className={`text-xs font-medium ${stats.overallProgress >= level.min ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {level.name}
                  </p>
                </div>
              ))}
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              {MASTERY_LEVELS.map((level) => {
                const filled = Math.min(Math.max(stats.overallProgress - level.min, 0), 25)
                const filledPercent = (filled / 25) * 100
                
                return (
                  <div key={level.name} className="flex-1 relative">
                    <div
                      className={`absolute inset-y-0 left-0 ${level.color} transition-all duration-500`}
                      style={{ width: `${filledPercent}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completed Problems</CardTitle>
        </CardHeader>
        <CardContent>
          {completedProblems.size > 0 ? (
            <div className="flex flex-wrap gap-2">
              {PROBLEMS.filter(p => completedProblems.has(p.id)).map(problem => (
                <Badge 
                  key={problem.id} 
                  variant="secondary"
                  className="text-xs"
                >
                  #{problem.id} {problem.title}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No problems completed yet. Start solving to track your progress!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

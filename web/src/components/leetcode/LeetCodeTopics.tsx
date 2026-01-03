import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PROBLEMS, type Problem } from './problemData'
import { useProfile } from '@/hooks/useProfile'

interface Topic {
  name: string
  icon: string
  description: string
  color: string
  tags: string[]
}

const TOPICS: Topic[] = [
  {
    name: 'Arrays & Hashing',
    icon: '📊',
    description: 'Fundamentals of array manipulation and hash tables',
    color: 'from-blue-500 to-cyan-500',
    tags: ['Array', 'Hash Table'],
  },
  {
    name: 'Two Pointers',
    icon: '👆',
    description: 'Techniques using two pointers for optimal solutions',
    color: 'from-green-500 to-emerald-500',
    tags: ['Two Pointers'],
  },
  {
    name: 'Sliding Window',
    icon: '🪟',
    description: 'Efficient substring and subarray problems',
    color: 'from-purple-500 to-pink-500',
    tags: ['Sliding Window'],
  },
  {
    name: 'Stack',
    icon: '📚',
    description: 'LIFO data structure applications',
    color: 'from-orange-500 to-red-500',
    tags: ['Stack'],
  },
  {
    name: 'Binary Search',
    icon: '🔍',
    description: 'Divide and conquer search techniques',
    color: 'from-indigo-500 to-violet-500',
    tags: ['Binary Search'],
  },
  {
    name: 'Dynamic Programming',
    icon: '🧮',
    description: 'Optimal substructure and memoization',
    color: 'from-yellow-500 to-orange-500',
    tags: ['Dynamic Programming'],
  },
  {
    name: 'Strings',
    icon: '📝',
    description: 'String manipulation and pattern matching',
    color: 'from-teal-500 to-cyan-500',
    tags: ['String'],
  },
  {
    name: 'Sorting',
    icon: '📈',
    description: 'Sorting algorithms and applications',
    color: 'from-rose-500 to-pink-500',
    tags: ['Sorting'],
  },
]

const difficultyStyles = {
  Easy: 'bg-emerald-500/10 text-emerald-600',
  Medium: 'bg-amber-500/10 text-amber-600',
  Hard: 'bg-red-500/10 text-red-600',
}

interface Props {
  onSelectProblem: (problem: Problem) => void
}

export default function LeetCodeTopics({ onSelectProblem }: Props) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('lc_completed')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  
  const { getRecommendedTopics, getPrimaryPersona } = useProfile()
  const recommendedTopics = getRecommendedTopics()
  const persona = getPrimaryPersona()
  
  // Check if a topic is recommended for the user's persona
  const isRecommended = (topic: Topic): boolean => {
    return topic.tags.some(tag => recommendedTopics.includes(tag))
  }
  
  // Sort topics: recommended first
  const sortedTopics = [...TOPICS].sort((a, b) => {
    const aRec = isRecommended(a)
    const bRec = isRecommended(b)
    if (aRec && !bRec) return -1
    if (!aRec && bRec) return 1
    return 0
  })

  const getTopicProblems = (topic: Topic): Problem[] => {
    return PROBLEMS.filter(p => p.tags.some(t => topic.tags.includes(t)))
  }

  const getTopicProgress = (topic: Topic) => {
    const problems = getTopicProblems(topic)
    if (problems.length === 0) return 0
    const completed = problems.filter(p => completedProblems.has(p.id)).length
    return Math.round((completed / problems.length) * 100)
  }

  const toggleComplete = (problemId: number) => {
    const newCompleted = new Set(completedProblems)
    if (newCompleted.has(problemId)) {
      newCompleted.delete(problemId)
    } else {
      newCompleted.add(problemId)
    }
    setCompletedProblems(newCompleted)
    localStorage.setItem('lc_completed', JSON.stringify([...newCompleted]))
  }

  // Topic detail view
  if (selectedTopic) {
    const problems = getTopicProblems(selectedTopic)
    const progress = getTopicProgress(selectedTopic)
    const completedCount = problems.filter(p => completedProblems.has(p.id)).length

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)}>
          ← Back to Topics
        </Button>
        
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedTopic.color} flex items-center justify-center text-2xl shadow-lg`}>
                {selectedTopic.icon}
              </div>
              <div className="flex-1">
                <CardTitle>{selectedTopic.name}</CardTitle>
                <CardDescription>{selectedTopic.description}</CardDescription>
              </div>
              <Badge variant="secondary">{completedCount}/{problems.length}</Badge>
            </div>
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${
                    completedProblems.has(problem.id) ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleComplete(problem.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                        completedProblems.has(problem.id)
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-muted-foreground/30 hover:border-emerald-500'
                      }`}
                    >
                      {completedProblems.has(problem.id) && '✓'}
                    </button>
                    <div>
                      <p className={`font-medium text-sm ${completedProblems.has(problem.id) ? 'line-through text-muted-foreground' : ''}`}>
                        {problem.id}. {problem.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={difficultyStyles[problem.difficulty]} variant="secondary">
                      {problem.difficulty}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onSelectProblem(problem)}
                    >
                      Solve →
                    </Button>
                  </div>
                </div>
              ))}
              {problems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No problems in this category yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Topic grid view
  return (
    <div className="space-y-6">
      {/* Persona Banner */}
      {persona && (
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
                🎯
              </div>
              <div>
                <p className="font-semibold text-sm">Personalized for {persona.name}</p>
                <p className="text-xs text-muted-foreground">
                  Topics marked with ⭐ are recommended for your career path
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedTopics.map((topic) => {
          const problems = getTopicProblems(topic)
          const progress = getTopicProgress(topic)
          const completedCount = problems.filter(p => completedProblems.has(p.id)).length
          const recommended = isRecommended(topic)
          
          return (
            <Card
              key={topic.name}
              className={`cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 ${
                recommended ? 'ring-2 ring-indigo-500/30 bg-indigo-50/30' : ''
              }`}
              onClick={() => setSelectedTopic(topic)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${topic.color} flex items-center justify-center text-xl shadow`}>
                    {topic.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {recommended && (
                      <Badge className="bg-indigo-500 text-white text-xs">
                        ⭐ Recommended
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {completedCount}/{problems.length}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{topic.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{topic.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Progress value={progress} className="h-1" />
                <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

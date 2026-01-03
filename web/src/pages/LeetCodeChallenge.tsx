import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LeetCodeDaily from '@/components/leetcode/LeetCodeDaily'
import LeetCodeTopics from '@/components/leetcode/LeetCodeTopics'
import LeetCodeProgress from '@/components/leetcode/LeetCodeProgress'
import ProblemSolver from '@/components/leetcode/ProblemSolver'
import type { Problem } from '@/components/leetcode/problemData'

export default function LeetCodeChallenge({ embedded }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState('daily')
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)

  // When a problem is selected, show the solver view
  if (selectedProblem) {
    return (
      <div className={embedded ? '' : 'max-w-7xl mx-auto py-4'}>
        <ProblemSolver 
          problem={selectedProblem} 
          onBack={() => setSelectedProblem(null)} 
        />
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'max-w-6xl mx-auto py-4'}>
      {!embedded && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">LeetCode Mastery</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Master algorithms and data structures with curated problems
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-lg mb-6">
          <TabsTrigger value="daily" className="flex-1 text-sm">
            🎯 Daily
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex-1 text-sm">
            📚 Topics
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex-1 text-sm">
            📊 Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-0">
          <LeetCodeDaily onSelectProblem={setSelectedProblem} />
        </TabsContent>

        <TabsContent value="topics" className="mt-0">
          <LeetCodeTopics onSelectProblem={setSelectedProblem} />
        </TabsContent>

        <TabsContent value="progress" className="mt-0">
          <LeetCodeProgress />
        </TabsContent>
      </Tabs>
    </div>
  )
}

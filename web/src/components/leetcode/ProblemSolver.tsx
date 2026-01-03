import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import CodeEditor from './CodeEditor'
import type { Problem } from './problemData'
import { runAllTests } from '@/lib/codeExecution'

interface Props {
  problem: Problem
  onBack: () => void
}

interface TestResult {
  passed: boolean
  input: string
  expected: string
  actual: string
  error?: string
}

interface SubmissionResult {
  score: number
  passed: number
  total: number
  results: TestResult[]
  runtime?: string
  memory?: string
}

const difficultyStyles = {
  Easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  Medium: 'bg-amber-500/10 text-amber-600 border-amber-200',
  Hard: 'bg-red-500/10 text-red-600 border-red-200',
}

// Session storage keys
const getStorageKey = (problemId: number, type: string) => `lc_problem_${problemId}_${type}`

// Helper to get initial values from session storage
function getInitialLanguage(problemId: number): 'python' | 'javascript' {
  const saved = sessionStorage.getItem(getStorageKey(problemId, 'lang'))
  return saved === 'javascript' ? 'javascript' : 'python'
}

function getInitialCode(problemId: number, starterCode: { python: string; javascript: string }): string {
  const saved = sessionStorage.getItem(getStorageKey(problemId, 'code'))
  if (saved) return saved
  const lang = getInitialLanguage(problemId)
  return starterCode[lang]
}

function getInitialHints(problemId: number): number {
  const saved = sessionStorage.getItem(getStorageKey(problemId, 'hints'))
  return saved ? parseInt(saved, 10) : 0
}

export default function ProblemSolver({ problem, onBack }: Props) {
  // Initialize state from sessionStorage or defaults
  const [language, setLanguage] = useState<'python' | 'javascript'>(getInitialLanguage(problem.id))
  const [code, setCode] = useState<string>(getInitialCode(problem.id, problem.starterCode))
  const [revealedHints, setRevealedHints] = useState<number>(getInitialHints(problem.id))
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)

  // Persist code changes to sessionStorage
  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    sessionStorage.setItem(getStorageKey(problem.id, 'code'), newCode)
  }

  // Persist language changes - save current code for current language first
  const handleLanguageChange = (lang: 'python' | 'javascript') => {
    // Save current code for current language before switching
    sessionStorage.setItem(getStorageKey(problem.id, `code_${language}`), code)
    
    setLanguage(lang)
    sessionStorage.setItem(getStorageKey(problem.id, 'lang'), lang)
    
    // Check if there's saved code for the new language, otherwise use starter
    const savedCode = sessionStorage.getItem(getStorageKey(problem.id, `code_${lang}`))
    const newCode = savedCode || problem.starterCode[lang]
    setCode(newCode)
    sessionStorage.setItem(getStorageKey(problem.id, 'code'), newCode)
    setResult(null)
  }

  // Persist hint reveals
  const revealHint = () => {
    const newCount = revealedHints + 1
    setRevealedHints(newCount)
    sessionStorage.setItem(getStorageKey(problem.id, 'hints'), String(newCount))
  }

  const resetCode = () => {
    const starterCode = problem.starterCode[language]
    setCode(starterCode)
    sessionStorage.setItem(getStorageKey(problem.id, 'code'), starterCode)
    sessionStorage.setItem(getStorageKey(problem.id, `code_${language}`), starterCode)
    setResult(null)
  }

  const clearSession = () => {
    // Clear all session storage for this problem
    sessionStorage.removeItem(getStorageKey(problem.id, 'code'))
    sessionStorage.removeItem(getStorageKey(problem.id, 'lang'))
    sessionStorage.removeItem(getStorageKey(problem.id, 'hints'))
    sessionStorage.removeItem(getStorageKey(problem.id, 'code_python'))
    sessionStorage.removeItem(getStorageKey(problem.id, 'code_javascript'))
    
    // Reset to defaults
    setLanguage('python')
    setCode(problem.starterCode.python)
    setRevealedHints(0)
    setResult(null)
  }

  // Real code execution using Piston API
  const runCode = useCallback(async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const testResult = await runAllTests(code, language, problem.testCases)
      
      setResult({
        score: testResult.score,
        passed: testResult.passed,
        total: testResult.total,
        results: testResult.results,
        runtime: testResult.totalRuntime,
      })

      // Save completion if all tests pass
      if (testResult.passed === testResult.total) {
        const completed = JSON.parse(localStorage.getItem('lc_completed') || '[]')
        if (!completed.includes(problem.id)) {
          completed.push(problem.id)
          localStorage.setItem('lc_completed', JSON.stringify(completed))
        }
      }
    } catch (err) {
      setResult({
        score: 0,
        passed: 0,
        total: problem.testCases.length,
        results: [{
          passed: false,
          input: 'N/A',
          expected: 'N/A',
          actual: 'Execution failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        }],
      })
    }

    setIsRunning(false)
  }, [code, language, problem])

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold">{problem.id}. {problem.title}</h1>
          <Badge className={difficultyStyles[problem.difficulty]}>
            {problem.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={(v: string) => handleLanguageChange(v as 'python' | 'javascript')}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(v: string) => v === 'reset' ? resetCode() : clearSession()}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue placeholder="Reset ↓" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reset">Reset Code</SelectItem>
              <SelectItem value="clear">Clear All Progress</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            onClick={runCode} 
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isRunning ? '⏳ Running...' : '▶ Run Code'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 gap-4 pt-4 min-h-0">
        {/* Left: Problem Description */}
        <div className="flex flex-col min-h-0">
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              <Tabs defaultValue="description" className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 px-2">
                  <TabsTrigger value="description" className="text-xs">Description</TabsTrigger>
                  <TabsTrigger value="hints" className="text-xs">Hints ({problem.hints.length})</TabsTrigger>
                  <TabsTrigger value="solution" className="text-xs">Solution</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="flex-1 overflow-auto p-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {problem.description}
                    </p>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Examples</h4>
                      {problem.examples.map((ex, i) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3 mb-2 text-sm font-mono">
                          <p><span className="text-muted-foreground">Input:</span> {ex.input}</p>
                          <p><span className="text-muted-foreground">Output:</span> {ex.output}</p>
                          {ex.explanation && (
                            <p className="text-muted-foreground text-xs mt-1">{ex.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Constraints</h4>
                      <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                        {problem.constraints.map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="hints" className="flex-1 overflow-auto p-4 mt-0">
                  <div className="space-y-3">
                    {problem.hints.map((hint, i) => (
                      <div key={i}>
                        {i < revealedHints ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <p className="text-sm">💡 <strong>Hint {i + 1}:</strong> {hint}</p>
                          </div>
                        ) : i === revealedHints ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={revealHint}
                          >
                            Reveal Hint {i + 1}
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    {revealedHints >= problem.hints.length && (
                      <p className="text-sm text-muted-foreground">All hints revealed!</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="solution" className="flex-1 overflow-auto p-4 mt-0">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Try solving the problem first! Solutions are best understood after attempting.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={problem.link} target="_blank" rel="noopener noreferrer">
                        View on LeetCode →
                      </a>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: Code Editor & Results */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language={language}
            />
          </div>

          {/* Results Panel */}
          {result && (
            <Card className="shrink-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${result.score === 100 ? 'text-emerald-600' : result.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {result.score === 100 ? '✅ Accepted' : result.score >= 50 ? '⚠️ Partial' : '❌ Failed'}
                    </span>
                    <Badge variant="secondary">{result.passed}/{result.total} passed</Badge>
                  </div>
                  {result.score === 100 && (
                    <div className="text-xs text-muted-foreground">
                      Runtime: {result.runtime} | Memory: {result.memory}
                    </div>
                  )}
                </div>
                
                <Progress 
                  value={result.score} 
                  className={`h-2 ${result.score === 100 ? '[&>div]:bg-emerald-500' : result.score >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                />

                {result.score < 100 && (
                  <div className="mt-3 space-y-2">
                    {result.results.filter(r => !r.passed).slice(0, 2).map((r, i) => (
                      <div key={i} className="bg-red-500/5 border border-red-500/20 rounded p-2 text-xs font-mono">
                        <p><span className="text-muted-foreground">Input:</span> {r.input}</p>
                        <p><span className="text-muted-foreground">Expected:</span> {r.expected}</p>
                        <p><span className="text-red-600">Got:</span> {r.actual}</p>
                        {r.error && <p className="text-red-600 mt-1">{r.error}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}


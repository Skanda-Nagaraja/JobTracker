import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { ResumeScoreBreakdown } from '@/lib/atsScoring'
import { scoreResumeAgainstJob } from '@/lib/atsScoring'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
// @ts-ignore
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const PRESETS: Record<string, { title: string; jd: string }> = {
  backend_swe: {
    title: 'Backend Software Engineer',
    jd: `We are seeking a Backend Software Engineer with experience in building scalable APIs and distributed systems. The ideal candidate is proficient in Python, Java, or Node.js, has experience with relational and NoSQL databases, and is comfortable working with cloud platforms (AWS, GCP, or Azure). Responsibilities include designing RESTful services, optimizing performance, writing unit and integration tests, and collaborating in an Agile team.`,
  },
  frontend_swe: {
    title: 'Frontend Software Engineer',
    jd: `We are looking for a Frontend Engineer with strong skills in React, TypeScript, and modern CSS. Experience with Next.js, state management libraries, and responsive design is required. You'll work on building beautiful, accessible user interfaces.`,
  },
  data_analyst: {
    title: 'Data Analyst',
    jd: `We are looking for a Data Analyst with strong SQL skills and experience with Python or R. The candidate should be comfortable with data cleaning, exploratory data analysis, building dashboards, and communicating insights to stakeholders.`,
  },
}

export default function ResumeScore({ embedded }: { embedded?: boolean }) {
  const [jobType, setJobType] = useState('backend_swe')
  const [jobTitle, setJobTitle] = useState(PRESETS['backend_swe'].title)
  const [jobDescription, setJobDescription] = useState(PRESETS['backend_swe'].jd)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResumeScoreBreakdown | null>(null)

  const handlePreset = (value: string) => {
    setJobType(value)
    setJobTitle(PRESETS[value].title)
    setJobDescription(PRESETS[value].jd)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!file) {
      setError('Please upload a resume file (PDF or TXT).')
      return
    }
    try {
      setLoading(true)
      const text = await extractTextFromFile(file)
      const scored = scoreResumeAgainstJob(text, jobDescription, jobTitle)
      setResult(scored)
    } catch (err: any) {
      setError(err?.message || 'Failed to score resume.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={embedded ? '' : 'max-w-4xl mx-auto py-8'}>
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Resume Scoring</h1>
          <p className="text-muted-foreground mt-1">
            Upload your resume and compare it to a job description to get an ATS-style score.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preset">Job Preset</Label>
            <Select value={jobType} onValueChange={handlePreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESETS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={jobTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job Description</Label>
          <Textarea
            id="description"
            value={jobDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
            rows={6}
            className="resize-none"
            placeholder="Paste the job description here..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resume">Resume File (PDF or TXT)</Label>
          <Input
            id="resume"
            type="file"
            accept=".pdf,.txt"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            PDF parsing is handled client-side. DOCX is not yet supported.
          </p>
        </div>

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Scoring...
            </>
          ) : (
            'Score My Resume'
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {loading && (
          <Progress value={50} className="animate-pulse" />
        )}
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <Separator />
          
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
              <span className="text-4xl font-bold text-primary">{result.overall}</span>
            </div>
            <p className="text-lg font-medium">Overall Score</p>
            <p className="text-sm text-muted-foreground">out of 100</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard label="Keyword Match" value={result.keywordMatch} max={60} />
            <ScoreCard label="Title Match" value={result.titleMatch} max={10} />
            <ScoreCard label="Section Coverage" value={result.sectionCoverage} max={15} />
            <ScoreCard label="Formatting" value={result.formatting} max={15} />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Matched Keywords</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedKeywords.slice(0, 30).map((kw) => (
                  <Badge key={kw} variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                    {kw}
                  </Badge>
                ))}
                {result.matchedKeywords.length === 0 && (
                  <p className="text-sm text-muted-foreground">None detected</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Missing Keywords</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.slice(0, 30).map((kw) => (
                  <Badge key={kw} variant="secondary">
                    {kw}
                  </Badge>
                ))}
                {result.missingKeywords.length === 0 && (
                  <p className="text-sm text-muted-foreground">Great job! You've covered the key terms.</p>
                )}
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Suggestions</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-500">⚠️</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreCard({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}<span className="text-sm font-normal text-muted-foreground">/{max}</span></div>
        <Progress value={pct} className="mt-2 h-1.5" />
      </CardContent>
    </Card>
  )
}

async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const type = file.type
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractPdf(file)
  }
  return file.text()
}

async function extractPdf(file: File): Promise<string> {
  GlobalWorkerOptions.workerSrc = workerSrc as any
  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: buffer }).promise
  const maxPages = pdf.numPages
  let text = ''
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const strings = content.items.map((item: any) => item.str).join(' ')
    text += strings + '\n'
  }
  return text
}

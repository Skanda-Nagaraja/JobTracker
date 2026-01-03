import { useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import type { ResumeScoreBreakdown } from '../lib/atsScoring'
import { scoreResumeAgainstJob } from '../lib/atsScoring'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
// Ensure worker is bundled correctly in Vite
// eslint-disable-next-line import/no-unresolved
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const PRESETS: Record<string, { title: string; jd: string }> = {
  backend_swe: {
    title: 'Backend Software Engineer',
    jd: `We are seeking a Backend Software Engineer with experience in building
scalable APIs and distributed systems. The ideal candidate is proficient in
Python, Java, or Node.js, has experience with relational and NoSQL databases,
and is comfortable working with cloud platforms (AWS, GCP, or Azure).
Responsibilities include designing RESTful services, optimizing performance,
writing unit and integration tests, and collaborating in an Agile team.`,
  },
  data_analyst: {
    title: 'Data Analyst',
    jd: `We are looking for a Data Analyst with strong SQL skills and experience
with Python or R. The candidate should be comfortable with data cleaning,
exploratory data analysis, building dashboards, and communicating insights to stakeholders.`,
  },
}

export default function PersonalGrowth() {
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
      setError('Please upload a resume file (pdf or txt).')
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
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Personal Growth
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload your resume and compare it to a job description to get an ATS-style score.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, boxShadow: '0 16px 40px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                fullWidth
                label="Job preset"
                value={jobType}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePreset(e.target.value)}
              >
                {Object.keys(PRESETS).map((k) => (
                  <MenuItem key={k} value={k}>
                    {PRESETS[k].title}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Job title"
              fullWidth
              value={jobTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobTitle(e.target.value)}
            />
            <TextField
              label="Job description"
              fullWidth
              multiline
              minRows={5}
              value={jobDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setJobDescription(e.target.value)}
            />
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={600}>
                Resume file (PDF or TXT)
              </Typography>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Typography variant="caption" color="text.secondary">
                PDF parsing is handled client-side; DOCX is not supported in this build.
              </Typography>
            </Stack>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              {loading ? 'Scoring…' : 'Score my resume'}
            </Button>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
            {loading && <LinearProgress />}
          </Stack>
        </form>
      </Paper>

      {result && (
        <Paper
          variant="outlined"
          sx={{ p: 3, mt: 3, borderRadius: 3, boxShadow: '0 16px 40px rgba(0,0,0,0.04)' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Overall score: {result.overall}/100
          </Typography>
          <GridScores result={result} />
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              Matched keywords
            </Typography>
            <ChipList items={result.matchedKeywords.slice(0, 30)} color="success" />
            <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
              Missing keywords
            </Typography>
            <ChipList items={result.missingKeywords.slice(0, 30)} color="default" />
            {result.warnings.length > 0 && (
              <>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
                  Warnings / Suggestions
                </Typography>
                <Stack spacing={0.5}>
                  {result.warnings.map((w, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      • {w}
                    </Typography>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

function GridScores({ result }: { result: ResumeScoreBreakdown }) {
  const items = [
    { label: 'Keyword match', value: result.keywordMatch, max: 60 },
    { label: 'Job title match', value: result.titleMatch, max: 10 },
    { label: 'Section coverage', value: result.sectionCoverage, max: 15 },
    { label: 'Formatting', value: result.formatting, max: 15 },
  ]
  return (
    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 1 }}>
      {items.map((item) => (
        <Paper key={item.label} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            {item.value}/{item.max}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}

function ChipList({ items, color }: { items: string[]; color: 'default' | 'success' }) {
  if (!items.length) return <Typography variant="body2" color="text.secondary">None</Typography>
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {items.map((i) => (
        <Chip key={i} label={i} size="small" color={color === 'success' ? 'success' : 'default'} />
      ))}
    </Box>
  )
}

async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  const type = file.type
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractPdf(file)
  }
  // Fallback to text
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



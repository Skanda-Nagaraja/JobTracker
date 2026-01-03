export type ResumeScoreBreakdown = {
  overall: number
  keywordMatch: number
  titleMatch: number
  sectionCoverage: number
  formatting: number
  matchedKeywords: string[]
  missingKeywords: string[]
  warnings: string[]
}

const DEFAULT_KEYWORDS = [
  'python',
  'java',
  'javascript',
  'node',
  'react',
  'backend',
  'frontend',
  'api',
  'rest',
  'graphql',
  'sql',
  'postgres',
  'mysql',
  'nosql',
  'aws',
  'gcp',
  'azure',
  'docker',
  'kubernetes',
  'ci',
  'cd',
  'testing',
  'unit test',
  'integration test',
]

export function scoreResumeAgainstJob(
  resumeText: string,
  jobDescription: string,
  jobTitle: string
): ResumeScoreBreakdown {
  const resume = resumeText.toLowerCase()
  const jd = jobDescription.toLowerCase()
  const title = jobTitle.toLowerCase()

  const jdTokens = new Set(tokenize(jd))
  const resumeTokens = new Set(tokenize(resume))

  const keywords = Array.from(new Set([...DEFAULT_KEYWORDS, ...jdTokens].filter((w) => w.length > 2)))
  const matched = keywords.filter((k) => resumeTokens.has(k))
  const missing = keywords.filter((k) => !resumeTokens.has(k))

  const keywordMatchScore = Math.min(60, Math.round((matched.length / Math.max(1, keywords.length)) * 60))

  // simple title match
  const titleScore = title && resume.includes(title) ? 10 : 0

  // sections
  const sectionScore = scoreSections(resumeText)

  // formatting heuristic
  const formattingScore = Math.min(15, Math.max(5, Math.round(resumeText.length / 2000) + 10))

  const overall = Math.min(100, keywordMatchScore + titleScore + sectionScore + formattingScore)

  const warnings: string[] = []
  if (missing.length > 0) warnings.push('Add missing keywords relevant to the job description.')
  if (sectionScore < 12) warnings.push('Ensure resume has clear sections: Summary, Experience, Projects, Education.')
  if (formattingScore < 12) warnings.push('Keep formatting clean and concise; avoid walls of text.')

  return {
    overall,
    keywordMatch: keywordMatchScore,
    titleMatch: titleScore,
    sectionCoverage: sectionScore,
    formatting: formattingScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    warnings,
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function scoreSections(resumeText: string): number {
  const t = resumeText.toLowerCase()
  let score = 0
  if (t.includes('experience')) score += 4
  if (t.includes('project')) score += 4
  if (t.includes('education')) score += 4
  if (t.includes('skills')) score += 3
  return Math.min(15, score)
}



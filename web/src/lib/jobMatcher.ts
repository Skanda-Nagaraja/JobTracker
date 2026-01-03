// Job matching and scoring based on user profile

import type { Job } from '../types'
import type { UserProfile } from '../hooks/useProfile'

export interface JobMatch {
  job: Job
  score: number
  matchReasons: string[]
}

// Keywords associated with each role
const ROLE_KEYWORDS: Record<string, string[]> = {
  frontend: [
    'frontend', 'front-end', 'front end', 'react', 'vue', 'angular', 'javascript', 
    'typescript', 'ui engineer', 'ui developer', 'web developer', 'css', 'html'
  ],
  backend: [
    'backend', 'back-end', 'back end', 'api', 'server', 'microservices', 
    'python', 'java', 'go', 'golang', 'node', 'nodejs', 'ruby', 'django', 'flask', 'spring'
  ],
  fullstack: [
    'full stack', 'fullstack', 'full-stack', 'software engineer', 'software developer',
    'web developer', 'application developer'
  ],
  data_engineer: [
    'data engineer', 'etl', 'data pipeline', 'big data', 'spark', 'hadoop', 
    'airflow', 'kafka', 'data platform', 'data infrastructure', 'warehouse'
  ],
  data_scientist: [
    'data scientist', 'data science', 'machine learning', 'ml', 'analytics',
    'statistical', 'modeling', 'insights', 'bi ', 'business intelligence'
  ],
  ml_engineer: [
    'machine learning engineer', 'ml engineer', 'mlops', 'deep learning',
    'ai engineer', 'artificial intelligence', 'neural', 'tensorflow', 'pytorch', 'nlp'
  ],
  mobile: [
    'mobile', 'ios', 'android', 'swift', 'kotlin', 'react native', 'flutter',
    'mobile developer', 'app developer'
  ],
  devops: [
    'devops', 'sre', 'site reliability', 'infrastructure', 'platform engineer',
    'cloud engineer', 'kubernetes', 'docker', 'ci/cd', 'aws', 'gcp', 'azure'
  ],
}

// Keywords for work preferences
const REMOTE_KEYWORDS = ['remote', 'work from home', 'wfh', 'distributed', 'anywhere']
const HYBRID_KEYWORDS = ['hybrid', 'flexible', '2 days', '3 days']
const ONSITE_KEYWORDS = ['onsite', 'on-site', 'in office', 'in-office']

// Experience level keywords
const EXPERIENCE_KEYWORDS: Record<string, string[]> = {
  student: ['intern', 'internship', 'co-op', 'student'],
  new_grad: ['new grad', 'entry level', 'junior', 'associate', 'i ', ' 1', 'early career', '0-2 years'],
  early: ['mid', 'ii', ' 2', '2-5 years', '3+ years'],
  mid: ['senior', 'iii', ' 3', 'lead', '5+ years', '5-8 years'],
  senior: ['staff', 'principal', 'architect', 'director', '8+ years', '10+ years'],
}

/**
 * Calculate match score for a job based on user profile
 */
export function scoreJob(job: Job, profile: UserProfile | null): JobMatch {
  if (!profile) {
    return { job, score: 50, matchReasons: [] }
  }

  let score = 0
  const matchReasons: string[] = []
  const titleLower = (job.title || '').toLowerCase()
  const companyLower = (job.company || '').toLowerCase()
  const locationLower = (job.location || '').toLowerCase()
  const combinedText = `${titleLower} ${companyLower} ${locationLower}`

  // 1. Role matching (up to 40 points)
  let roleMatches = 0
  for (const role of profile.target_roles || []) {
    const keywords = ROLE_KEYWORDS[role] || []
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        roleMatches++
        if (roleMatches === 1) {
          matchReasons.push(`Matches ${formatRole(role)} role`)
        }
        break // Only count once per role
      }
    }
  }
  
  if (roleMatches > 0) {
    score += Math.min(40, roleMatches * 20)
  }

  // 2. Experience level matching (up to 20 points)
  if (profile.career_stage) {
    const expKeywords = EXPERIENCE_KEYWORDS[profile.career_stage] || []
    for (const keyword of expKeywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        score += 20
        matchReasons.push(`Matches ${formatCareerStage(profile.career_stage)} level`)
        break
      }
    }
  }

  // 3. Work preference matching (up to 15 points)
  const prefs = profile.preferences || {}
  if (prefs.remote && REMOTE_KEYWORDS.some(k => combinedText.includes(k))) {
    score += 15
    matchReasons.push('Remote friendly')
  } else if (prefs.hybrid && HYBRID_KEYWORDS.some(k => combinedText.includes(k))) {
    score += 10
    matchReasons.push('Hybrid work')
  } else if (prefs.onsite && ONSITE_KEYWORDS.some(k => combinedText.includes(k))) {
    score += 10
    matchReasons.push('On-site')
  }

  // 4. Language/tech stack matching (up to 15 points)
  const languages = profile.languages || []
  const langMatches: string[] = []
  for (const lang of languages) {
    const langLower = lang.toLowerCase()
    // Map language values to searchable terms
    const searchTerms: Record<string, string[]> = {
      javascript: ['javascript', 'typescript', 'js', 'ts', 'node', 'react', 'vue', 'angular'],
      python: ['python', 'django', 'flask', 'fastapi'],
      java: ['java', 'spring', 'kotlin'],
      cpp: ['c++', 'cpp'],
      go: ['go', 'golang'],
      rust: ['rust'],
      sql: ['sql', 'postgres', 'mysql', 'database'],
      scala: ['scala', 'spark'],
      csharp: ['c#', '.net', 'dotnet'],
      swift: ['swift', 'ios'],
    }
    
    const terms = searchTerms[langLower] || [langLower]
    if (terms.some(t => combinedText.includes(t))) {
      langMatches.push(lang)
    }
  }
  
  if (langMatches.length > 0) {
    score += Math.min(15, langMatches.length * 5)
    matchReasons.push(`Uses ${langMatches.slice(0, 2).join(', ')}`)
  }

  // 5. Bonus for new grad specific repos (10 points)
  const source = (job.source || '').toLowerCase()
  if (source.includes('new-grad') || source.includes('newgrad') || source.includes('2026')) {
    if (profile.career_stage === 'new_grad' || profile.career_stage === 'student') {
      score += 10
      matchReasons.push('New grad position')
    }
  }

  // Cap at 100
  score = Math.min(100, score)

  // Ensure minimum score of 10 for any job
  score = Math.max(10, score)

  return { job, score, matchReasons }
}

/**
 * Score and sort jobs by relevance to profile
 */
export function rankJobs(jobs: Job[], profile: UserProfile | null): JobMatch[] {
  const scored = jobs.map(job => scoreJob(job, profile))
  
  // Sort by score descending, then by date
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return new Date(b.job.created_at).getTime() - new Date(a.job.created_at).getTime()
  })
  
  return scored
}

/**
 * Filter jobs based on minimum match score
 */
export function filterByScore(matches: JobMatch[], minScore: number): JobMatch[] {
  return matches.filter(m => m.score >= minScore)
}

// Helper formatters
function formatRole(role: string): string {
  const names: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    fullstack: 'Full Stack',
    data_engineer: 'Data Engineer',
    data_scientist: 'Data Science',
    ml_engineer: 'ML Engineer',
    mobile: 'Mobile',
    devops: 'DevOps',
  }
  return names[role] || role
}

function formatCareerStage(stage: string): string {
  const names: Record<string, string> = {
    student: 'Student/Intern',
    new_grad: 'New Grad',
    early: 'Early Career',
    mid: 'Mid Level',
    senior: 'Senior',
  }
  return names[stage] || stage
}


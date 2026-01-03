import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface UserProfile {
  user_id: string
  career_stage: string
  target_roles: string[]
  languages: string[]
  skill_levels: Record<string, number>
  preferences: {
    remote: boolean
    hybrid: boolean
    onsite: boolean
    relocate: boolean
    company_size: string[]
  }
  onboarding_complete: boolean
  created_at?: string
  updated_at?: string
}

// Persona definitions for recommendations
export const PERSONA_CONFIG: Record<string, {
  name: string
  searchTerms: string[]
  leetcodeTopics: string[]
  recommendedSkills: string[]
}> = {
  frontend: {
    name: 'Frontend Engineer',
    searchTerms: ['frontend', 'front end', 'UI Engineer', 'React', 'JavaScript', 'TypeScript'],
    leetcodeTopics: ['Array', 'String', 'Hash Table', 'Stack', 'Recursion'],
    recommendedSkills: ['React', 'TypeScript', 'CSS', 'State Management', 'Performance'],
  },
  backend: {
    name: 'Backend Engineer',
    searchTerms: ['backend', 'back end', 'API Engineer', 'Server', 'Python', 'Go', 'Java'],
    leetcodeTopics: ['Linked List', 'Tree', 'Graph', 'Hash Table', 'DFS', 'BFS', 'Queue'],
    recommendedSkills: ['API Design', 'Databases', 'System Design', 'Concurrency', 'Security'],
  },
  fullstack: {
    name: 'Full Stack Engineer',
    searchTerms: ['full stack', 'fullstack', 'software engineer', 'web developer'],
    leetcodeTopics: ['Array', 'String', 'Hash Table', 'Tree', 'Graph', 'Dynamic Programming'],
    recommendedSkills: ['React', 'Node.js', 'Databases', 'API Design', 'DevOps'],
  },
  data_engineer: {
    name: 'Data Engineer',
    searchTerms: ['data engineer', 'ETL', 'data pipeline', 'big data', 'Spark', 'SQL'],
    leetcodeTopics: ['Array', 'Hash Table', 'Tree', 'Graph', 'SQL'],
    recommendedSkills: ['SQL', 'ETL', 'Data Modeling', 'Spark', 'Airflow', 'Cloud'],
  },
  data_scientist: {
    name: 'Data Scientist',
    searchTerms: ['data scientist', 'machine learning', 'ML scientist', 'analytics'],
    leetcodeTopics: ['Array', 'Math', 'Statistics', 'SQL', 'String'],
    recommendedSkills: ['Python', 'Statistics', 'ML Fundamentals', 'Visualization', 'SQL'],
  },
  ml_engineer: {
    name: 'ML Engineer',
    searchTerms: ['machine learning engineer', 'ML engineer', 'AI/ML', 'deep learning'],
    leetcodeTopics: ['Array', 'Math', 'Dynamic Programming', 'Graph', 'Tree'],
    recommendedSkills: ['TensorFlow/PyTorch', 'ML Ops', 'Model Training', 'NLP', 'Computer Vision'],
  },
  mobile: {
    name: 'Mobile Developer',
    searchTerms: ['mobile developer', 'iOS', 'Android', 'React Native', 'Flutter'],
    leetcodeTopics: ['Array', 'String', 'Hash Table', 'Stack', 'Tree'],
    recommendedSkills: ['Swift/Kotlin', 'React Native', 'Mobile UI', 'App Architecture', 'Performance'],
  },
  devops: {
    name: 'DevOps / SRE',
    searchTerms: ['DevOps', 'SRE', 'site reliability', 'infrastructure', 'platform engineer'],
    leetcodeTopics: ['Array', 'String', 'Hash Table', 'Tree'],
    recommendedSkills: ['CI/CD', 'Kubernetes', 'AWS/GCP', 'Monitoring', 'Infrastructure as Code'],
  },
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let mounted = true

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle()

        if (!mounted) return

        if (error) {
          console.error('Error fetching profile:', error)
          setProfile(null)
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error('Profile fetch error:', err)
        setProfile(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchProfile()
    return () => { mounted = false }
  }, [user, authLoading])

  const needsOnboarding = !loading && user && (!profile || !profile.onboarding_complete)

  // Get recommended LeetCode topics based on user's target roles
  const getRecommendedTopics = (): string[] => {
    if (!profile?.target_roles?.length) return []
    
    const topics = new Set<string>()
    for (const role of profile.target_roles) {
      const config = PERSONA_CONFIG[role]
      if (config) {
        config.leetcodeTopics.forEach(t => topics.add(t))
      }
    }
    return Array.from(topics)
  }

  // Get job search terms based on user's target roles
  const getJobSearchTerms = (): string[] => {
    if (!profile?.target_roles?.length) return []
    
    const terms = new Set<string>()
    for (const role of profile.target_roles) {
      const config = PERSONA_CONFIG[role]
      if (config) {
        config.searchTerms.forEach(t => terms.add(t))
      }
    }
    return Array.from(terms)
  }

  // Get skill recommendations based on target roles
  const getSkillRecommendations = (): string[] => {
    if (!profile?.target_roles?.length) return []
    
    const skills = new Set<string>()
    for (const role of profile.target_roles) {
      const config = PERSONA_CONFIG[role]
      if (config) {
        config.recommendedSkills.forEach(s => skills.add(s))
      }
    }
    return Array.from(skills)
  }

  // Get primary persona (first target role)
  const getPrimaryPersona = () => {
    if (!profile?.target_roles?.length) return null
    return PERSONA_CONFIG[profile.target_roles[0]] || null
  }

  return {
    profile,
    loading,
    needsOnboarding,
    getRecommendedTopics,
    getJobSearchTerms,
    getSkillRecommendations,
    getPrimaryPersona,
  }
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  
  if (error) throw error
}


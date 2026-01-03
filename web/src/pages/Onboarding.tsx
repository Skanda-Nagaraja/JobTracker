import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const STEPS = ['Career Stage', 'Target Roles', 'Languages', 'Skills', 'Preferences']

const CAREER_STAGES = [
  { value: 'student', label: 'Student', desc: 'High School / College' },
  { value: 'new_grad', label: 'New Graduate', desc: '0-2 years experience' },
  { value: 'early', label: 'Early Career', desc: '2-5 years experience' },
  { value: 'mid', label: 'Mid Level', desc: '5-8 years experience' },
  { value: 'senior', label: 'Senior', desc: '8+ years experience' },
]

const TARGET_ROLES = [
  { value: 'frontend', label: 'Frontend Engineer', icon: '👩‍💻', color: 'bg-blue-500' },
  { value: 'backend', label: 'Backend Engineer', icon: '⚙️', color: 'bg-emerald-500' },
  { value: 'fullstack', label: 'Full Stack Engineer', icon: '🎯', color: 'bg-purple-500' },
  { value: 'data_engineer', label: 'Data Engineer', icon: '💾', color: 'bg-orange-500' },
  { value: 'data_scientist', label: 'Data Scientist', icon: '📊', color: 'bg-pink-500' },
  { value: 'ml_engineer', label: 'ML Engineer', icon: '🤖', color: 'bg-red-500' },
  { value: 'mobile', label: 'Mobile Developer', icon: '📱', color: 'bg-cyan-500' },
  { value: 'devops', label: 'DevOps / SRE', icon: '🔧', color: 'bg-amber-500' },
]

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript/TypeScript', icon: '🟨' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C/C++', icon: '⚡' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'sql', label: 'SQL', icon: '🗄️' },
  { value: 'scala', label: 'Scala', icon: '🔴' },
  { value: 'csharp', label: 'C#', icon: '💜' },
  { value: 'swift', label: 'Swift', icon: '🍎' },
]

const SKILL_CATEGORIES = [
  { key: 'algorithms', label: 'Algorithms & Data Structures', icon: '🧮' },
  { key: 'systems', label: 'Systems Design', icon: '🏗️' },
  { key: 'databases', label: 'Databases & SQL', icon: '🗄️' },
  { key: 'ml', label: 'Machine Learning', icon: '🤖' },
  { key: 'frontend', label: 'Frontend & UI', icon: '🎨' },
  { key: 'cloud', label: 'Cloud & DevOps', icon: '☁️' },
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

type Profile = {
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
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<Profile>({
    career_stage: '',
    target_roles: [],
    languages: [],
    skill_levels: {
      algorithms: 1,
      systems: 1,
      databases: 1,
      ml: 0,
      frontend: 1,
      cloud: 0,
    },
    preferences: {
      remote: true,
      hybrid: true,
      onsite: false,
      relocate: false,
      company_size: [],
    },
  })

  const progress = ((step + 1) / STEPS.length) * 100

  const toggleRole = (role: string) => {
    setProfile(p => ({
      ...p,
      target_roles: p.target_roles.includes(role)
        ? p.target_roles.filter(r => r !== role)
        : [...p.target_roles, role]
    }))
  }

  const toggleLanguage = (lang: string) => {
    setProfile(p => ({
      ...p,
      languages: p.languages.includes(lang)
        ? p.languages.filter(l => l !== lang)
        : [...p.languages, lang]
    }))
  }

  const toggleCompanySize = (size: string) => {
    setProfile(p => ({
      ...p,
      preferences: {
        ...p.preferences,
        company_size: p.preferences.company_size.includes(size)
          ? p.preferences.company_size.filter(s => s !== size)
          : [...p.preferences.company_size, size]
      }
    }))
  }

  const setSkillLevel = (skill: string, level: number) => {
    setProfile(p => ({
      ...p,
      skill_levels: { ...p.skill_levels, [skill]: level }
    }))
  }

  const canProceed = () => {
    switch (step) {
      case 0: return !!profile.career_stage
      case 1: return profile.target_roles.length > 0
      case 2: return profile.languages.length > 0
      case 3: return true
      case 4: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    
    try {
      const { error: dbError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: user.id,
            career_stage: profile.career_stage,
            target_roles: profile.target_roles,
            languages: profile.languages,
            skill_levels: profile.skill_levels,
            preferences: profile.preferences,
            onboarding_complete: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
      
      if (dbError) {
        console.error('Supabase error:', dbError)
        setError(`Failed to save: ${dbError.message}. Make sure you ran the SQL in Supabase!`)
        setSaving(false)
        return
      }
      
      // Force reload to update profile state across the app
      window.location.href = '/summary'
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'An unexpected error occurred')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step + 1} of {STEPS.length}</span>
            <span className="text-sm text-muted-foreground">{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">
              {step === 0 && "Where are you in your career?"}
              {step === 1 && "What roles interest you?"}
              {step === 2 && "What languages do you know?"}
              {step === 3 && "Rate your skill levels"}
              {step === 4 && "Set your preferences"}
            </CardTitle>
            <CardDescription>
              {step === 0 && "This helps us tailor job recommendations to your experience level"}
              {step === 1 && "Select all that apply - we'll show you relevant opportunities"}
              {step === 2 && "Pick your primary programming languages"}
              {step === 3 && "Be honest - this helps us suggest the right practice problems"}
              {step === 4 && "Tell us about your ideal work environment"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Step 0: Career Stage */}
            {step === 0 && (
              <RadioGroup
                value={profile.career_stage}
                onValueChange={(v) => setProfile(p => ({ ...p, career_stage: v }))}
                className="grid gap-3"
              >
                {CAREER_STAGES.map((stage) => (
                  <Label
                    key={stage.value}
                    htmlFor={stage.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      profile.career_stage === stage.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={stage.value} id={stage.value} />
                    <div>
                      <p className="font-semibold">{stage.label}</p>
                      <p className="text-sm text-muted-foreground">{stage.desc}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {/* Step 1: Target Roles */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {TARGET_ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => toggleRole(role.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      profile.target_roles.includes(role.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center text-xl`}>
                      {role.icon}
                    </div>
                    <span className="font-medium text-sm">{role.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Languages */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => toggleLanguage(lang.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      profile.languages.includes(lang.value)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl">{lang.icon}</span>
                    <span className="font-medium text-sm">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Skill Levels */}
            {step === 3 && (
              <div className="space-y-6">
                {SKILL_CATEGORIES.map((skill) => (
                  <div key={skill.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{skill.icon}</span>
                        <span className="font-medium">{skill.label}</span>
                      </div>
                      <Badge variant="secondary">
                        {SKILL_LEVELS[profile.skill_levels[skill.key]] || 'None'}
                      </Badge>
                    </div>
                    <Slider
                      value={[profile.skill_levels[skill.key]]}
                      onValueChange={([v]) => setSkillLevel(skill.key, v)}
                      max={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Advanced</span>
                      <span>Expert</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Preferences */}
            {step === 4 && (
              <div className="space-y-8">
                {/* Work Type */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Work Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'remote', label: 'Remote', icon: '🏠' },
                      { key: 'hybrid', label: 'Hybrid', icon: '🔄' },
                      { key: 'onsite', label: 'On-site', icon: '🏢' },
                    ].map((type) => (
                      <button
                        key={type.key}
                        onClick={() => setProfile(p => ({
                          ...p,
                          preferences: { ...p.preferences, [type.key]: !p.preferences[type.key as keyof typeof p.preferences] }
                        }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          profile.preferences[type.key as keyof typeof profile.preferences]
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl">{type.icon}</span>
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Size */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Company Size</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'startup', label: 'Startup', desc: '<50 employees' },
                      { value: 'mid', label: 'Mid-size', desc: '50-500 employees' },
                      { value: 'large', label: 'Large', desc: '500-5000 employees' },
                      { value: 'enterprise', label: 'Enterprise/FAANG', desc: '5000+ employees' },
                    ].map((size) => (
                      <button
                        key={size.value}
                        onClick={() => toggleCompanySize(size.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          profile.preferences.company_size.includes(size.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium">{size.label}</p>
                        <p className="text-xs text-muted-foreground">{size.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relocate */}
                <div className="flex items-center justify-between p-4 rounded-xl border">
                  <div>
                    <p className="font-medium">Open to Relocation</p>
                    <p className="text-sm text-muted-foreground">Would you move for the right opportunity?</p>
                  </div>
                  <Switch
                    checked={profile.preferences.relocate}
                    onCheckedChange={(v) => setProfile(p => ({
                      ...p,
                      preferences: { ...p.preferences, relocate: v }
                    }))}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
              >
                ← Back
              </Button>
              
              <div className="flex items-center gap-2">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === step ? 'bg-primary' : i < step ? 'bg-primary/50' : 'bg-border'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
              >
                {saving ? 'Saving...' : step === STEPS.length - 1 ? 'Complete Setup' : 'Continue →'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


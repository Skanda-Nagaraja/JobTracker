import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ResumeScore from './ResumeScore'
import LeetCodeChallenge from './LeetCodeChallenge'

export default function Growth() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Personal Growth</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tools to help you level up your job search and technical skills
        </p>
      </div>

      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="w-full max-w-xs mb-6">
          <TabsTrigger value="resume" className="flex-1 text-sm">
            📄 Resume
          </TabsTrigger>
          <TabsTrigger value="leetcode" className="flex-1 text-sm">
            💻 LeetCode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">ATS Resume Scoring</CardTitle>
              <CardDescription className="text-sm">
                Compare your resume against job descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeScore embedded />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leetcode" className="mt-0">
          <LeetCodeChallenge embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import SignIn from './pages/SignIn'
import Onboarding from './pages/Onboarding'
import Summary from './pages/Summary'
import Jobs from './pages/Jobs'
import Growth from './pages/Growth'
import { useAuth, signOut } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { cn } from './lib/utils'

export default function App() {
  const { loading, user } = useAuth()
  const { loading: profileLoading, needsOnboarding } = useProfile()
  const location = useLocation()

  const isLoading = loading || profileLoading

  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin text-2xl">⏳</div>
        </div>
      )
    }
    if (!user) return <Navigate to="/signin" replace />
    return <>{children}</>
  }

  // Redirect to onboarding if profile not complete
  const RequireOnboarding = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin text-2xl">⏳</div>
        </div>
      )
    }
    if (!user) return <Navigate to="/signin" replace />
    if (needsOnboarding && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />
    }
    return <>{children}</>
  }

  const navItems = [
    { path: '/summary', label: 'Analytics' },
    { path: '/jobs', label: 'Job Listings' },
    { path: '/growth', label: 'Growth' },
  ]

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/summary" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg">
                🧳
              </div>
              <span className="font-bold text-xl">JobTracker Pro</span>
            </Link>

            {user && !needsOnboarding && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    asChild
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isActive(item.path)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Link to={item.path}>{item.label}</Link>
                  </Button>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-medium">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground hidden sm:inline max-w-[150px] truncate">
                    {user.email}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/signin">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/summary" element={<RequireOnboarding><Summary /></RequireOnboarding>} />
          <Route path="/jobs" element={<RequireOnboarding><Jobs /></RequireOnboarding>} />
          <Route path="/growth/*" element={<RequireOnboarding><Growth /></RequireOnboarding>} />
          <Route path="*" element={<Navigate to="/summary" replace />} />
        </Routes>
      </main>
    </div>
  )
}

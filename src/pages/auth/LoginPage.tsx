import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signInWithMagicLink, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic'>('password')

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)

    if (!error) {
      navigate('/dashboard')
    }

    setLoading(false)
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signInWithMagicLink(email)

    if (!error) {
      setMagicLinkSent(true)
    }

    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Click the link in the email to sign in to your account.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={() => setMagicLinkSent(false)}>
              Use a different email
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
            B
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your BLU Networking account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Toggle between methods */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                loginMethod === 'password'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('magic')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                loginMethod === 'magic'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Magic Link
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-magic">Email</Label>
                <Input
                  id="email-magic"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Magic Link
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

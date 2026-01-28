import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Check } from 'lucide-react'

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp, error } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[0-9]/.test(pass)) {
      return 'Password must contain at least one number'
    }
    return ''
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    // Validate password
    const passError = validatePassword(password)
    if (passError) {
      setPasswordError(passError)
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password, fullName)

    if (!error) {
      setSignupComplete(true)
    }

    setLoading(false)
  }

  if (signupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Account Created!</CardTitle>
            <CardDescription>
              Please check your email to verify your account, then complete your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              We sent a verification link to <strong>{email}</strong>
            </p>
            <Button onClick={() => navigate('/auth/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
            B
          </div>
          <CardTitle className="text-2xl">Join BLU Networking</CardTitle>
          <CardDescription>Create your account to start networking</CardDescription>
        </CardHeader>
        <CardContent>
          {(error || passwordError) && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error || passwordError}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters with 1 uppercase letter and 1 number
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            By signing up, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

'use client'

import { useAuth } from '../../lib/authContext'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthScreen, Divider } from '@/components/authScreen.jsx'
import { GoogleSignInButton } from '@/components/google_signIn_Button'

export default function SignUpPage() {
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)

    try {
      const result = await signup(email, password)
      const status = result.user?.profile?.verificationStatus
      router.push(status === 'VERIFIED' || status === 'UNDER_REVIEW' ? '/discover' : '/onBoarding')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthScreen eyebrow="Get started" title="Create your account" subtitle="Join Melodis and find connections that actually matter.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email */}
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-taupe">
            Email
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-sand bg-linen px-4 py-3 text-sm text-espresso placeholder-taupe/50 outline-none transition-all focus:border-espresso focus:ring-2 focus:ring-espresso/10"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-taupe">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-sand bg-linen px-4 py-3 pr-14 text-sm text-espresso placeholder-taupe/50 outline-none transition-all focus:border-espresso focus:ring-2 focus:ring-espresso/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-wider text-taupe hover:text-espresso transition-colors px-1"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {password.length > 0 && password.length < 8 && (
            <p className="mt-1 text-xs text-taupe">{8 - password.length} more characters needed</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-taupe">
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-sand bg-linen px-4 py-3 text-sm text-espresso placeholder-taupe/50 outline-none transition-all focus:border-espresso focus:ring-2 focus:ring-espresso/10"
          />
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="mt-1 text-xs text-rosewood">Passwords don't match</p>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-rosewood/20 bg-rosewood/5 p-3 text-xs text-rosewood">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-full bg-espresso py-3 text-sm font-medium text-linen transition-colors hover:bg-rosewood disabled:opacity-50"
        >
          {submitting ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>

      <Divider>or continue with</Divider>

      <GoogleSignInButton />

      <p className="mt-6 text-center text-xs text-taupe">
        Already have an account?{' '}
        <Link href="/login" className="text-espresso underline underline-offset-2 hover:text-rosewood transition-colors">
          Log in
        </Link>
      </p>
    </AuthScreen>
  )
}

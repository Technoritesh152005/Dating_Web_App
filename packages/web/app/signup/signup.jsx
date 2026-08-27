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
    <AuthScreen eyebrow="Get Started" title="Create your account" subtitle="Join Melodis to start connecting with verified matches.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email Input */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold text-pearl-dim">Email Address</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3 text-sm text-pearl placeholder-pearl-muted outline-none transition-all focus:border-saffron focus:ring-2 focus:ring-saffron/20"
          />
        </div>

        {/* Password Input */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold text-pearl-dim">Password (min 8 chars)</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3 pr-11 text-sm text-pearl placeholder-pearl-muted outline-none transition-all focus:border-saffron focus:ring-2 focus:ring-saffron/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-pearl-muted hover:text-pearl text-xs font-mono px-1 py-0.5"
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div>
          <label className="mb-1.5 block font-mono text-xs font-semibold text-pearl-dim">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3 text-sm text-pearl placeholder-pearl-muted outline-none transition-all focus:border-saffron focus:ring-2 focus:ring-saffron/20"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-xs text-saffron font-medium">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 relative group overflow-hidden w-full rounded-xl bg-saffron-gradient py-3.5 text-sm font-semibold text-pearl shadow-saffron-glow transition-all duration-300 hover:scale-[1.01] active:scale-98 disabled:opacity-50"
        >
          <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
        </button>
      </form>

      <Divider>or continue with</Divider>

      <GoogleSignInButton />

      <p className="mt-6 text-center text-xs text-pearl-dim">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-gold hover:underline">
          Log in
        </Link>
      </p>
    </AuthScreen>
  )
}
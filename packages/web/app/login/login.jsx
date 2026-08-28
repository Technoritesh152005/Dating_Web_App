'use client'

import { useAuth } from '@/lib/authContext'
import Link from 'next/link'
import { AuthScreen, Divider } from '@/components/authScreen'
import { GoogleSignInButton } from '@/components/google_signIn_Button.jsx'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async function (e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await login(email, password)
      const status = result.user?.profile?.verificationStatus
      router.push(status === 'VERIFIED' || status === 'UNDER_REVIEW' ? '/discover' : '/onBoarding')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
      setSubmitting(false)
    }
  }

  return (
    <AuthScreen eyebrow="Account Access" title="Log in to Melodis" subtitle="Welcome back! Please enter your details to continue.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email Input */}
        <div>
          <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-wider text-pearl">Email Address</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3.5 text-sm text-pearl placeholder-pearl-muted outline-none transition-all focus:border-saffron focus:ring-2 focus:ring-saffron/20"
          />
        </div>

        {/* Password Input with Show/Hide Toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono text-xs font-semibold uppercase tracking-wider text-pearl">Password</label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-plum-border bg-plum-night/80 px-4 py-3.5 pr-12 text-sm text-pearl placeholder-pearl-muted outline-none transition-all focus:border-saffron focus:ring-2 focus:ring-saffron/20"
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

        {error && (
          <div role="alert" className="rounded-xl border border-saffron/40 bg-saffron/10 p-3.5 text-xs text-saffron font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 relative group overflow-hidden w-full rounded-xl bg-saffron-gradient py-3.5 text-sm font-semibold text-pearl shadow-saffron-glow transition-all duration-300 hover:scale-[1.01] active:scale-98 disabled:opacity-50"
        >
          <span>{submitting ? 'Authenticating...' : 'Log In'}</span>
        </button>
      </form>

      <Divider>or continue with</Divider>

      <GoogleSignInButton />

      <p className="mt-6 text-center text-xs text-pearl-dim">
        Don't have an account?{' '}
        <Link href="/signup" className="font-semibold text-gold hover:underline">
          Create an account
        </Link>
      </p>
    </AuthScreen>
  )
}
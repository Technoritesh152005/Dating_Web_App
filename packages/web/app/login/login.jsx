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
    <AuthScreen eyebrow="Welcome back" title="Log in to Melodis" subtitle="Enter your details to continue.">
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
              autoComplete="current-password"
              required
              placeholder="••••••••"
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
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <Divider>or continue with</Divider>

      <GoogleSignInButton />

      <p className="mt-6 text-center text-xs text-taupe">
        Don't have an account?{' '}
        <Link href="/signup" className="text-espresso underline underline-offset-2 hover:text-rosewood transition-colors">
          Create one
        </Link>
      </p>
    </AuthScreen>
  )
}

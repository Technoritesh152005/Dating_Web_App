'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'

/**
 * VerifiedLayout - Central verification state handler for protected routes
 *
 * Behavior:
 * - VERIFIED: Renders children (normal app access)
 * - UNDER_REVIEW: Shows verification pending UI, does NOT create new request
 * - REJECTED / REVERIFICATION_REQUIRED / PENDING: Redirects to /onboarding for verification flow
 *
 * Verification routes (/onboarding, /verification/*) must be accessible to users needing verification
 * to prevent redirect loops.
 */
export function VerifiedLayout({ children, allowedPaths = ['/onboarding'] }) {
    const auth = useAuth()
    const { user, loading, getVerificationStatus, needsVerification } = auth
    const router = useRouter()

    useEffect(() => {
        if (loading) return

        // Not authenticated - redirect to login
        if (!user) {
            router.push('/login')
            return
        }

        // Check if current path is allowed for unverified users
        const currentPath = window.location.pathname
        const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path))

        const status = getVerificationStatus()

        if (status === 'VERIFIED') {
            // Fully verified - allow access
            return
        }

        if (status === 'UNDER_REVIEW') {
            // Verification in progress - show pending UI (handled by children or page)
            // Don't redirect, let the page show the pending state
            return
        }

        // REJECTED, REVERIFICATION_REQUIRED, PENDING - needs verification
        if (needsVerification() && !isAllowedPath) {
            router.push('/onboarding')
            return
        }
    }, [user, loading, router, getVerificationStatus, needsVerification, allowedPaths])

    // During loading or while checking, don't render children
    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">Loading…</p>
            </main>
        )
    }

    // Not authenticated
    if (!user) {
        return null // Will redirect via useEffect
    }

    const status = getVerificationStatus()

    // UNDER_REVIEW - show pending state
    if (status === 'UNDER_REVIEW') {
        return (
            <main className="flex min-h-screen items-center justify-center px-6">
                <div className="max-w-md p-8 text-center">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">
                        Verification in progress
                    </p>
                    <h1 className="font-display text-2xl text-cream">
                        Your verification is under review
                    </h1>
                    <p className="mt-3 text-[15px] leading-relaxed text-cream-dim">
                        Your verification is being processed. You can keep using the app while it finishes.
                    </p>
                </div>
            </main>
        )
    }

    // Render children for VERIFIED users, or for unverified users on allowed paths
    return <>{children}</>
}

/**
 * VerificationRequiredLayout - For pages that specifically need verification flow access
 * (like /onboarding). Allows access to all verification states.
 */
export function VerificationRequiredLayout({ children }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading || !user) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">Loading…</p>
            </main>
        )
    }

    return <>{children}</>
}
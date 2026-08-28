'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import Script from 'next/script'
import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'

export function GoogleSignInButton() {
    const buttonRef = useRef(null)
    const { loginWithGoogle } = useAuth()
    const router = useRouter()
    const [error, setError] = useState('')

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
        console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured')
    }

    const handleCredential = useCallback(async (response) => {
        setError('')
        try {
            const result = await loginWithGoogle(response.credential)
            const status = result.user?.profile?.verificationStatus
            router.push(status === 'VERIFIED' || status === 'UNDER_REVIEW' ? '/discover' : '/onBoarding')
        } catch (err) {
            setError(err.message || 'Google sign-in failed. Please try again.')
        }
    }, [loginWithGoogle, router])

    const initializeGoogleButton = useCallback(() => {
        if (!window.google || !buttonRef.current || !clientId) return

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredential
        })

        window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: 320,
            text: 'continue_with',
        })
    }, [handleCredential, clientId])

    useEffect(() => {
        return () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect()
            }
        }
    }, [])

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={initializeGoogleButton}
            />
            {error && <p role="alert" className="mt-3 text-xs text-sindoor-light text-center">{error}</p>}
            <div className="flex justify-center items-center w-full" ref={buttonRef} />
        </div>
    )
}
'use client'

import { useRef, useCallback, useEffect } from 'react'
import Script from 'next/script'
import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'

export function GoogleSignInButton() {
    const buttonRef = useRef(null)
    const { loginWithGoogle } = useAuth()
    const router = useRouter()

    // Validate required env variable
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
        console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured')
    }

    /* This function is handled when google gives response */
    const handleCredential = useCallback(async (response) => {
        try {
            await loginWithGoogle(response.credential)
            // navigate the person to onboarding page
            router.push('/onboarding')
        } catch (err) {
            // Error is handled by auth context / UI - no console.error to avoid data leaks
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect()
            }
        }
    }, [])

    return (
        <>
        {/* Load this google js library of google sign in and when loaded call the onload which initialize the google signin button */}
        <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onLoad={initializeGoogleButton}
        />
        <div ref={buttonRef} />
        </>
    )
}
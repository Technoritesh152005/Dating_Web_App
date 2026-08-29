/* This file manage the state of auth of user around all the application */
'use client'
import { api } from '../lib/api.js'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const authContext = createContext(null)


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true);/* it is true until auth/me check finishes */
    const [sessionBanner, setSessionBanner] = useState('')

    // Remember this function so React doesn't create a new checkAuth function on every render.
    const checkAuth = useCallback(async () => {

        try {
            const me = await api.get('/auth/me')
            setUser(me)
            setSessionBanner('')
            return me
        } catch (err) {
            // Handle 403 VERIFICATION_REQUIRED - user is authenticated but not verified
            if (err?.status === 403 && err?.body?.error === 'VERIFICATION_REQUIRED') {
                // Return minimal user object with verification status so UI can show proper state
                setUser({
                    id: null,
                    verificationRequired: true,
                    verificationStatus: err.body.verificationStatus,
                    message: err.body.message
                })
                setSessionBanner('')
                return null
            } else {
                // Only show session expired banner if user was previously authenticated
                setUser((prevUser) => {
                    if (prevUser && err?.status === 401) {
                        setSessionBanner(err?.body?.error || 'Your session expired. Please log in again.')
                    }
                    return null
                })
                return null
            }
        } finally {
            setLoading(false)
        }
    }, [])


    /* Whenever a component renders , it calls the auth check */
    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    const signup = async (email, password) => {
        const response = await api.post('/auth/signup', { email, password })
        const user = await checkAuth()
        return { ...response, user }
    }

    // u get checkAuth after getting response from backend is because when u get the response u can set the user in ur createcontext
    const login = async (email, password) => {
        setSessionBanner('')
        const result = await api.post('/auth/login', { email, password })
        const user = await checkAuth()
        return { ...result, user }
    }

    const loginWithGoogle = async (idToken) => {
        const result = await api.post('/auth/google/callback', { idToken })
        const user = await checkAuth()
        return { ...result, user }
    }
    const logout = async () => {
        await api.post('/auth/logout', {});
        setUser(null);
    };

    // Helper to get verification status from user or user.profile
    const getVerificationStatus = useCallback(() => {
        if (!user) return 'NOT_AUTHENTICATED'
        if (user.verificationRequired) return user.verificationStatus
        return user.profile?.verificationStatus || 'PENDING'
    }, [user])

    // Helper to check if user is verified (has VERIFIED status)
    const isVerified = useCallback(() => {
        return getVerificationStatus() === 'VERIFIED'
    }, [getVerificationStatus])

    // Helper to check if user needs verification (REJECTED, REVERIFICATION_REQUIRED, PENDING)
    const needsVerification = useCallback(() => {
        const status = getVerificationStatus()
        return ['REJECTED', 'REVERIFICATION_REQUIRED', 'PENDING'].includes(status)
    }, [getVerificationStatus])

    // Helper to check if verification is in progress (UNDER_REVIEW)
    const isVerificationPending = useCallback(() => {
        return getVerificationStatus() === 'UNDER_REVIEW'
    }, [getVerificationStatus])

    // Auto-redirect to login after session expired banner triggers
    useEffect(() => {
        if (sessionBanner) {
            const timer = setTimeout(() => {
                setSessionBanner('')
                if (typeof window !== 'undefined') window.location.href = '/login'
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [sessionBanner])

    const handleRedirectToLogin = () => {
        setSessionBanner('')
        if (typeof window !== 'undefined') window.location.href = '/login'
    }

    return (
        <authContext.Provider value={{
            user,
            loading,
            signup,
            login,
            loginWithGoogle,
            logout,
            refetch: checkAuth,
            getVerificationStatus,
            isVerified,
            needsVerification,
            isVerificationPending,
            sessionBanner,
            clearSessionBanner: () => setSessionBanner('')
        }}>
            {sessionBanner && (
                <div className="fixed inset-x-0 top-6 z-[100] flex justify-center px-4 animate-fade-in">
                    <div className="flex items-center gap-4 max-w-lg rounded-2xl border border-saffron/40 bg-plum-night/95 p-4 text-pearl shadow-2xl backdrop-blur-xl">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron/20 text-saffron font-bold">
                            !
                        </div>
                        <div className="flex-1 text-xs">
                            <p className="font-mono font-bold uppercase text-saffron tracking-wider">Session Expired</p>
                            <p className="text-pearl-dim mt-0.5">{sessionBanner}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRedirectToLogin}
                            className="shrink-0 rounded-xl bg-saffron-gradient px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-pearl shadow-saffron-glow transition hover:scale-105"
                        >
                            Log In Now
                        </button>
                    </div>
                </div>
            )}
            {children}
        </authContext.Provider>
    );
}
// it shares user auth related context data
export function useAuth() {
    // further they use context from authcontext
    const ctx = useContext(authContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
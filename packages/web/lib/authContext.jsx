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

    //   this returns an component that whichever cild function call will come in the children and use this
    // means ay child inside this can access this value
    // authcontext provides data to authcontext.provider
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
                <div className="fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
                    <div className="max-w-md rounded-full border border-sindoor/30 bg-[linear-gradient(135deg,rgba(230,57,80,0.16),rgba(240,162,2,0.12))] px-4 py-2 text-center text-sm text-cream shadow-[0_18px_35px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                        {sessionBanner}
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
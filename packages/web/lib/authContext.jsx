/* This file manage the state of auth of user around all the application */
'use client'
import { api } from '../lib/api.js'
import { createContext, useContext, useState, useCallback } from 'react'

const authContext = createContext(null)


export function authProvider({ children }) {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true);/* it is true until auth/me check finishes */

    // Remember this function so React doesn't create a new checkAuth function on every render.
    const checkAuth = useCallback(async () => {

        try {
            const me = api.get('/auth/me')
            setUser(me)
        } catch (err) {
            setUser(null)
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
        checkAuth()
        return response
    }

    // u get checkAuth after getting response from backend is because when u get the response u can set the user in ur createcontext
    const login = async (email, password) => {
        const result = await api.post('/auth/login', { email, password })
        checkAuth()
        return result
    }

    const loginWithGoogle = async (email, password) => {
        const result = await api.post('/auth/google', { idToken })
        await checkAuth()
        return result
    }
    const logout = async () => {
        await api.post('/auth/logout', {});
        setUser(null);
    };

    //   this returns an component that whichever cild function call will come in the children and use this 
    // means ay child inside this can access this value
    // authcontext provides data to authcontext.provider
    return (
        <authContext.Provider value={{ user, loading, signup, login, loginWithGoogle, logout, refetch: checkAuth }}>
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

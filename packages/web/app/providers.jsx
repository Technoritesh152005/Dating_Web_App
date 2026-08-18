'use client'
import {AuthProvider} from '../lib/authContext'

export function Providers({children}){
    return <AuthProvider>{children}</AuthProvider>
}
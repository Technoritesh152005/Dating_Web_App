'use client'
import {authProvider} from '../lib/authContext'

export function Providers({children}){
    return <authProvider>{children}</authProvider>
}
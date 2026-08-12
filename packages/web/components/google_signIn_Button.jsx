'use client'

import {useRef , useCallback} from 'react'
import Script from 'next/script'
import {useAuth} from '../lib/authContext'
import {useRouter} from 'next/navigation'

export function googleSignInButton(){

    const buttonRef = useRef(null)
    const {loginWithGoogle} = useAuth()
    const router = useRouter()

    /* This function is handled when google gives response */
    const handleCredential = useCallback(async (response)=>{

        try{
            await loginWithGoogle(response.credential)
            // navigate the person to onboarding page
            router.push('/onboarding')
        }catch(err){
            console.error('Google sign-in failed:', err);
        }
        /* we usually take dependencies value which are out of the callback function and we use it */
        /* at every re render of auth context its provider value also changes so we need to keep the new values also so we put these dependencies */
    }, [loginWithGoogle, router])

    const initializeGoogleButton = useCallback(()=>{
        if(!window.google || !buttonRef.current) return 

        window.google.accounts.id.initialize({
            client_id:process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback:handleCredential
        })

        window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: 320,
            text: 'continue_with',
          });

    },[handleCredential])

    return (
        <>
        {/* Load this google js library of google sign in and when loaded call the onload which initialize the google signin button */}
        <Script src = "https://accounts.google.com/gsi/client" strategy = "afterInteractive" onLoad ={initializeGoogleButton}>
            
        </Script>
        </>
    )

}
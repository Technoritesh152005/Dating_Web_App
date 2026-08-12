'use client'

import {useAuth} from '../../lib/authContext'
import {useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {AuthScreen} from '@/components/authScreen.jsx'
import { googleSignInButton } from '@/components/google_signIn_Button'
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function signUpPage(){

    const {signup} = useAuth()
    const [email, setEmail] = useState('')
    const [password,setPassword] = useState('')
    const router = useRouter()
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async(e)=>{
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
          }
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
          }
        setSubmitting(true)

        try{
            await signup(email,password)
            router.push('/onboarding')
        }catch(err){
            setError(err.message)
            setSubmitting(false)
        }
    }

    return (
        <AuthScreen eyebrow="Get started" title="Create your account" subtitle="Your profile comes next — this part just gets you in the door.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
  
          {error && (
            <p role="alert" className="text-[14px] text-sindoor-light">
              {error}
            </p>
          )}
  
          <Button type="submit" variant="primary" disabled={submitting} showBloom className="mt-2 w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
  
        <Divider>or continue with</Divider>
  
        <GoogleSignInButton />
  
        <p className="mt-6 text-center text-[14px] text-cream-dim">
          Already have an account?{' '}
          <Link href="/login" className="text-marigold hover:underline">
            Log in
          </Link>
        </p>
      </AuthScreen>
    )
}
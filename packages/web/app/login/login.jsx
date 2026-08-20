'use client'

import {useAuth} from '@/lib/authContext'
import Link from 'next/link'
import {AuthScreen} from '@/components/authScreen'
import {Input} from '../../components/user_interface/Input'
import {Button} from '../../components/user_interface/Button.jsx'
import { GoogleSignInButton } from '@/components/google_signIn_Button.jsx'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import { Divider } from '@/components/authScreen'

export default function LoginPage(){

const {login} = useAuth()
const [email,setEmail] = useState('')
const [password,setPassword] = useState('')
const [error,setError] = useState('')
const [submitting, setSubmitting] = useState(false)
const router = useRouter()

const handleSubmit =  async function(e){
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try{
        await login(email , password)
        // we dont know if user has a profile so me forward him to onboarding where we check there only
        router.push('/onBoarding')
    }catch(error){
        setError(error.message);
      setSubmitting(false);
    }
}

return (
    <AuthScreen eyebrow="Welcome back" title="Log in to Melodis" subtitle="Pick up where your conversations left off.">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="text-[14px] text-sindoor-light">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={submitting} showBloom className="mt-2 w-full">
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <Divider>or continue with</Divider>

      <GoogleSignInButton />

      <p className="mt-6 text-center text-[14px] text-cream-dim">
        New to Melodis?{' '}
        <Link href="/signup" className="text-marigold hover:underline">
          Create an account
        </Link>
      </p>
    </AuthScreen>
)

}
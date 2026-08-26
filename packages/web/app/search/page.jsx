'use client'

import {api} from '@/lib/api.js'
import {useState} from 'react'
import { NavBar } from '@/components/Navbar'
import { ProfileDetailModal } from '@/components/ProfileDetailModel'
import { Button } from '@/components/user_interface/Button'

export default function searchPage(){

    const [username, setUsername] = useState('')
    const [profile, setProfile] = useState(null)
    const [searching, setSearching] = useState(false)
    const [searched, setSearched] = useState(false)
    const [error, setError] = useState(null)
    const [detailOpen , setDetailOpen] = useState(false)

    const search = async(event)=>{
        event.preventDefault()

        const normalizedUsername = username.trim().toLowerCase()
        if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setError('Use a valid username')
      setProfile(null)
      setSearched(true)
      return
    }

    setSearching(true)
    setError(null)

    try{
        const result = await api.get(`/search/users?username=${encodeURIComponent(normalizedUsername)}`)
        setProfile(result.profile?? null)
        setSearched(true)
      }catch(error){
        setError(error.message || 'Search failed')
      setProfile(null)
    }finally{
        setSearching(false)
    }

    }

    return (
    <main className="min-h-screen bg-ink px-4 pb-16 pt-4 text-cream sm:px-8">
      <NavBar />

      <div className="mx-auto mt-12 w-full max-w-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">
          Find someone
        </p>

        <h1 className="mt-2 font-display text-4xl text-cream">
          Search by username
        </h1>

        <form
          onSubmit={search}
          className="mt-8 flex gap-2 rounded-card border border-cream/10 bg-dusk p-2"
        >
          <input
            value={username}
            onChange={(event) =>
              setUsername(event.target.value.toLowerCase())
            }
            placeholder="username"
            maxLength={20}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-cream/10 bg-ink/50 px-4 py-3 font-mono text-sm text-cream outline-none placeholder:text-cream/35 focus:border-marigold/60"
          />

          <Button type="submit" variant="primary" disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-sindoor-light">
            {error}
          </p>
        )}

        {!error && searched && !profile && (
          <p className="mt-8 text-center text-sm text-cream-dim">
            No profile found for that username.
          </p>
        )}

        {profile && (
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="mt-8 flex w-full items-center gap-4 rounded-card border border-cream/10 bg-dusk p-4 text-left transition hover:border-marigold/50"
          >
            {profile.photos?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photos[0].url}
                alt={profile.displayName}
                className="h-20 w-20 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-dusk-light font-display text-3xl text-cream-dim">
                {profile.displayName?.[0]}
              </div>
            )}

            <div>
              <p className="font-display text-xl text-cream">
                {profile.displayName}
              </p>
              <p className="font-mono text-xs text-cream-dim">
                @{profile.username}
              </p>
            </div>
          </button>
        )}

        {detailOpen && profile && (
          <ProfileDetailModal
            profile={profile}
            onClose={() => setDetailOpen(false)}
          />
        )}
      </div>
    </main>
  )
}
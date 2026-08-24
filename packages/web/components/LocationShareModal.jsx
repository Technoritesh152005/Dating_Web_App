'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/user_interface/Button'
import { Card } from '@/components/user_interface/Card'
import { ChoicePills } from '@/components/user_interface/ChoicePills'

const DURATION_OPTIONS = [
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
]

const UPDATE_INTERVAL_MS = 45_000

export function LocationShareModal({ open, onClose }) {

    const [duration, setDuration] = useState(60)
    const [contactName, setContactName] = useState('')
    const [share, setShare] = useState(null)
    const [starting, setStarting] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState(null)
    const intervalRef = useRef(null)

    /* when the user leaves the page it cleans the interval */
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    /* this handler saves the coordinates in ur db */
    const pushLocationUpdate = (shareId) => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (position) => {
                api.post(`/safety/location-share/${shareId}/update`, {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }).catch(() => {
                    // Silently fail - location updates are best effort
                })
            },
            () => {
                // Geolocation permission denied or unavailable - silently fail
            }
        )
    }

    /* when user clicks start sharing it creates a share url where it get token from backend and push the location to location updates where the location gets updated every 45 seconds */
    const startSharing = async () => {
        setError(null)
        setStarting(true)

        try {
            const result = await api.post('/safety/location-share', { durationMinutes: duration, contactName })
            const shareUrl = `${window.location.origin}/location/${result.token}`
            setShare({ shareId: result.shareId, shareUrl, expiresAt: result.expiresAt })

            /* now push the location updates to ur db */
            pushLocationUpdate(result.shareId)
            /* also at every 45 seconds update the location */
            intervalRef.current = setInterval(() => pushLocationUpdate(result.shareId), UPDATE_INTERVAL_MS)
        } catch (err) {
            setError(err.message || 'Failed to start location sharing')
        } finally {
            setStarting(false)
        }
    }

    const stopSharing = async function () {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        if (share) {
            await api.post(`/safety/location-share/${share.shareId}/stop`).catch(() => {})
        }
        setShare(null)
        onClose()
    }

    const copyLink = async () => {
        if (!share) return
        await navigator.clipboard.writeText(share.shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-6 backdrop-blur-sm">
            <Card className="w-full max-w-sm p-6">
                {!share ? (
                    <>
                        <h3 className="font-display text-xl text-cream">Share your live location</h3>
                        <p className="mt-1 text-[14px] text-cream-dim">
                            A trusted contact can watch your location until the timer ends — no account needed on their end.
                        </p>

                        <div className="mt-5">
                            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">For how long</p>
                            <ChoicePills options={DURATION_OPTIONS} value={duration} onChange={setDuration} />
                        </div>

                        <div className="mt-4">
                            <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">
                                Contact name (optional)
                            </label>
                            <input
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="e.g. Mom, Priya"
                                className="w-full rounded-2xl border border-cream/10 bg-dusk-light px-5 py-3 text-[15px] text-cream outline-none focus:border-marigold/60"
                            />
                        </div>

                        {error && <p className="mt-3 text-[13px] text-sindoor-light">{error}</p>}

                        <div className="mt-6 flex gap-3">
                            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                            <Button variant="primary" onClick={startSharing} disabled={starting} className="flex-1">
                                {starting ? 'Starting…' : 'Start sharing'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="font-display text-xl text-cream">You're sharing your location</h3>
                        <p className="mt-1 text-[14px] text-cream-dim">Send this link to your contact:</p>

                        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-cream/10 bg-dusk-light px-4 py-3">
                            <span className="flex-1 truncate font-mono text-[12px] text-cream-dim">{share.shareUrl}</span>
                            <button onClick={copyLink} className="flex-shrink-0 font-mono text-[11px] uppercase text-marigold hover:underline">
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <p className="mt-3 font-mono text-[11px] text-cream-dim">
                            Ends {new Date(share.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        <Button variant="secondary" onClick={stopSharing} className="mt-6 w-full">
                            Stop sharing now
                        </Button>
                    </>
                )}
            </Card>
        </div>
    )
}
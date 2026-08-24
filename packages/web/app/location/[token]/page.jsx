'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { API_URL } from '@/lib/api'
import { Card } from '@/components/user_interface/Card';

const POLL_INTERVAL = 35_000

/* this is the viewer side page , where no authentication is required */
export default function PublicLocationPage() {

    const { token } = useParams()
    const [location, setLocation] = useState(null)
    const [status, setStatus] = useState('loading')   /* location showing status can be loading , active , ended */

    useEffect(() => {
        let cancelled = false;

        const poll = async () => {
            try {
                // Raw fetch, not the api.js wrapper - this call is intentionally
                // unauthenticated (no credentials needed or sent), matching the
                // backend route it's calling.
                const response = await fetch(`${API_URL}/safety/location/${token}`);
                if (response.status === 410) {
                    if (!cancelled) setStatus('ended');
                    return;
                }
                if (!response.ok) throw new Error();
                const data = await response.json();
                if (!cancelled) {
                    setLocation(data);
                    setStatus('active');
                }
            } catch {
                if (!cancelled) setStatus('ended');
            }
        };

        poll();
        const interval = setInterval(poll, POLL_INTERVAL);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [token]);

    if (status === 'loading') {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">Loading…</p>
            </main>
        );
    }

    if (status === 'ended') {
        return (
            <main className="flex min-h-screen items-center justify-center px-6">
                <Card className="max-w-sm p-8 text-center">
                    <h1 className="font-display text-2xl text-cream">This link has ended</h1>
                    <p className="mt-3 text-[15px] text-cream-dim">
                        The person who shared this either stopped sharing or the time window closed.
                    </p>
                </Card>
            </main>
        );
    }

    const hasPosition = location && location.latitude != null && location.longitude != null;
    const mapsUrl = hasPosition ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : null;

    return (
        <main className="flex min-h-screen items-center justify-center px-6">
            <Card className="w-full max-w-sm p-8 text-center">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">Live location</p>
                <h1 className="font-display text-2xl text-cream">
                    {location?.contactName ? `Shared with ${location.contactName}` : 'Shared with you'}
                </h1>

                {hasPosition ? (
                    <>
                        <p className="mt-4 font-mono text-[13px] text-cream-dim">
                            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-cream-dim">
                            Last updated{' '}
                            {location.lastUpdatedAt
                                ? new Date(location.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'just now'}
                        </p>
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 inline-block rounded-full bg-gradient-to-r from-sindoor to-marigold px-6 py-3 font-semibold text-ink"
                        >
                            Open in Maps
                        </a>
                    </>
                ) : (
                    <p className="mt-4 text-[14px] text-cream-dim">Waiting for the first location update…</p>
                )}

                {location?.expiresAt && (
                    <p className="mt-6 font-mono text-[11px] text-cream-dim">
                        This link stops working at {new Date(location.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </Card>
        </main>
    );
}
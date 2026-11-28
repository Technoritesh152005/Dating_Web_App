'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/user_interface/Button'
import { ChoicePills } from '@/components/user_interface/ChoicePills'
import { Input } from '@/components/user_interface/Input'

const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Men' },
    { value: 'FEMALE', label: 'Women' },
    { value: 'NON_BINARY', label: 'Non-binary' },
    { value: 'OTHER', label: 'Other' },
]

const DEFAULT_FILTERS = { minAge: 21, maxAge: 35, maxDistanceKm: 50, genderPreference: [] }

export function PreferencesForm() {
    const [filters, setFilters] = useState(DEFAULT_FILTERS)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        api.get('/preferences')
            .then((data) => {
                if (!data.usingDefaults) {
                    setFilters({
                        minAge: data.minAge,
                        maxAge: data.maxAge,
                        maxDistanceKm: data.maxDistanceKm ?? data.maxDistance,
                        genderPreference: data.genderPreference ?? [],
                    })
                }
            })
            .catch((err) => {
                setError(err.message || 'Failed to load preferences')
            })
            .finally(() => setLoading(false))
    }, [])

    const save = async () => {
        setSaving(true)
        setSaved(false)
        setError(null)

        if (filters.minAge >= filters.maxAge) {
            setError('Min age must be less than max age')
            setSaving(false)
            return
        }

        try {
            await api.put('/preferences', filters)
            setSaved(true)
            window.setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            setError(err.message || 'Failed to save preferences')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="mx-auto w-full max-w-2xl space-y-0 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#e95161]">Preferences</p>
            <h1 className="mt-2 font-display text-3xl text-[#292321] sm:text-4xl">Who you want to meet</h1>
            <p className="mt-3 text-sm text-[#827871]">These settings control the people shown in Discover.</p>

            {error && <p role="alert" className="mt-4 text-[13px] text-[#b73946]">{error}</p>}

            <div className="mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Min age"
                        type="number"
                        min={18}
                        max={99}
                        value={filters.minAge}
                        disabled={loading}
                        onChange={(e) => setFilters((current) => ({ ...current, minAge: Number(e.target.value) }))}
                    />
                    <Input
                        label="Max age"
                        type="number"
                        min={18}
                        max={99}
                        value={filters.maxAge}
                        disabled={loading}
                        onChange={(e) => setFilters((current) => ({ ...current, maxAge: Number(e.target.value) }))}
                    />
                </div>

                <Input
                    label={`Distance - up to ${filters.maxDistanceKm} km`}
                    type="range"
                    min={5}
                    max={200}
                    value={filters.maxDistanceKm}
                    disabled={loading}
                    onChange={(e) => setFilters((current) => ({ ...current, maxDistanceKm: Number(e.target.value) }))}
                    className="accent-[#e95161]"
                />

                <div>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#827871]">Show me</p>
                    <ChoicePills
                        options={GENDER_OPTIONS}
                        value={filters.genderPreference}
                        onChange={(value) => setFilters((current) => ({ ...current, genderPreference: value }))}
                        multiple
                    />
                </div>
            </div>

            <Button variant="primary" onClick={save} disabled={saving || loading} className="mt-8 w-full sm:w-auto">
                {saving ? 'Saving...' : loading ? 'Loading...' : saved ? 'Saved' : 'Save preferences'}
            </Button>
        </section>
    )
}

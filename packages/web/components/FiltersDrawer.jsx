'use client'

import { useState, useEffect } from 'react'
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

export function FiltersDrawer({ open, onClose, onSaved }) {

    const [filters, setFilters] = useState(DEFAULT_FILTERS)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!open) return
        setLoading(true)
        setError(null)
        api.get('/preferences')
            .then((data) => {
                if (!data.usingDefaults) {
                    setFilters({
                        minAge: data.minAge,
                        maxAge: data.maxAge,
                        maxDistanceKm: data.maxDistanceKm ?? data.maxDistance,
                        genderPreference: data.genderPreference
                    })
                }
            })
            .catch((err) => {
                setError('Failed to load preferences')
                console.error('Load preferences failed:', err)
            })
            .finally(() => setLoading(false))
        /* if any one click the filter this open becomes true and this runs effect */
    }, [open])

    if (!open) return null

    /* This happens when user clicks save apply filter */
    const save = async () => {
        setSaving(true)
        setError(null)

        // Validate filters before saving
        if (filters.minAge >= filters.maxAge) {
            setError('Min age must be less than max age')
            setSaving(false)
            return
        }

        try {
            await api.put('/preferences', filters);
            /* if parent provided what to do after saving call that function */
            onSaved?.()
            onClose()
        } catch (err) {
            setError(err.message || 'Failed to save preferences')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-card bg-dusk p-8 sm:rounded-card"
            >
                <h2 className="font-display text-2xl text-cream">Filters</h2>

                {error && <p className="mt-3 text-[13px] text-sindoor-light">{error}</p>}

                <div className="mt-6 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Min age"
                            type="number"
                            min={18}
                            max={99}
                            value={filters.minAge}
                            onChange={(e) => setFilters((f) => ({ ...f, minAge: Number(e.target.value) }))}
                        />
                        <Input
                            label="Max age"
                            type="number"
                            min={18}
                            max={99}
                            value={filters.maxAge}
                            onChange={(e) => setFilters((f) => ({ ...f, maxAge: Number(e.target.value) }))}
                        />
                    </div>

                    <Input
                        label={`Distance — up to ${filters.maxDistanceKm} km`}
                        type="range"
                        min={5}
                        max={200}
                        value={filters.maxDistanceKm}
                        onChange={(e) => setFilters((f) => ({ ...f, maxDistanceKm: Number(e.target.value) }))}
                        className="accent-marigold"
                    />

                    <div>
                        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">Show me</p>
                        <ChoicePills
                            options={GENDER_OPTIONS}
                            value={filters.genderPreference}
                            onChange={(v) => setFilters((f) => ({ ...f, genderPreference: v }))}
                            multiple
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1" disabled={saving || loading}>Cancel</Button>
                    <Button variant="primary" onClick={save} disabled={saving || loading} className="flex-1">
                        {saving ? 'Saving…' : loading ? 'Loading…' : 'Apply'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
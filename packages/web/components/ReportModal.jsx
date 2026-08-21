'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/user_interface/Button'
import { Card } from '@/components/user_interface/Card'
import { ChoicePills } from '@/components/user_interface/ChoicePills'

const REASONS = [
    { value: 'Fake profile', label: 'Fake profile' },
    { value: 'Inappropriate photos', label: 'Inappropriate photos' },
    { value: 'Harassment', label: 'Harassment' },
    { value: 'Spam or scam', label: 'Spam or scam' },
    { value: 'Underage', label: 'Underage' },
    { value: 'Other', label: 'Other' },
]

export function ReportModal({ open, reportedUserId, onClose, onSubmitted }) {

    const [reason, setReason] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    if (!open) return null

    const submit = async () => {
        if (!reason) return
        setSubmitting(true)
        setError(null)
        try {
            await api.post('/safety/report', { reporteduserId: reportedUserId, reason })
            onSubmitted?.()
            onClose()
        } catch (err) {
            setError(err.message || 'Failed to submit report')
        } finally {
            setSubmitting(false)
            setReason(null)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-6 backdrop-blur-sm" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <Card className="w-full max-w-sm p-6">
                    <h3 className="font-display text-xl text-cream">Report this profile</h3>
                    <p className="mt-1 text-[14px] text-cream-dim">What's going on? This is reviewed by our safety team.</p>

                    <div className="mt-4">
                        <ChoicePills options={REASONS} value={reason} onChange={setReason} />
                    </div>

                    {error && <p className="mt-3 text-[13px] text-sindoor-light">{error}</p>}

                    <div className="mt-6 flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="flex-1" disabled={submitting}>Cancel</Button>
                        <Button variant="primary" onClick={submit} disabled={!reason || submitting} className="flex-1">
                            {submitting ? 'Submitting…' : 'Submit report'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
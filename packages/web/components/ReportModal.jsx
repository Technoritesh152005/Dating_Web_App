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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292321]/35 px-6 backdrop-blur-sm" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <Card className="w-full max-w-sm !border-[#eadfd8] !bg-white p-6 shadow-[0_24px_70px_-35px_rgba(41,35,33,0.35)]">
                    <h3 className="font-display text-xl text-[#292321]">Report this profile</h3>
                    <p className="mt-1 text-sm text-[#71655f]">What's going on? This is reviewed by our safety team.</p>

                    <div className="mt-4">
                        <ChoicePills options={REASONS} value={reason} onChange={setReason} />
                    </div>

                    {error && <p className="mt-3 text-[13px] text-[#b73946]">{error}</p>}

                    <div className="mt-6 flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="!flex-1 !border-[#eadfd8] !bg-[#f8f4f0] !text-[#655d58] hover:!bg-[#f1eae4]" disabled={submitting}>Cancel</Button>
                        <Button variant="primary" onClick={submit} disabled={!reason || submitting} className="!flex-1 !bg-[#e95161] !text-white hover:!bg-[#d94355]">
                            {submitting ? 'Submitting…' : 'Submit report'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ChoicePills } from './ui/ChoicePills';

const REASONS = [
    { value: 'Fake profile', label: 'Fake profile' },
    { value: 'Inappropriate photos', label: 'Inappropriate photos' },
    { value: 'Harassment', label: 'Harassment' },
    { value: 'Spam or scam', label: 'Spam or scam' },
    { value: 'Underage', label: 'Underage' },
    { value: 'Other', label: 'Other' },
];

export function ReportModal({ open, reportedUserId, onClose, onSubmitted }) {

    const [reason, setReason] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    if (!open) return null

    const submit = async () => {
        if (!reason) return null
        setSubmitting(true)
        try {
            await api.post('/safety/report', { reportedUserId, reason })
            onSubmitted?.()
            onClose()
        } catch (error) {
            throw new Error()
        } finally {
            setSubmitting(false)
            setReason(false)
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

                    <div className="mt-6 flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button variant="primary" onClick={submit} disabled={!reason || submitting} className="flex-1">
                            {submitting ? 'Submitting…' : 'Submit report'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
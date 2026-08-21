'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { NavBar } from '../../components/Navbar'
import { presignAndUpload } from '@/lib/uploadS3'
import { Input } from '@/components/user_interface/Input';
import { Button } from '@/components/user_interface/Button';
import { ChoicePills } from '@/components/user_interface/ChoicePills';
import { ConfirmModal } from '@/components/ConfirmModal';

const PROFESSION_OPTIONS = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'ENGINEER', label: 'Engineer' },
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'ARTIST', label: 'Artist' },
    { value: 'OTHER', label: 'Other' },
]
const INTEREST_OPTIONS = [
    'Travel', 'Music', 'Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Cooking',
    'Baking', 'Reading', 'Fitness', 'Running', 'Yoga', 'Cycling', 'Movies', 'TV Shows', 'Anime',
    'Trekking', 'Hiking', 'Photography', 'Art', 'Dancing', 'Gaming', 'Board Games', 'Technology',
    'Coding', 'Startups', 'Entrepreneurship', 'Writing', 'Poetry', 'Fashion', 'Shopping',
    'Food', 'Coffee', 'Tea', 'Street Food', 'Restaurants', 'Pets', 'Dogs', 'Cats', 'Nature', 'Beach',
    'Mountains', 'Camping', 'Adventure', 'Road Trips', 'Cars', 'Motorcycles', 'Volunteering', 'Meditation',
    'Self Improvement', 'Podcasts', 'Concerts', 'Festivals', 'Theatre', 'Comedy', 'Painting',
    'Crafts', 'DIY', 'Languages', 'History', 'Science', 'Business', 'Finance', 'Investing', 'Spirituality',
    'Socializing', 'Nightlife', 'Parties', 'Karaoke',
].map((i) => ({ value: i, label: i }))

export default function profileSettingPage() {
    const { user, loading, logout } = useAuth()
    const router = useRouter()

    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState(null)
    const [confirmLogout, setConfirmLogout] = useState(false)

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return
        }
        api.get('/profile/me')
            .then((data) => {
                setProfile(data)
                setForm({ bio: data.bio ?? '', interests: data.interests ?? [], profession: data.profession })
            })
            .catch((err) => setError(err.message || 'Failed to load profile'))
    }, [loading, user])

    const save = async () => {
        setError(null)
        if (!form.profession) {
            setError('Please select your profession before saving')
            return
        }
        setSaving(true)
        try {
            await api.put('/profile', {
                displayName: profile.displayName,
                dateOfBirth: profile.dateOfBirth,
                gender: profile.gender,
                bio: form.bio,
                interests: form.interests,
                profession: form.profession,
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            setError(err.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    //paht or action to add photos
    const addPhotos = async (fileList) => {
        setError(null)
        const files = Array.from(fileList)
            .slice(0, 6 - (profile.photos?.length ?? 0))
        for (const file of files) {
            try {
                const { key, publicUrl } = await presignAndUpload({
                    file,
                    presignPath: '/media/photos/presign',
                    confirmPath: 'media/photos/confirm',
                    //if length is 0 keep 0 and check whether length = 0.
                    extraConfirmFields:
                        { isPrimary: (profile.photos?.length ?? 0) === 0 }
                })
                setProfile((p) => ({ ...p, photos: [...p.photos, { key, url: publicUrl, isPrimary: p.photos.length === 0 }] }))
            } catch (error) {
                setError(error.message)
            }
        }
    }

    const deletePhoto = async (photoId) => {
        await api.del(`/media/photos/${photoId}`)
        //remove the deleted photot from prfile list of photos
        setProfile((p) => ({
            ...p, photos: p.photos.filter((i) => i.id != photoId)
        }))
    }

    const setPrimary = async (photoId) => {
        await api.put(`/media/photos/${photoId}/primary`, {})
        setProfile((p) => ({
            ...p,
            photos: p.photos.map((img) => ({
                ...img,
                isPrimary: img.id === photoId
            }))
        }));
    }

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }
    if (loading || !profile || !form) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">Loading…</p>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center bg-ink px-6 pb-16 pt-6">
            <NavBar />

            <div className="mt-8 w-full max-w-sm">
                <h1 className="font-display text-2xl text-cream">{profile.displayName}</h1>

                <section className="mt-6">
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">Photos</p>
                    <div className="grid grid-cols-3 gap-3">
                        {profile.photos.map((photo) => (
                            <div key={photo.id ?? photo.key} className={`relative aspect-square overflow-hidden rounded-2xl ${photo.isPrimary ? 'ring-2 ring-marigold' : ''}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                                {photo.id && (
                                    <>
                                        <button
                                            onClick={() => deletePhoto(photo.id)}
                                            aria-label="Delete photo"
                                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-[12px] text-cream backdrop-blur-sm"
                                        >
                                            ✕
                                        </button>
                                        {!photo.isPrimary && (
                                            <button
                                                onClick={() => setPrimary(photo.id)}
                                                className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 font-mono text-[9px] uppercase tracking-wide text-cream backdrop-blur-sm"
                                            >
                                                Make primary
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                        {profile.photos.length < 6 && (
                            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-2xl border border-dashed border-cream/20 text-cream-dim hover:border-marigold/50 hover:text-marigold">
                                <span className="text-2xl">+</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
                            </label>
                        )}
                    </div>
                </section>

                <section className="mt-6">
                    <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">Bio</label>
                    <textarea
                        rows={3}
                        value={form.bio}
                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                        className="w-full rounded-2xl border border-cream/10 bg-dusk-light px-5 py-3.5 text-[15px] text-cream outline-none focus:border-marigold/60"
                    />
                </section>

                <section className="mt-6">
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">Interests</p>
                    <ChoicePills options={INTEREST_OPTIONS} value={form.interests} onChange={(v) => setForm((f) => ({ ...f, interests: v }))} multiple />
                </section>

                <section className="mt-6">
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">Profession</p>
                    <ChoicePills options={PROFESSION_OPTIONS} value={form.profession} onChange={(v) => setForm((f) => ({ ...f, profession: v }))} />
                </section>

                {error && <p className="mt-4 text-[14px] text-sindoor-light">{error}</p>}

                <Button variant="primary" onClick={save} disabled={saving} showBloom className="mt-8 w-full">
                    {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
                </Button>

                <Button variant="ghost" onClick={() => setConfirmLogout(true)} className="mt-4 w-full">
                    Log out
                </Button>
            </div>

            <ConfirmModal
                open={confirmLogout}
                title="Log out?"
                confirmLabel="Log out"
                onConfirm={() => { setConfirmLogout(false); handleLogout(); }}
                onCancel={() => setConfirmLogout(false)}
            />
        </main>
    );
}
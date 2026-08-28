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
import { ProfileSettingsNav } from '@/components/ProfileSettingsNav';
import { PreferencesForm } from '@/components/PreferencesForm';
import { VoiceBioRecorder } from '@/components/voiceBioRecorder';

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
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [activePhoto, setActivePhoto] = useState(0)
    const [activeSection, setActiveSection] = useState('profile')
    const [voiceBioFile, setVoiceBioFile] = useState(null)

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return
        }
        api.get('/profile/me')
            .then((data) => {
                setProfile(data)
                setForm({ username: data.username ?? '', bio: data.bio ?? '', interests: data.interests ?? [], profession: data.profession })
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
                username: form.username,
                dateOfBirth: profile.dateOfBirth,
                gender: profile.gender,
                bio: form.bio,
                interests: form.interests,
                profession: form.profession,
            })
            if (voiceBioFile) {
                const uploaded = await presignAndUpload({
                    file: voiceBioFile,
                    presignPath: '/media/voice-bio/presign',
                    confirmPath: '/media/voice-bio/confirm',
                    allowedTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg'],
                    maxFileSize: 5 * 1024 * 1024,
                })
                setProfile(await api.get('/profile/me'))
                setVoiceBioFile(null)
            }
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            setError(err.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const removeVoiceBio = async () => {
        setError(null)
        try {
            await api.del('/media/voice-bio')
            setProfile((current) => ({ ...current, voiceBioUrl: null }))
            setVoiceBioFile(null)
        } catch (err) {
            setError(err.message || 'Failed to remove voice introduction')
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
                    confirmPath: '/media/photos/confirm',
                    //if length is 0 keep 0 and check whether length = 0.
                    extraConfirmFields:
                        { isPrimary: (profile.photos?.length ?? 0) === 0 }
                })
                setProfile((p) => ({ ...p, photos: [...p.photos, { key, url: publicUrl, isPrimary: p.photos.length === 0 }] }))
                const refreshed = await api.get('/profile/me')
                setProfile(refreshed)
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

    const deleteAccount = async () => {
        setDeleting(true)
        setError(null)
        try {
            await api.del('/account')
            await logout()
            router.push('/login')
        } catch (err) {
            setError(err.message || 'Failed to schedule account deletion')
            setDeleting(false)
        }
    }
    if (loading || !profile || !form) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="font-mono text-[13px] uppercase tracking-widest text-cream-dim">Loading…</p>
            </main>
        );
    }

    const primaryPhoto = profile.photos.find((photo) => photo.isPrimary) ?? profile.photos[0]
    const displayedPhoto = profile.photos[activePhoto] ?? primaryPhoto

    return (
        <main className="min-h-screen overflow-hidden bg-ink px-4 pb-16 pt-4 text-cream sm:px-8 lg:px-12">
            <NavBar />
            <div className="mx-auto mt-6 w-full max-w-7xl">
                <ProfileSettingsNav activeSection={activeSection} onChange={setActiveSection} />
            </div>

            {activeSection === 'profile' && <div className="mx-auto mt-8 grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-10">
                <section className="relative min-h-[620px] overflow-hidden rounded-card border border-cream/10 bg-dusk shadow-[0_30px_100px_-40px_rgba(0,0,0,0.9)] animate-[fade-in_600ms_ease-out]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(245,158,11,0.18),transparent_30%),radial-gradient(circle_at_90%_90%,rgba(218,52,69,0.2),transparent_35%)]" />
                    {displayedPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={displayedPhoto.url} alt={profile.displayName} className="absolute inset-0 h-full w-full object-cover transition duration-700" onError={(event) => { event.currentTarget.style.display = 'none' }} />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-dusk-light font-display text-8xl text-cream/30">{profile.displayName?.[0]}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/20" />
                    <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-marigold">Your profile</p>
                        <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
                            <h1 className="font-display text-5xl leading-none text-cream sm:text-7xl">{profile.displayName}</h1>
                            {profile.verificationStatus === 'VERIFIED' && <span className="mb-1 rounded-full border border-mehendi/40 bg-mehendi/20 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-mehendi-light">Verified</span>}
                        </div>
                        <p className="mt-4 max-w-xl text-base leading-relaxed text-cream-dim">{form.bio || 'Add a little spark to your introduction.'}</p>
                    </div>
                    <div className="absolute left-5 top-5 flex gap-1.5 sm:left-7 sm:top-7">
                        {profile.photos.map((photo, index) => <button key={photo.id ?? photo.key} aria-label={`Show photo ${index + 1}`} onClick={() => setActivePhoto(index)} className={`h-1.5 w-12 rounded-full transition ${index === activePhoto ? 'bg-marigold' : 'bg-cream/30 hover:bg-cream/60'}`} />)}
                    </div>
                </section>

                <section className="space-y-5 animate-[slide-up_700ms_120ms_both]">
                    <div className="flex items-center justify-between">
                        <div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream-dim">Profile studio</p><h2 className="mt-1 font-display text-3xl text-cream">Shape your story</h2></div>
                        <span className="rounded-full border border-cream/10 bg-dusk px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cream-dim">{profile.photos.length}/6 photos</span>
                    </div>

                    <section className="rounded-card border border-cream/10 bg-dusk/80 p-5 backdrop-blur-sm">
                        <div className="mb-4 flex items-center justify-between"><p className="font-mono text-[11px] uppercase tracking-[0.15em] text-cream-dim">Photo gallery</p><label className="cursor-pointer font-mono text-[11px] uppercase tracking-widest text-marigold hover:text-cream">Add photos<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} /></label></div>
                        <div className="grid grid-cols-3 gap-2.5">
                            {profile.photos.map((photo, index) => <div key={photo.id ?? photo.key} className={`group relative aspect-square overflow-hidden rounded-xl bg-dusk-light ${photo.isPrimary ? 'ring-2 ring-marigold ring-offset-2 ring-offset-dusk' : ''}`}><button onClick={() => setActivePhoto(index)} className="h-full w-full">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.url} alt={`${profile.displayName} photo ${index + 1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = 'none' }} /></button>{photo.id && <button onClick={() => deletePhoto(photo.id)} aria-label="Delete photo" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/75 text-xs text-cream opacity-0 transition group-hover:opacity-100">✕</button>}{photo.id && !photo.isPrimary && <button onClick={() => setPrimary(photo.id)} className="absolute inset-x-1 bottom-1 rounded-lg bg-ink/75 py-1.5 font-mono text-[9px] uppercase tracking-wide text-cream opacity-0 transition group-hover:opacity-100">Make primary</button>}</div>)}
                            {profile.photos.length < 6 && <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-cream/20 text-3xl text-cream-dim transition hover:border-marigold hover:text-marigold">+<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} /></label>}
                        </div>
                    </section>

                    <section className="rounded-card border border-cream/10 bg-dusk/80 p-5 backdrop-blur-sm"><p className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-cream-dim">About you</p><Input label="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))} placeholder="your_username" minLength={3} maxLength={20} autoComplete="username" /><textarea rows={4} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="What should someone know about you?" className="mt-4 w-full resize-none rounded-xl border border-cream/10 bg-ink/50 px-4 py-3 text-[15px] text-cream outline-none transition placeholder:text-cream/30 focus:border-marigold/60" /></section>

                    <section className="rounded-card border border-cream/10 bg-dusk/80 p-5">
                        <VoiceBioRecorder value={voiceBioFile ?? profile.voiceBioUrl} onChange={setVoiceBioFile} />
                        {(profile.voiceBioUrl || voiceBioFile) && <Button variant="ghost" onClick={removeVoiceBio} className="mt-3 text-sindoor-light">Remove voice introduction</Button>}
                    </section>

                    <section className="rounded-card border border-cream/10 bg-dusk/80 p-5 backdrop-blur-sm"><p className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-cream-dim">Your signals</p><div className="mb-5"><ChoicePills options={INTEREST_OPTIONS} value={form.interests} onChange={(v) => setForm((f) => ({ ...f, interests: v }))} multiple /></div><p className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-cream-dim">Work and craft</p><ChoicePills options={PROFESSION_OPTIONS} value={form.profession} onChange={(v) => setForm((f) => ({ ...f, profession: v }))} /></section>

                    {error && <p className="text-[14px] text-sindoor-light">{error}</p>}
                    <div className="flex flex-col gap-3 sm:flex-row"><Button variant="primary" onClick={save} disabled={saving} showBloom className="flex-1">{saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}</Button></div>
                </section>
            </div>
            }

            {activeSection === 'account' && (
                <section className="mx-auto mt-8 w-full max-w-2xl space-y-5">
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream-dim">Account</p>
                        <h1 className="mt-2 font-display text-4xl text-cream">Account settings</h1>
                    </div>
                    <section className="rounded-card border border-cream/10 bg-dusk/80 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-cream-dim">Email</p>
                        <p className="mt-2 text-cream">{user.email}</p>
                    </section>
                    <section className="rounded-card border border-cream/10 bg-dusk/80 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-cream-dim">Session</p>
                        <Button variant="secondary" onClick={() => setConfirmLogout(true)} className="mt-4">Log out</Button>
                    </section>
                    <section className="rounded-card border border-sindoor/30 bg-sindoor/5 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-sindoor-light">Danger zone</p>
                        <p className="mt-2 text-sm text-cream-dim">Your account will be hidden immediately and permanently deleted after 30 days.</p>
                        <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="mt-4 text-sindoor-light hover:text-sindoor">Delete account</Button>
                    </section>
                </section>
            )}

            {activeSection === 'preferences' && (
                <PreferencesForm />
            )}

            <ConfirmModal
                open={confirmLogout}
                title="Log out?"
                confirmLabel="Log out"
                onConfirm={() => { setConfirmLogout(false); handleLogout(); }}
                onCancel={() => setConfirmLogout(false)}
            />
            <ConfirmModal
                open={confirmDelete}
                title="Delete your account?"
                description="Your account will disappear immediately and be permanently deleted after 30 days."
                confirmLabel={deleting ? 'Deleting…' : 'Delete account'}
                onConfirm={() => { setConfirmDelete(false); deleteAccount(); }}
                onCancel={() => setConfirmDelete(false)}
            />
        </main>
    );
}
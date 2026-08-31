'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { SidebarNav } from '@/components/SidebarNav'
import { presignAndUpload } from '@/lib/uploadS3'
import { Input } from '@/components/user_interface/Input'
import { Button } from '@/components/user_interface/Button'
import { ChoicePills } from '@/components/user_interface/ChoicePills'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ProfileSettingsNav } from '@/components/ProfileSettingsNav'
import { PreferencesForm } from '@/components/PreferencesForm'
import { VoiceBioRecorder } from '@/components/voiceBioRecorder'
import { VerifiedIcon, SparklesIcon } from '@/components/user_interface/Icons'

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

export default function ProfileSettingPage() {
    const { user, loading, logout } = useAuth()
    const router = useRouter()

    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState(null)
    const [accountUsername, setAccountUsername] = useState('')
    const [savingUsername, setSavingUsername] = useState(false)
    const [usernameSaved, setUsernameSaved] = useState(false)
    const [usernameError, setUsernameError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [fetchingProfile, setFetchingProfile] = useState(true)
    const [error, setError] = useState(null)
    const [confirmLogout, setConfirmLogout] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [confirmPrimaryPhotoId, setConfirmPrimaryPhotoId] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [activePhoto, setActivePhoto] = useState(0)
    const [activeSection, setActiveSection] = useState('profile')
    const [voiceBioFile, setVoiceBioFile] = useState(null)

    const fetchProfileData = useCallback(async () => {
        setFetchingProfile(true)
        setError(null)
        try {
            const data = await api.get('/profile/me')
            setProfile(data)
            setForm({
                bio: data.bio ?? '',
                interests: data.interests ?? [],
                profession: data.profession ?? 'STUDENT'
            })
            setAccountUsername(data.username ?? '')
        } catch (err) {
            if (err?.status === 404) {
                router.push('/onBoarding')
                return
            }
            if (err?.message === 'Failed to fetch' || err?.message?.includes('fetch')) {
                setError('Could not connect to API server. Please ensure the backend server is running on port 4000.')
            } else {
                setError(err.message || 'Failed to load profile')
            }
        } finally {
            setFetchingProfile(false)
        }
    }, [router])

    useEffect(() => {
        if (loading) return
        if (!user) {
            router.push('/login')
            return
        }
        fetchProfileData()
    }, [loading, user, router, fetchProfileData])

    const saveProfile = async () => {
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
            if (voiceBioFile) {
                await presignAndUpload({
                    file: voiceBioFile,
                    presignPath: '/media/voice-bio/presign',
                    confirmPath: '/media/voice-bio/confirm',
                    allowedTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'],
                    maxFileSize: 5 * 1024 * 1024,
                })
                setVoiceBioFile(null)
            }
            const refreshed = await api.get('/profile/me')
            setProfile(refreshed)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            setError(err.message || 'Failed to save profile details')
        } finally {
            setSaving(false)
        }
    }

    const saveUsername = async () => {
        setUsernameError(null)
        const normalized = accountUsername.trim().toLowerCase()
        if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
            setUsernameError('Username must be 3-20 characters long (letters, numbers, underscores)')
            return
        }
        setSavingUsername(true)
        try {
            await api.put('/profile', {
                displayName: profile.displayName,
                username: normalized,
                dateOfBirth: profile.dateOfBirth,
                gender: profile.gender,
                bio: profile.bio,
                interests: profile.interests,
                profession: profile.profession,
            })
            const refreshed = await api.get('/profile/me')
            setProfile(refreshed)
            setUsernameSaved(true)
            setTimeout(() => setUsernameSaved(false), 2000)
        } catch (err) {
            if (err.message?.includes('P2002') || err.message?.includes('username')) {
                setUsernameError('That username is already taken. Please choose another username.')
            } else {
                setUsernameError(err.message || 'Failed to update username')
            }
        } finally {
            setSavingUsername(false)
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

    const addPhotos = async (fileList) => {
        if (!fileList || fileList.length === 0) return
        setError(null)
        const currentCount = profile.photos?.length ?? 0
        const files = Array.from(fileList).slice(0, 6 - currentCount)
        
        for (const file of files) {
            try {
                const { key, publicUrl } = await presignAndUpload({
                    file,
                    presignPath: '/media/photos/presign',
                    confirmPath: '/media/photos/confirm',
                    extraConfirmFields: { isPrimary: currentCount === 0 }
                })
                const refreshed = await api.get('/profile/me')
                setProfile(refreshed)
            } catch (error) {
                setError(error.message || 'Failed to upload photo')
            }
        }
    }

    const deletePhoto = async (photoId) => {
        try {
            await api.del(`/media/photos/${photoId}`)
            const refreshed = await api.get('/profile/me')
            setProfile(refreshed)
        } catch (err) {
            setError(err.message || 'Failed to delete photo')
        }
    }

    const setPrimary = async (photoId) => {
        try {
            await api.put(`/media/photos/${photoId}/primary`, {})
            const refreshed = await api.get('/profile/me')
            setProfile(refreshed)
        } catch (err) {
            setError(err.message || 'Failed to update primary photo')
        }
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

    if (loading || fetchingProfile) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-plum-night">
                <p className="font-mono text-xs uppercase tracking-widest text-pearl-dim">Loading profile...</p>
            </main>
        )
    }

    if (error && !profile) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-plum-night px-6 text-center text-pearl">
                <div className="max-w-md rounded-3xl border border-saffron/40 bg-plum-surface p-8 shadow-2xl">
                    <h2 className="font-display text-2xl font-bold text-saffron">Connection Error</h2>
                    <p className="mt-3 text-sm text-pearl-dim leading-relaxed">{error}</p>
                    <div className="mt-6 flex justify-center gap-3">
                        <Button variant="primary" onClick={fetchProfileData}>
                            Retry Connection
                        </Button>
                    </div>
                </div>
            </main>
        )
    }

    const primaryPhoto = profile?.photos?.find((photo) => photo.isPrimary) ?? profile?.photos?.[0]
    const displayedPhoto = profile?.photos?.[activePhoto] ?? primaryPhoto

    // Format timestamps
    const joinedDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'
    const updatedTimeAgo = profile?.updatedAt ? new Date(profile.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null

    return (
        <div className="flex min-h-screen bg-plum-night text-pearl">
            {/* 25% Left Sidebar Navigation */}
            <SidebarNav />

            {/* Main Profile Workspace */}
            <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
                <div className="mx-auto max-w-6xl space-y-8">
                    {/* Top Navigation Tabs */}
                    <ProfileSettingsNav activeSection={activeSection} onChange={setActiveSection} />

                    {/* SECTION 1: PROFILE STUDIO */}
                    {activeSection === 'profile' && profile && form && (
                        <div className="space-y-8">
                            {/* Top Grid: Hero Photo Card (Left) and Form Cards (Right) */}
                            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] items-start">
                                {/* Left Side: Hero Primary Photo Card */}
                                <section className="relative h-[620px] w-full overflow-hidden rounded-[32px] border border-plum-border bg-plum-surface shadow-2xl sticky top-6">
                                    {displayedPhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={displayedPhoto.url}
                                            alt={profile.displayName}
                                            className="h-full w-full object-cover transition duration-500"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-plum-night font-display text-8xl text-pearl-dim">
                                            {profile.displayName?.[0]}
                                        </div>
                                    )}

                                    {/* Top Photo Story Bar */}
                                    {profile.photos?.length > 1 && (
                                        <div className="absolute inset-x-5 top-5 z-20 flex gap-1.5">
                                            {profile.photos.map((photo, index) => (
                                                <button
                                                    key={photo.id ?? photo.key}
                                                    type="button"
                                                    onClick={() => setActivePhoto(index)}
                                                    className={`h-1 flex-1 rounded-full transition-all ${
                                                        index === activePhoto ? 'bg-pearl shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-pearl/30'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-plum-night via-plum-night/60 to-transparent pointer-events-none" />

                                    {/* Bottom Info Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-8 sm:p-10 space-y-3 z-10">
                                        <div className="flex items-center gap-2">
                                            <h1 className="font-sans text-4xl sm:text-5xl font-extrabold text-pearl tracking-tight">
                                                {profile.displayName}
                                            </h1>
                                            {profile.verificationStatus === 'VERIFIED' && (
                                                <VerifiedIcon className="h-7 w-7 text-saffron" />
                                            )}
                                        </div>

                                        {/* Username Read-Only Badge */}
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-0.5 font-mono text-xs font-bold tracking-wide text-saffron bg-plum-night/90 border border-saffron/40 px-3.5 py-1 rounded-full shadow-[0_0_12px_rgba(240,162,2,0.25)]">
                                                <span className="text-gold/60 font-semibold">@</span>
                                                <span>{profile.username}</span>
                                            </span>
                                            {profile.verificationStatus === 'REVERIFICATION_REQUIRED' && (
                                                <span className="font-mono text-[10px] font-bold text-sindoor-light bg-sindoor/20 border border-sindoor/40 px-2.5 py-1 rounded-full">
                                                    Re-verification Required
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm leading-relaxed text-pearl-dim max-w-md font-sans">
                                            {form.bio || 'No bio written yet. Add a short bio to introduce yourself!'}
                                        </p>

                                        {profile.voiceBioUrl && (
                                            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gold/30 bg-plum-night/90 p-3 backdrop-blur-md max-w-sm">
                                                <span className="font-mono text-xs font-bold text-gold uppercase shrink-0">Voice Intro</span>
                                                <audio controls src={profile.voiceBioUrl} className="h-7 flex-1" />
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Right Side: Identity, Photo Gallery, Bio & Voice Intro */}
                                <section className="space-y-6">
                                    {/* Account Identity Card */}
                                    <div className="rounded-3xl border border-plum-border bg-plum-surface p-6 space-y-3 shadow-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-saffron">
                                                <SparklesIcon className="h-4 w-4" />
                                                <span className="font-mono text-xs font-bold uppercase tracking-wider">Account Identity</span>
                                            </div>
                                            <span className="font-mono text-[10px] text-pearl-dim">Joined {joinedDate}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                                            <div className="rounded-2xl border border-plum-border/60 bg-plum-night/60 p-3">
                                                <p className="text-pearl-dim uppercase text-[10px]">Verification</p>
                                                <p className="font-bold text-pearl mt-0.5">{profile.verificationStatus}</p>
                                            </div>
                                            <div className="rounded-2xl border border-plum-border/60 bg-plum-night/60 p-3">
                                                <p className="text-pearl-dim uppercase text-[10px]">Photos Count</p>
                                                <p className="font-bold text-pearl mt-0.5">{profile.photos?.length ?? 0} / 6 Uploaded</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Photo Gallery Upload & Management */}
                                    <div className="rounded-3xl border border-plum-border bg-plum-surface p-6 shadow-xl space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-pearl">Photo Gallery</p>
                                                <p className="text-xs text-pearl-dim">Upload up to 6 photos. Changing primary photo sends you for re-verification.</p>
                                            </div>
                                            {(profile.photos?.length ?? 0) < 6 && (
                                                <label className="cursor-pointer rounded-xl bg-saffron-gradient px-4 py-2 font-mono text-xs font-bold text-pearl shadow-saffron-glow transition hover:scale-105">
                                                    + Upload Photo
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => addPhotos(e.target.files)}
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            {profile.photos?.map((photo, index) => (
                                                <div
                                                    key={photo.id ?? photo.key}
                                                    className={`group relative aspect-square overflow-hidden rounded-2xl border border-plum-border bg-plum-night ${
                                                        photo.isPrimary ? 'ring-2 ring-saffron ring-offset-2 ring-offset-plum-surface' : ''
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePhoto(index)}
                                                        className="h-full w-full"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={photo.url}
                                                            alt={`${profile.displayName} photo ${index + 1}`}
                                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                        />
                                                    </button>
                                                    {photo.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => deletePhoto(photo.id)}
                                                            aria-label="Delete photo"
                                                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-plum-night/80 text-xs font-bold text-sindoor-light opacity-0 transition group-hover:opacity-100"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                    {photo.id && !photo.isPrimary && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmPrimaryPhotoId(photo.id)}
                                                            className="absolute inset-x-1 bottom-1 rounded-xl bg-plum-night/90 py-1 font-mono text-[10px] font-bold uppercase text-saffron opacity-0 transition group-hover:opacity-100 shadow-md"
                                                        >
                                                            Make Primary
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* About You & Bio */}
                                    <div className="rounded-3xl border border-plum-border bg-plum-surface p-6 shadow-xl space-y-4">
                                        <p className="font-mono text-xs font-bold uppercase tracking-wider text-pearl">About You</p>
                                        <div className="space-y-2">
                                            <label className="font-mono text-xs text-pearl-dim">Bio</label>
                                            <textarea
                                                rows={3}
                                                value={form.bio}
                                                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                                                placeholder="Write something memorable about yourself..."
                                                className="w-full resize-none rounded-2xl border border-plum-border bg-plum-night/60 px-4 py-3 text-sm text-pearl outline-none transition placeholder:text-pearl-dim focus:border-saffron"
                                            />
                                        </div>
                                    </div>

                                    {/* Voice Bio Recorder */}
                                    <div className="rounded-3xl border border-plum-border bg-plum-surface p-6 shadow-xl space-y-3">
                                        <VoiceBioRecorder value={voiceBioFile ?? profile.voiceBioUrl} onChange={setVoiceBioFile} />
                                        {(profile.voiceBioUrl || voiceBioFile) && (
                                            <button
                                                type="button"
                                                onClick={removeVoiceBio}
                                                className="font-mono text-xs text-sindoor-light hover:underline"
                                            >
                                                Remove Voice Introduction
                                            </button>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Bottom Horizontal Section: Interests & Signals + Profession / Vocation occupying equal space horizontally under image */}
                            <div className="rounded-3xl border border-plum-border/80 bg-plum-surface p-6 sm:p-8 shadow-2xl space-y-6">
                                <div className="flex items-center justify-between border-b border-plum-border/50 pb-4">
                                    <div>
                                        <h3 className="font-display text-2xl font-bold text-pearl">Interests & Vocation</h3>
                                        <p className="text-xs text-pearl-dim mt-0.5">Select signals and interests to help match with like-minded profiles.</p>
                                    </div>
                                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-saffron bg-saffron/10 border border-saffron/30 px-3 py-1 rounded-full">
                                        {form.interests.length} Selected
                                    </span>
                                </div>

                                <div className="grid gap-8 md:grid-cols-2">
                                    {/* Left Side: Interests & Signals */}
                                    <div className="space-y-4">
                                        <p className="font-mono text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-2">
                                            <SparklesIcon className="h-4 w-4" />
                                            <span>Interests & Signals</span>
                                        </p>
                                        <div className="max-h-72 overflow-y-auto pr-2">
                                            <ChoicePills
                                                options={INTEREST_OPTIONS}
                                                value={form.interests}
                                                onChange={(v) => setForm((f) => ({ ...f, interests: v }))}
                                                multiple
                                            />
                                        </div>
                                    </div>

                                    {/* Right Side: Profession / Vocation */}
                                    <div className="space-y-4 md:border-l md:border-plum-border/50 md:pl-8">
                                        <p className="font-mono text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                                            <span className="text-sm">✦</span>
                                            <span>Profession / Vocation</span>
                                        </p>
                                        <div>
                                            <ChoicePills
                                                options={PROFESSION_OPTIONS}
                                                value={form.profession}
                                                onChange={(v) => setForm((f) => ({ ...f, profession: v }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Profile Changes Action Button Bar */}
                            <div className="flex flex-col items-center gap-3 pt-2">
                                {error && <p className="text-sm text-sindoor-light font-mono text-center">{error}</p>}
                                <Button
                                    variant="primary"
                                    onClick={saveProfile}
                                    disabled={saving}
                                    className="w-full max-w-xl py-4 text-base font-bold shadow-saffron-glow transition-all hover:scale-[1.02] active:scale-[0.98] rounded-2xl"
                                >
                                    {saving ? 'Saving Profile…' : saved ? '✓ Profile Saved Successfully!' : 'Save Profile Changes'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: ACCOUNT SETTINGS */}
                    {activeSection === 'account' && (
                        <div className="mx-auto max-w-2xl space-y-6">
                            <div>
                                <h1 className="font-display text-4xl font-bold text-pearl">Account Settings</h1>
                                <p className="mt-1 text-sm text-pearl-dim">Manage your email, username, and active sessions.</p>
                            </div>

                            {/* Email */}
                            <div className="rounded-3xl border border-plum-border bg-plum-surface p-6 shadow-xl space-y-2">
                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-pearl-dim">Registered Email</p>
                                <p className="font-mono text-base text-pearl font-bold">{user?.email}</p>
                            </div>

                            {/* Username Editing */}
                            <div className="rounded-3xl border border-plum-border bg-plum-surface p-6 shadow-xl space-y-4">
                                <div>
                                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-pearl">Username</p>
                                    <p className="text-xs text-pearl-dim">Your unique username on the app.</p>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        value={accountUsername}
                                        onChange={(e) => setAccountUsername(e.target.value.toLowerCase())}
                                        maxLength={20}
                                        className="flex-1 rounded-xl border border-plum-border bg-plum-night/60 px-4 py-3 font-mono text-sm text-pearl outline-none focus:border-saffron"
                                    />
                                    <Button variant="primary" onClick={saveUsername} disabled={savingUsername}>
                                        {savingUsername ? 'Saving…' : usernameSaved ? 'Saved!' : 'Update Username'}
                                    </Button>
                                </div>
                                {usernameError && (
                                    <p className="text-xs text-sindoor-light font-mono">{usernameError}</p>
                                )}
                            </div>

                            {/* Session Logout */}
                            <div className="rounded-3xl border border-plum-border bg-plum-surface p-6 shadow-xl space-y-3">
                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-pearl-dim">Active Session</p>
                                <p className="text-xs text-pearl-dim">Log out of your current session on this device.</p>
                                <Button variant="secondary" onClick={() => setConfirmLogout(true)}>
                                    Log Out
                                </Button>
                            </div>

                            {/* Danger Zone */}
                            <div className="rounded-3xl border border-sindoor/40 bg-sindoor/10 p-6 shadow-xl space-y-3">
                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-sindoor-light">Danger Zone</p>
                                <p className="text-xs text-pearl-dim leading-relaxed">
                                    Deleting your account hides your profile immediately and permanently purges your data after 60 seconds.
                                </p>
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmDelete(true)}
                                    className="text-sindoor-light border border-sindoor/30 hover:bg-sindoor/20"
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: PREFERENCES */}
                    {activeSection === 'preferences' && (
                        <div className="mx-auto max-w-2xl">
                            <PreferencesForm />
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <ConfirmModal
                open={!!confirmPrimaryPhotoId}
                title="Change Primary Photo?"
                description="Changing your primary photo will require your profile to undergo re-verification. Are you sure you want to proceed?"
                confirmLabel="Confirm & Re-verify"
                danger={false}
                onConfirm={() => {
                    const idToSet = confirmPrimaryPhotoId;
                    setConfirmPrimaryPhotoId(null);
                    if (idToSet) setPrimary(idToSet);
                }}
                onCancel={() => setConfirmPrimaryPhotoId(null)}
            />
            <ConfirmModal
                open={confirmLogout}
                title="Log out of your account?"
                description="You will need to log back in to access your matches and messages."
                confirmLabel="Log out"
                danger={false}
                onConfirm={() => { setConfirmLogout(false); handleLogout(); }}
                onCancel={() => setConfirmLogout(false)}
            />
            <ConfirmModal
                open={confirmDelete}
                title="Delete your account?"
                description="Your account will disappear immediately and be permanently deleted after 1 minute."
                confirmLabel={deleting ? 'Deleting…' : 'Delete Account'}
                danger={true}
                onConfirm={() => { setConfirmDelete(false); deleteAccount(); }}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    )
}
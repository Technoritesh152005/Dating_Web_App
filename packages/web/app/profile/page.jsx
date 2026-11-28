'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { presignAndUpload } from '@/lib/uploadS3'
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
            <main className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#918781]">Loading profile…</p>
            </main>
        )
    }

    if (error && !profile) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-[#faf7f2] px-6 text-center text-[#292321]">
                <div className="max-w-md rounded-3xl border border-[#eadfd8] bg-white p-8 shadow-[0_24px_70px_-45px_rgba(74,49,39,0.3)]">
                    <h2 className="font-display text-2xl font-bold text-[#e95161]">Connection Error</h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#71655f]">{error}</p>
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
    return (
        <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_24%_18%,rgba(237,89,100,0.10),transparent_38%),radial-gradient(ellipse_at_78%_75%,rgba(244,196,48,0.13),transparent_34%),linear-gradient(135deg,#fcfaf7_0%,#f7f1ec_100%)] text-[#292321] md:flex-row">
            <ProfileSettingsNav activeSection={activeSection} onChange={setActiveSection} />

            {/* Main Profile Workspace */}
            <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
                <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">

                    {/* SECTION 1: PROFILE STUDIO */}
                    {activeSection === 'profile' && profile && form && (
                        <div className="space-y-8">
                            {/* Top Grid: Hero Photo Card (Left) and Form Cards (Right) */}
                            <div className="grid items-start gap-5 sm:gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
                                {/* Left Side: Hero Primary Photo Card */}
                                <section className="relative h-[min(70vh,620px)] min-h-[420px] w-full overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_70px_-35px_rgba(74,49,39,0.35)] sm:rounded-[32px] sm:min-h-[500px] lg:sticky lg:top-6">
                                    {displayedPhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={displayedPhoto.url}
                                            alt={profile.displayName}
                                            className="h-full w-full object-cover transition duration-500"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#fff5ee_0%,#f0d8d2_45%,#e6c6c6_100%)] font-display text-8xl text-[#d57b7b]">
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

                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                                    {/* Bottom Info Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 p-5 sm:p-8">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <h1 className="truncate font-display text-3xl text-white sm:text-5xl">
                                                {profile.displayName}
                                            </h1>
                                            {profile.verificationStatus === 'VERIFIED' && (
                                                <VerifiedIcon className="h-6 w-6 shrink-0 text-white" />
                                            )}
                                        </div>

                                        {/* Username Read-Only Badge */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-0.5 rounded-full border border-white/40 bg-black/35 px-3.5 py-1 font-mono text-xs font-bold tracking-wide text-white backdrop-blur-md">
                                                <span className="font-semibold text-white/70">@</span>
                                                <span>{profile.username}</span>
                                            </span>
                                            {profile.verificationStatus === 'REVERIFICATION_REQUIRED' && (
                                                <span className="rounded-full border border-white/40 bg-black/35 px-2.5 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-md">
                                                    Re-verification Required
                                                </span>
                                            )}
                                        </div>

                                        <p className="max-w-md font-sans text-sm leading-relaxed text-white/90">
                                            {form.bio || 'No bio written yet. Add a short bio to introduce yourself!'}
                                        </p>

                                        {profile.voiceBioUrl && (
                                            <div className="mt-2 flex max-w-sm flex-col gap-2 rounded-2xl border border-white/25 bg-black/35 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:gap-3">
                                                <span className="shrink-0 font-mono text-xs font-bold uppercase text-white/80">Voice Intro</span>
                                                <audio controls src={profile.voiceBioUrl} className="h-8 w-full min-w-0 flex-1 sm:w-auto" />
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Right Side: Identity, Photo Gallery, Bio & Voice Intro */}
                                <section className="space-y-6">
                                    {/* Account Identity Card */}
                                    <div className="space-y-3 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[#e95161]">
                                                <SparklesIcon className="h-4 w-4" />
                                                <span className="font-mono text-xs font-bold uppercase tracking-wider">Account Identity</span>
                                            </div>
                                            <span className="font-mono text-[10px] text-[#918781]">Joined {joinedDate}</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 pt-2 font-mono text-xs sm:grid-cols-2">
                                            <div className="rounded-2xl border border-[#eee5df] bg-[#faf7f2] p-3">
                                                <p className="text-[10px] uppercase text-[#918781]">Verification</p>
                                                <p className="mt-0.5 font-bold text-[#332d29]">{profile.verificationStatus}</p>
                                            </div>
                                            <div className="rounded-2xl border border-[#eee5df] bg-[#faf7f2] p-3">
                                                <p className="text-[10px] uppercase text-[#918781]">Photos Count</p>
                                                <p className="mt-0.5 font-bold text-[#332d29]">{profile.photos?.length ?? 0} / 6 Uploaded</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Photo Gallery Upload & Management */}
                                    <div className="space-y-4 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-6">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#332d29]">Photo Gallery</p>
                                                <p className="mt-1 text-xs leading-relaxed text-[#827871]">Upload up to 6 photos. Changing your primary photo requires re-verification.</p>
                                            </div>
                                            {(profile.photos?.length ?? 0) < 6 && (
                                                <label className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#e95161] px-4 py-2 font-mono text-xs font-bold text-white shadow-sm transition hover:bg-[#d94355]">
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
                                                    className={`group relative aspect-square overflow-hidden rounded-2xl border border-[#eadfd8] bg-[#f8f4f0] ${
                                                        photo.isPrimary ? 'ring-2 ring-[#e95161] ring-offset-2 ring-offset-white' : ''
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
                                                            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-[#b73946] opacity-100 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                    {photo.id && !photo.isPrimary && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmPrimaryPhotoId(photo.id)}
                                                            className="absolute inset-x-1 bottom-1 min-h-10 rounded-xl bg-white/90 py-1.5 font-mono text-[10px] font-bold uppercase text-[#c34450] opacity-100 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100"
                                                        >
                                                            Make Primary
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* About You & Bio */}
                                    <div className="space-y-4 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-6">
                                        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#332d29]">About You</p>
                                        <div className="space-y-2">
                                            <label className="font-mono text-xs text-[#827871]">Bio</label>
                                            <textarea
                                                rows={3}
                                                value={form.bio}
                                                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                                                placeholder="Write something memorable about yourself..."
                                                className="w-full resize-y rounded-2xl border border-[#eadfd8] bg-[#faf7f2] px-4 py-3 text-sm text-[#292321] outline-none transition placeholder:text-[#a39a94] focus:border-[#edc0c3]"
                                            />
                                        </div>
                                    </div>

                                    {/* Voice Bio Recorder */}
                                    <div className="space-y-3 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-6">
                                        <VoiceBioRecorder value={voiceBioFile ?? profile.voiceBioUrl} onChange={setVoiceBioFile} />
                                        {(profile.voiceBioUrl || voiceBioFile) && (
                                            <button
                                                type="button"
                                                onClick={removeVoiceBio}
                                                className="font-mono text-xs text-[#b73946] hover:underline"
                                            >
                                                Remove Voice Introduction
                                            </button>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Bottom Horizontal Section: Interests & Signals + Profession / Vocation occupying equal space horizontally under image */}
                            <div className="space-y-6 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-8">
                                <div className="flex flex-col gap-3 border-b border-[#eee5df] pb-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="font-display text-2xl font-bold text-[#292321]">Interests & Vocation</h3>
                                        <p className="mt-0.5 text-xs text-[#827871]">Select signals and interests to help match with like-minded profiles.</p>
                                    </div>
                                    <span className="w-fit rounded-full border border-[#f2c9cc] bg-[#fff0f1] px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#c34450]">
                                        {form.interests.length} Selected
                                    </span>
                                </div>

                                <div className="grid gap-8 md:grid-cols-2">
                                    {/* Left Side: Interests & Signals */}
                                    <div className="space-y-4">
                                        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#e95161]">
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
                                    <div className="space-y-4 md:border-l md:border-[#eee5df] md:pl-8">
                                        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#a87c28]">
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
                                {error && <p className="text-center font-mono text-sm text-[#b73946]">{error}</p>}
                                <Button
                                    variant="primary"
                                    onClick={saveProfile}
                                    disabled={saving}
                                    className="w-full max-w-xl rounded-2xl bg-[#e95161] py-4 text-base font-bold text-white shadow-lg shadow-rose-200/60 transition-all hover:bg-[#d94355] active:scale-[0.98]"
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
                                <h1 className="font-display text-3xl font-bold text-[#292321] sm:text-4xl">Account Settings</h1>
                                <p className="mt-1 text-sm text-[#827871]">Manage your email, username, and active sessions.</p>
                            </div>

                            {/* Email */}
                            <div className="space-y-2 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-6">
                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#827871]">Registered Email</p>
                                <p className="break-all font-mono text-sm font-bold text-[#292321] sm:text-base">{user?.email}</p>
                            </div>

                            {/* Username Editing */}
                            <div className="space-y-4 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-6">
                                <div>
                                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#332d29]">Username</p>
                                    <p className="text-xs text-[#827871]">Your unique username on the app.</p>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <input
                                        value={accountUsername}
                                        onChange={(e) => setAccountUsername(e.target.value.toLowerCase())}
                                        maxLength={20}
                                        className="min-w-0 flex-1 rounded-xl border border-[#eadfd8] bg-[#faf7f2] px-4 py-3 font-mono text-sm text-[#292321] outline-none focus:border-[#edc0c3]"
                                    />
                                    <Button variant="primary" onClick={saveUsername} disabled={savingUsername} className="w-full shrink-0 sm:w-auto">
                                        {savingUsername ? 'Saving…' : usernameSaved ? 'Saved!' : 'Update Username'}
                                    </Button>
                                </div>
                                {usernameError && (
                                    <p className="font-mono text-xs text-[#b73946]">{usernameError}</p>
                                )}
                            </div>

                            {/* Session Logout */}
                            <div className="space-y-3 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_-35px_rgba(74,49,39,0.32)] sm:p-6">
                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#827871]">Active Session</p>
                                <p className="text-xs text-[#827871]">Log out of your current session on this device.</p>
                                <Button variant="secondary" onClick={() => setConfirmLogout(true)} className="w-full sm:w-auto">
                                    Log Out
                                </Button>
                            </div>

                            {/* Danger Zone */}
                            <div className="space-y-3 rounded-3xl border border-[#f0c5c8] bg-[#fff2f2] p-5 shadow-sm sm:p-6">
                                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#b73946]">Danger Zone</p>
                                <p className="text-xs leading-relaxed text-[#71655f]">
                                    Deleting your account hides your profile immediately and permanently purges your data after 60 seconds.
                                </p>
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmDelete(true)}
                                    className="w-full border border-[#e4a6ab] !text-[#b73946] hover:bg-[#ffe5e7] sm:w-auto"
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
'use client'

import {useState , useEffect} from 'react'
import {api} from '@/lib/api'
import {ProfileDetailModal} from '@/components/ProfileDetailModel'
import {VerifiedLayout} from '@/components/VerifiedLayout'
import {calculateAge} from '@/lib/calculateAge'

const EXPLORE_CATEGORIES = [
    {
        value: 'LONG_TERM',
        title: 'Long-term',
        description: 'Find people looking for a lasting relationship.',
        icon: '∞',
    },
    {
        value: 'CASUAL_DATING',
        title: 'Casual',
        description: 'Meet people open to something relaxed and fun.',
        icon: '⚡',
    },
    {
        value: 'SERIOUS_RELATIONSHIP',
        title: 'Serious',
        description: 'Connect with people ready for a committed relationship.',
        icon: '♡',
    },
    {
        value: 'NEW_CONNECTIONS',
        title: 'New connections',
        description: 'Meet interesting people and see where it goes.',
        icon: '✦',
    },
    {
        value: 'FRIENDSHIP',
        title: 'Friendship',
        description: 'Find people looking to make genuine new friends.',
        icon: '♧',
    },
    {
        value: 'GAMING_BUDDY',
        title: 'Gamers',
        description: 'Connect with people who love gaming.',
        icon: '◈',
    },
    {
        value: 'TRAVEL_BUDDY',
        title: 'Travel buddies',
        description: 'Meet people who are always up for an adventure.',
        icon: '✈',
    },
    {
        value: 'ADVENTURE_BUDDY',
        title: 'Activity partners',
        description: 'Find someone to share hobbies and activities with.',
        icon: '⚑',
    },
    {
        value: 'COFFEE_DATE',
        title: 'Coffee date',
        description: 'Meet someone for a casual coffee and conversation.',
        icon: '☕',
    },
    {
        value: 'FREE_TONIGHT',
        title: 'Free tonight',
        description: 'See people who are available to meet this evening.',
        icon: '◷',
    },
    {
        value: 'OPEN_TO_ANYTHING',
        title: 'Open to anything',
        description: 'Let the connection decide where it goes.',
        icon: '✧',
    },
    {
        value: 'NOT_SURE_YET',
        title: 'Still figuring it out',
        description: 'Meet people without putting a label on it yet.',
        icon: '?',
    },
];

export function Explore(){

    const [selectedCategory , setSelectedCategory] = useState(null)
    const [profiles,setProfiles] = useState([])
    const [selectedProfile,setSelectedProfile] = useState(null)
    const [loading ,setLoading] = useState(false)
    const [error,setError] = useState(null)
    const [swiping, setSwiping] = useState(false)

    const loadProfiles = async(category)=>{
        setSelectedCategory(category)
        setProfiles([])
        setError(null)
        setLoading(true)

        try{
            const result = await api.get(`/discovery/explore?mode=${encodeURIComponent(category)}`)
            setProfiles(result.profiles?? [])
        }catch(error){
            setError(error.message || 'Couldnt load profiles from this category of explore')
        }finally{
            setLoading(false)
        }
    }

    const handleSwipe = async (action) => {
        if (!selectedProfile || swiping) return

        setSwiping(true)
        try {
            await api.post('/swipe', {
                toUserId: selectedProfile.userId,
                action,
            })
            setProfiles((currentProfiles) =>
                currentProfiles.filter((profile) => profile.id !== selectedProfile.id)
            )
            setSelectedProfile(null)
        } catch (error) {
            setError(error.message || 'Could not update this profile')
        } finally {
            setSwiping(false)
        }
    }

    useEffect(()=>{
        loadProfiles('LONG_TERM')
    },[])

    return (
        <main className="min-h-screen bg-ink px-5 pb-16 pt-6 text-cream sm:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">
                        Explore
                    </p>
                    <h1 className="mt-2 font-display text-4xl text-cream">
                        Find your kind of connection
                    </h1>
                    <p className="mt-2 max-w-xl text-[15px] text-cream-dim">
                        Browse people based on what they are open to.
                    </p>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {EXPLORE_CATEGORIES.map((category) => {
                        const active = selectedCategory === category.value

                        return (
                            <button
                                key={category.value}
                                type="button"
                                onClick={() => loadProfiles(category.value)}
                                className={`min-h-44 rounded-card border p-5 text-left transition ${
                                    active
                                        ? 'border-marigold bg-marigold/15'
                                        : 'border-cream/10 bg-dusk hover:border-marigold/50'
                                }`}
                            >
                                <span className="text-3xl text-marigold">
                                    {category.icon}
                                </span>

                                <h2 className="mt-5 font-display text-xl text-cream">
                                    {category.title}
                                </h2>

                                <p className="mt-2 text-[13px] leading-relaxed text-cream-dim">
                                    {category.description}
                                </p>
                            </button>
                        )
                    })}
                </section>

                <section className="mt-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display text-2xl text-cream">
                            {EXPLORE_CATEGORIES.find(
                                (category) => category.value === selectedCategory
                            )?.title ?? 'People'}
                        </h2>

                        {!loading && (
                            <span className="font-mono text-[11px] uppercase tracking-wide text-cream-dim">
                                {profiles.length} people
                            </span>
                        )}
                    </div>

                    {loading && (
                        <p className="py-16 text-center font-mono text-[12px] uppercase tracking-widest text-cream-dim">
                            Finding people…
                        </p>
                    )}

                    {error && (
                        <p className="py-16 text-center text-[14px] text-sindoor-light">
                            {error}
                        </p>
                    )}

                    {!loading && !error && profiles.length === 0 && (
                        <div className="rounded-card border border-dashed border-cream/15 px-6 py-16 text-center">
                            <h3 className="font-display text-xl text-cream">
                                No one here yet
                            </h3>
                            <p className="mt-2 text-[14px] text-cream-dim">
                                Try another Explore category.
                            </p>
                        </div>
                    )}

                    {!loading && !error && profiles.length > 0 && (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {profiles.map((profile) => {
                                const photo = profile.photos?.[0]

                                return (
                                    <button
                                        key={profile.id}
                                        type="button"
                                        onClick={() => setSelectedProfile(profile)}
                                        className="overflow-hidden rounded-card border border-cream/10 bg-dusk text-left transition hover:-translate-y-1 hover:border-marigold/60"
                                    >
                                        <div className="aspect-[4/5] bg-dusk-light">
                                            {photo?.url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={photo.url}
                                                    alt={profile.displayName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center font-display text-7xl text-cream/30">
                                                    {profile.displayName?.[0] ?? '?'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <h3 className="font-display text-xl text-cream">
                                                {profile.displayName}
                                            </h3>

                                            {profile.dateOfBirth && (
                                                <p className="mt-1 text-[13px] text-cream-dim">
                                                    {calculateAge(profile.dateOfBirth)} years old
                                                </p>
                                            )}

                                            {profile.profession && (
                                                <p className="mt-2 text-[13px] text-marigold">
                                                    {profile.profession}
                                                </p>
                                            )}

                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {(profile.interests ?? [])
                                                    .slice(0, 3)
                                                    .map((interest) => (
                                                        <span
                                                            key={interest}
                                                            className="rounded-full border border-cream/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-cream-dim"
                                                        >
                                                            {interest}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>

            {selectedProfile && (
                <ProfileDetailModal
                    profile={selectedProfile}
                    onClose={() => setSelectedProfile(null)}
                    onLike={() => handleSwipe('LIKE')}
                    onPass={() => handleSwipe('PASS')}
                />
            )}
        </main>
    )
}

export default function ExplorePage() {
    return (
        <VerifiedLayout>
            <Explore />
        </VerifiedLayout>
    )
}
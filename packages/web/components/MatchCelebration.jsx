'use client';

import { useRouter } from 'next/navigation';
import { Bloom } from '@/components/user_interface/Bloom';
import { Button } from '@/components/user_interface/Button';

// THE full expression of the signature Bloom motion - large, layered
// blooms behind the matched profile's photo. Everywhere else in the app
// uses Bloom as a small accent; this is the one moment it's allowed to be
// the whole show.
export function MatchCelebration({ match, onDismiss }) {
  const router = useRouter();
  const photo = match.profile?.photos?.[0];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-ink px-6">
      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
        <Bloom trigger="celebration-1" size={520} />
        <Bloom trigger="celebration-2" size={380} className="!animate-none opacity-40" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <p className="mb-2 font-mono text-[12px] uppercase tracking-[0.25em] text-marigold">
          It's a match
        </p>

        <div className="mb-6 h-40 w-40 overflow-hidden rounded-full border-4 border-marigold shadow-[0_0_60px_-10px_rgba(240,162,2,0.6)]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt={match.profile.displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-dusk-light font-display text-3xl text-cream-dim">
              {match.profile?.displayName?.[0]}
            </div>
          )}
        </div>

        <h1 className="font-display text-3xl text-cream">You and {match.profile?.displayName}</h1>
        <p className="mt-2 max-w-xs text-[15px] text-cream-dim">
          Say something — the best matches start with the first message.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button variant="primary" showBloom onClick={() => router.push(`/chat/${match.id}`)}>
            Send a message
          </Button>
          <Button variant="ghost" onClick={onDismiss}>
            Keep browsing
          </Button>
        </div>
      </div>
    </div>
  );
}

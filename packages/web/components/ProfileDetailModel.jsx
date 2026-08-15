'use client';

import { useState } from 'react';
import { calculateAge } from '@/lib/age';

export function ProfileDetailModal({ profile, onClose, onLike, onPass }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.photos ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-sm flex-col overflow-y-auto sm:h-[90vh] sm:rounded-card sm:border sm:border-cream/10"
      >
        <div className="relative aspect-[3/4] flex-shrink-0 bg-dusk">
          {photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[photoIndex].url} alt={profile.displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-cream-dim">
              {profile.displayName?.[0]}
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                aria-label="Previous photo"
                onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                className="absolute inset-y-0 left-0 w-1/3"
              />
              <button
                aria-label="Next photo"
                onClick={() => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))}
                className="absolute inset-y-0 right-0 w-1/3"
              />
              <div className="absolute inset-x-4 top-4 flex gap-1.5">
                {photos.map((_, i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full ${i === photoIndex ? 'bg-cream' : 'bg-cream/25'}`} />
                ))}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/50 text-cream backdrop-blur-sm"
            style={{ marginTop: photos.length > 1 ? '2rem' : 0 }}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 bg-dusk p-6">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-2xl text-cream">{profile.displayName}</h2>
            <span className="font-mono text-[16px] text-cream-dim">{calculateAge(profile.dateOfBirth)}</span>
            {profile.verificationStatus === 'VERIFIED' && (
              <span className="rounded-full bg-mehendi/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mehendi-light">
                Verified
              </span>
            )}
          </div>

          {profile.profession && (
            <p className="mt-1 font-mono text-[12px] uppercase tracking-wide text-cream-dim">{profile.profession}</p>
          )}

          {profile.bio && <p className="mt-4 text-[15px] leading-relaxed text-cream">{profile.bio}</p>}

          {profile.interests?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-cream/10 px-3 py-1.5 font-mono text-[12px] text-cream-dim">
                  {interest}
                </span>
              ))}
            </div>
          )}

          {(onLike || onPass) && (
            <div className="mt-8 flex items-center justify-center gap-6">
              {onPass && (
                <button
                  onClick={onPass}
                  aria-label="Pass"
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-cream/15 text-xl text-cream-dim hover:border-cream/30"
                >
                  ✕
                </button>
              )}
              {onLike && (
                <button
                  onClick={onLike}
                  aria-label="Like"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-sindoor to-marigold text-2xl text-ink"
                >
                  ♥
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

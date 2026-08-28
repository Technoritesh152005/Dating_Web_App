'use client';

import { useState } from 'react';
import { calculateAge } from '@/lib/calculateAge.js';
import { VerifiedIcon, HeartIcon, PassIcon, SparklesIcon } from '@/components/user_interface/Icons';

export function ProfileDetailModal({ profile, onClose, onLike, onPass }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.photos ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-night/85 p-4 backdrop-blur-md animate-[fade-in_200ms_ease-out]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-scroll relative flex h-full max-h-[90vh] w-full max-w-xl flex-col overflow-y-auto rounded-[32px] border border-plum-border bg-plum-surface shadow-[0_30px_100px_rgba(0,0,0,0.9)] text-pearl select-none"
      >
        {/* Photo Gallery Header */}
        <div className="relative aspect-[4/5] w-full flex-shrink-0 bg-plum-night overflow-hidden">
          {photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photos[photoIndex].url}
              alt={profile.displayName}
              className="h-full w-full object-cover transition-all duration-300 pointer-events-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-6xl text-pearl-dim">
              {profile.displayName?.[0]}
            </div>
          )}

          {/* Photo Story Indicators */}
          {photos.length > 1 && (
            <div className="absolute inset-x-4 top-4 z-20 flex gap-1.5 pointer-events-none">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                    i === photoIndex ? 'bg-pearl shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-pearl/30'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Photo Navigation Arrow Controls */}
          {photos.length > 1 && (
            <>
              {photoIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-pearl/20 bg-plum-night/70 text-xl font-bold text-pearl backdrop-blur-md hover:bg-plum-night hover:scale-110"
                >
                  ‹
                </button>
              )}
              {photoIndex < photos.length - 1 && (
                <button
                  type="button"
                  onClick={() => setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-pearl/20 bg-plum-night/70 text-xl font-bold text-pearl backdrop-blur-md hover:bg-plum-night hover:scale-110"
                >
                  ›
                </button>
              )}
            </>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-pearl/20 bg-plum-night/70 text-pearl font-bold backdrop-blur-md hover:bg-plum-night hover:scale-110"
          >
            ✕
          </button>
        </div>

        {/* Profile Info Details Body */}
        <div className="flex-1 bg-plum-surface p-7 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-sans text-4xl font-extrabold text-pearl tracking-tight">
                {profile.displayName}
              </h2>
              <span className="font-mono text-2xl font-light text-pearl-dim">
                {calculateAge(profile.dateOfBirth)}
              </span>
              {profile.verificationStatus === 'VERIFIED' && (
                <VerifiedIcon className="h-7 w-7 text-saffron" />
              )}
            </div>
          </div>

          {profile.profession && (
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-saffron">
              {profile.profession}
            </p>
          )}

          {profile.compatibilityLabel && (
            <div className="flex items-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-2.5 font-mono text-xs font-bold text-gold shadow-gold-glow">
              <SparklesIcon className="h-4 w-4" />
              <span>{profile.compatibilityLabel === 'STRONG' ? 'Strong AI Match' : 'Good AI Match'}</span>
            </div>
          )}

          {profile.bio && (
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-pearl-dim mb-1.5">
                About Me
              </p>
              <p className="text-base leading-relaxed text-pearl font-sans">
                {profile.bio}
              </p>
            </div>
          )}

          {profile.voiceBioUrl && (
            <div className="rounded-2xl border border-plum-border bg-plum-night/90 p-4 space-y-2">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-gold">
                Voice Introduction
              </p>
              <audio controls src={profile.voiceBioUrl} className="w-full h-8" />
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-pearl-dim mb-2.5">
                Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-pearl/20 bg-plum-night/80 px-4 py-1.5 font-sans text-xs font-semibold text-pearl backdrop-blur-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(onLike || onPass) && (
            <div className="pt-6 flex items-center justify-center gap-6 border-t border-plum-border/50">
              {onPass && (
                <button
                  onClick={onPass}
                  aria-label="Pass"
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-sindoor/30 bg-plum-night text-sindoor-light shadow-lg transition-all hover:scale-110 hover:border-sindoor hover:bg-sindoor/10"
                >
                  <PassIcon className="h-6 w-6" stroke="currentColor" />
                </button>
              )}
              {onLike && (
                <button
                  onClick={onLike}
                  aria-label="Like"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-saffron-gradient text-pearl shadow-saffron-glow transition-all hover:scale-110 active:scale-95"
                >
                  <HeartIcon fill="currentColor" className="h-8 w-8" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

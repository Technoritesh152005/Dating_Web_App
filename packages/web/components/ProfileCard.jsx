'use client';

import { useState } from 'react';
import { calculateAge } from '../lib/calculateAge.js';
import { VerifiedIcon } from './user_interface/Icons.jsx';

export function ProfileCard({ profile, onOpenDetail, className = '' }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.photos ?? [];
  const currentPhoto = photos[photoIndex] ?? photos[0];

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (photos.length > 1) {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (photos.length > 1) {
      setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-3xl border border-plum-border bg-plum-surface shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] select-none ${className}`}
    >
      {/* Photo Image */}
      {currentPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentPhoto.url}
          alt={profile.displayName}
          className="h-full w-full object-cover transition-all duration-300 pointer-events-none"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-plum-night">
          <span className="font-display text-6xl text-pearl-dim">{profile.displayName?.[0]}</span>
        </div>
      )}

      {/* Top Photo Story Progress Indicators */}
      {photos.length > 1 && (
        <div className="absolute inset-x-4 top-3.5 z-20 flex gap-1.5 pointer-events-none">
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

      {/* Left/Right Photo Tap Navigation Controls */}
      {photos.length > 1 && (
        <div className="absolute inset-0 z-10 flex">
          <button
            type="button"
            aria-label="Previous Photo"
            onClick={handlePrevPhoto}
            className="w-1/2 h-4/5 outline-none cursor-pointer"
          />
          <button
            type="button"
            aria-label="Next Photo"
            onClick={handleNextPhoto}
            className="w-1/2 h-4/5 outline-none cursor-pointer"
          />
        </div>
      )}

      {/* Top Left Navigation Arrow Badges for Multi-Photos */}
      {photos.length > 1 && (
        <>
          {photoIndex > 0 && (
            <button
              onClick={handlePrevPhoto}
              className="absolute left-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-plum-night/60 text-pearl backdrop-blur-md transition-all hover:bg-plum-night hover:scale-110"
            >
              ‹
            </button>
          )}
          {photoIndex < photos.length - 1 && (
            <button
              onClick={handleNextPhoto}
              className="absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-plum-night/60 text-pearl backdrop-blur-md transition-all hover:bg-plum-night hover:scale-110"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* Bottom Gradient Overlay & Information */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-plum-night via-plum-night/80 to-transparent px-6 pb-6 pt-24 pointer-events-none">
        {/* Status Indicator */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-mehendi shadow-[0_0_8px_rgba(46,204,113,0.8)]" />
          <span className="font-mono text-xs font-semibold text-mehendi-light tracking-wide">
            Recently Active
          </span>
        </div>

        {/* Display Name, Age & Verified Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-4xl font-bold text-pearl drop-shadow-md">
              {profile.displayName}
            </h2>
            <span className="font-mono text-2xl font-light text-pearl-dim">
              {calculateAge(profile.dateOfBirth)}
            </span>
            {profile.verificationStatus === 'VERIFIED' && (
              <VerifiedIcon className="h-6 w-6 text-saffron" />
            )}
          </div>

          {/* Info Modal Toggle Button */}
          {onOpenDetail && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail();
              }}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-pearl/20 bg-plum-night/70 text-pearl backdrop-blur-md transition-transform hover:scale-110 hover:border-gold/50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Profession */}
        {profile.profession && (
          <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-wider text-saffron">
            {profile.profession}
          </p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-pearl-dim font-sans">
            {profile.bio}
          </p>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-pearl/10 bg-plum-surface/90 px-3 py-1 font-mono text-xs text-pearl-dim backdrop-blur-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { calculateAge } from '../lib/calculateAge.js';
import { VerifiedIcon, SparklesIcon } from './user_interface/Icons.jsx';

export function ProfileCard({ profile, onOpenDetail, className = '' }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const photos = profile.photos ?? [];
  const currentPhoto = photos[photoIndex] ?? photos[0];

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (photos.length > 1) {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
      setImgError(false);
    }
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (photos.length > 1) {
      setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
      setImgError(false);
    }
  };

  // Dynamic activity status calculation
  const getActiveStatus = () => {
    if (!profile.updatedAt) return null;
    const diffHours = (Date.now() - new Date(profile.updatedAt).getTime()) / (1000 * 60 * 60);
    if (diffHours <= 36) {
      return { label: 'Recently Active', isRecent: true };
    } else if (diffHours <= 168) {
      return { label: 'Active this week', isRecent: false };
    }
    return null;
  };

  const activeStatus = getActiveStatus();

  return (
    <div
      className={`group relative h-full w-full max-w-[500px] overflow-hidden rounded-[30px] border border-white/80 bg-[#e7d8d0] shadow-[0_30px_80px_-28px_rgba(54,34,27,0.48)] select-none animate-card-reveal ${className}`}
    >
      {/* Photo Image */}
      {currentPhoto && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentPhoto.url}
          alt={profile.displayName}
          onError={() => setImgError(true)}
          className="pointer-events-none h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#fff5ee_0%,#f0d8d2_45%,#e6c6c6_100%)]">
          <span className="font-display text-8xl font-bold text-[#d57b7b]">{profile.displayName?.[0]}</span>
        </div>
      )}

      {/* Real AI Vector Compatibility Match Badge */}
      {profile.compatibilityLabel && (
        <div className="absolute left-4 top-5 z-20 flex items-center gap-1.5 rounded-full border border-white/50 bg-black/30 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-sm backdrop-blur-md">
          <SparklesIcon className="h-3.5 w-3.5 text-[#ffe49a]" />
          <span>{profile.compatibilityLabel === 'STRONG' ? 'Strong AI Match' : 'Good AI Match'}</span>
        </div>
      )}

      {/* Top Photo Story Progress Indicators */}
      {photos.length > 1 && (
        <div className="absolute inset-x-4 top-3.5 z-20 flex gap-1.5 pointer-events-none">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                i === photoIndex ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/35'
              }`}
            />
          ))}
        </div>
      )}

      {/* Left/Right Photo Tap Controls & Visible Arrows */}
      {photos.length > 1 && (
        <>
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

          {/* Visible Arrow Buttons for Photo Switching */}
          {photoIndex > 0 && (
            <button
              type="button"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/25 text-lg font-bold text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/40 active:scale-95"
            >
              ‹
            </button>
          )}
          {photoIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={handleNextPhoto}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/25 text-lg font-bold text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/40 active:scale-95"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* Bottom Gradient Overlay & Information */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-5 pb-5 pt-32 sm:px-6 sm:pb-6">
        {/* Dynamic Activity Status Indicator */}
        {activeStatus && (
          <div className="mb-2 flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                activeStatus.isRecent
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]'
              }`}
            />
            <span className="font-mono text-xs font-semibold tracking-wide text-white/80">
              {activeStatus.label}
            </span>
          </div>
        )}

        {/* Display Name, Age & Verified Badge */}
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate font-sans text-2xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-3xl">
              {profile.displayName}
            </h2>
            <span className="shrink-0 font-sans text-2xl font-medium text-white/90">
              {calculateAge(profile.dateOfBirth)}
            </span>
            {profile.verificationStatus === 'VERIFIED' && (
              <VerifiedIcon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
            )}
          </div>

          {/* Reverse V (^ Up Arrow) Info Button */}
          {onOpenDetail && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail();
              }}
              aria-label="Open profile details"
              className="pointer-events-auto ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white/25 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Profession */}
        {profile.profession && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
            {profile.profession}
          </p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/90">
            {profile.bio}
          </p>
        )}

        {/* Clean Sans-Serif Interest Pills */}
        {profile.interests?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-white/30 bg-white/15 px-3 py-1 font-sans text-[11px] font-semibold text-white backdrop-blur-sm"
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
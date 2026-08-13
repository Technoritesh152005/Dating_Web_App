import {calculateAge} from '../lib/calculateAge.js'

export function ProfileCard({ profile, style, className = '' }) {
    const photo = profile.photos?.[0];
  
    return (
      <div
        style={style}
        className={`absolute inset-0 overflow-hidden rounded-card border border-cream/10 bg-dusk shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)] ${className}`}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={profile.displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-dusk-light">
            <span className="font-display text-4xl text-cream-dim">{profile.displayName?.[0]}</span>
          </div>
        )}
  
        {/* Gradient overlay - keeps text legible against any photo, without
            flattening the photo itself with a solid scrim. */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent px-6 pb-6 pt-20">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-2xl text-cream">{profile.displayName}</h2>
            <span className="font-mono text-[15px] text-cream-dim">{calculateAge(profile.dateOfBirth)}</span>
            {profile.verificationStatus === 'VERIFIED' && (
              <span className="ml-1 rounded-full bg-mehendi/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mehendi-light">
                Verified
              </span>
            )}
          </div>
  
          {profile.bio && <p className="mt-2 line-clamp-2 text-[14px] text-cream-dim">{profile.bio}</p>}
  
          {profile.interests?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 4).map((interest) => (
                <span key={interest} className="rounded-full bg-cream/10 px-2.5 py-1 font-mono text-[11px] text-cream-dim">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
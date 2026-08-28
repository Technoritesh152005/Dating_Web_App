'use client'

const SECTIONS = [
  { id: 'profile', label: 'Profile Studio' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'account', label: 'Account Settings' },
]

export function ProfileSettingsNav({ activeSection, onChange }) {
  return (
    <nav
      aria-label="Profile settings"
      className="flex w-full gap-2 rounded-2xl border border-plum-border bg-plum-surface p-1.5 shadow-lg"
    >
      {SECTIONS.map((section) => {
        const active = activeSection === section.id
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            className={`flex-1 rounded-xl py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              active
                ? 'bg-saffron-gradient text-pearl shadow-saffron-glow'
                : 'text-pearl-dim hover:text-pearl hover:bg-plum-night/50'
            }`}
          >
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}

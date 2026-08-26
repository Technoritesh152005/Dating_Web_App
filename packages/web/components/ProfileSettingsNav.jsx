'use client'

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'preferences', label: 'Preferences' },
]

export function ProfileSettingsNav({ activeSection, onChange }) {
  return (
    <nav
      aria-label="Profile settings"
      className="flex w-full gap-1 overflow-x-auto rounded-card border border-cream/10 bg-dusk p-1"
    >
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onChange(section.id)}
          className={`whitespace-nowrap rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wide transition ${
            activeSection === section.id
              ? 'bg-gradient-to-r from-sindoor to-marigold text-ink'
              : 'text-cream-dim hover:text-cream'
          }`}
        >
          {section.label}
        </button>
      ))}
    </nav>
  )
}

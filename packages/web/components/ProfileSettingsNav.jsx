'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Compass, Heart, Menu, Shield, SlidersHorizontal, UserRound, X } from 'lucide-react';

const SECTIONS = [
  { id: 'profile', label: 'Profile Studio', Icon: UserRound },
  { id: 'preferences', label: 'Preferences', Icon: SlidersHorizontal },
  { id: 'account', label: 'Account Settings', Icon: Shield },
];

export function ProfileSettingsNav({ activeSection, onChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = SECTIONS.find(({ id }) => id === activeSection)?.label ?? 'Profile Studio';

  const selectSection = (sectionId) => {
    onChange(sectionId);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-[#eadfd8] bg-white/95 p-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/discover" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0f1] text-[#ed5964]">
              <Heart className="h-4 w-4 fill-current" />
            </span>
            <span className="truncate font-display text-lg text-[#292321]">{activeLabel}</span>
          </Link>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-profile-settings"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#eadfd8] bg-white px-3 text-sm font-semibold text-[#655d58] transition hover:bg-[#f8f4f0]"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>{mobileOpen ? 'Close' : 'Sections'}</span>
          </button>
        </div>

        {mobileOpen && (
          <nav id="mobile-profile-settings" aria-label="Profile settings" className="mt-3 grid gap-1 border-t border-[#eee5df] pt-3">
            {SECTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={activeSection === id ? 'page' : undefined}
                onClick={() => selectSection(id)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${
                  activeSection === id
                    ? 'bg-[#fff0f1] text-[#e95161]'
                    : 'text-[#655d58] hover:bg-[#f8f4f0]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
            <Link href="/discover" className="mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#655d58] hover:bg-[#f8f4f0]">
              <Compass className="h-4 w-4 shrink-0" />
              Back to Discover
            </Link>
          </nav>
        )}
      </div>

      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#eadfd8] bg-white/80 px-3 py-5 backdrop-blur-xl transition-[width] duration-200 md:flex ${collapsed ? 'w-[84px]' : 'w-64'}`}>
        <div className={`mb-10 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-1'}`}>
          <Link href="/discover" aria-label="Melodis home" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff0f1] text-[#ed5964]">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            {!collapsed && <span className="font-display text-xl text-[#292321]">Melodis</span>}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#827871] transition hover:bg-[#f8f4f0] hover:text-[#292321]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="mb-5 flex h-9 w-full items-center justify-center rounded-xl text-[#827871] transition hover:bg-[#f8f4f0] hover:text-[#292321]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {!collapsed && (
          <div className="mb-5 px-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#a39a94]">Your settings</p>
            <p className="mt-1 text-xs leading-relaxed text-[#827871]">Keep your profile and account up to date.</p>
          </div>
        )}

        <nav aria-label="Profile settings" className="space-y-1.5">
          {SECTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={activeSection === id ? 'page' : undefined}
              title={collapsed ? label : undefined}
              onClick={() => selectSection(id)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition ${
                activeSection === id
                  ? 'bg-[#fff0f1] text-[#e95161] shadow-sm shadow-rose-100'
                  : 'text-[#655d58] hover:bg-[#f8f4f0] hover:text-[#292321]'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <Link
          href="/discover"
          title={collapsed ? 'Back to Discover' : undefined}
          className={`mt-auto flex min-h-11 items-center gap-3 rounded-2xl border border-[#eee5df] bg-[#fbf8f5] px-3 text-sm font-semibold text-[#655d58] transition hover:border-[#edc0c3] hover:text-[#e95161] ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <Compass className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Back to Discover</span>}
        </Link>
      </aside>
    </>
  );
}

'use client';

import { Button } from '@/components/user_interface/Button';

export function ConfirmModal({ open, title, description, confirmLabel, onConfirm, onCancel, danger = false }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-night/80 px-6 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-plum-border bg-plum-surface/95 p-7 shadow-2xl backdrop-blur-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? 'bg-sindoor/15 text-sindoor-light border border-sindoor/30' : 'bg-saffron/15 text-saffron border border-saffron/30'}`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {danger ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              )}
            </svg>
          </div>
          <h3 className="font-display text-2xl font-bold text-pearl">{title}</h3>
          {description && <p className="mt-2 text-xs leading-relaxed text-pearl-dim">{description}</p>}
        </div>

        <div className="mt-7 flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-plum-border bg-plum-night/60 text-xs font-mono uppercase tracking-wider text-pearl-dim hover:text-pearl"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 px-4 font-mono text-xs font-bold uppercase tracking-wider text-pearl transition-all hover:scale-[1.02] ${
              danger
                ? 'bg-sindoor/90 hover:bg-sindoor text-pearl shadow-lg'
                : 'bg-saffron-gradient shadow-saffron-glow'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


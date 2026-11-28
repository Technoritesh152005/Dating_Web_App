'use client';

import { Button } from '@/components/user_interface/Button';

export function ConfirmModal({ open, title, description, confirmLabel, onConfirm, onCancel, danger = false }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#292321]/35 px-6 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl border border-[#eadfd8] bg-white/95 p-7 shadow-[0_24px_70px_-35px_rgba(41,35,33,0.35)] backdrop-blur-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? 'border border-[#f1c7c9] bg-[#fff0f1] text-[#b73946]' : 'border border-[#f1c7c9] bg-[#fff0f1] text-[#e95161]'}`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {danger ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              )}
            </svg>
          </div>
          <h3 className="font-display text-2xl font-bold text-[#292321]">{title}</h3>
          {description && <p className="mt-2 text-sm leading-relaxed text-[#71655f]">{description}</p>}
        </div>

        <div className="mt-7 flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="!flex-1 !rounded-xl !border-[#eadfd8] !bg-[#f8f4f0] !text-xs !font-semibold !uppercase !tracking-wider !text-[#655d58] hover:!bg-[#f1eae4] hover:!text-[#292321]"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:scale-[1.02] ${
              danger
                ? 'bg-[#b73946] shadow-sm hover:bg-[#a32c39]'
                : 'bg-[#e95161] shadow-sm hover:bg-[#d94355]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


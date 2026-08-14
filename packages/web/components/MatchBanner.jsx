'use client';

import { useEffect } from 'react';

export function MatchBanner({ name, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3200);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-6">
      <div className="flex items-center gap-3 rounded-full bg-gradient-to-r from-sindoor to-marigold px-6 py-3 text-ink shadow-[0_16px_40px_-12px_rgba(230,57,80,0.6)]">
        <span className="font-display text-[15px] font-medium">It's a match with {name}!</span>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';

export function ActionMenu({ trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-cream/10 bg-dusk shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
          {/* Close the menu whenever an item inside is clicked, without
              every caller needing to remember to do it themselves. */}
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

export function ActionMenuItem({ onClick, danger, children }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-4 py-3 text-left text-[14px] transition-colors hover:bg-cream/5 ${
        danger ? 'text-sindoor-light' : 'text-cream'
      }`}
    >
      {children}
    </button>
  );
}

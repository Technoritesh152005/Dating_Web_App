'use client';

import { useState } from 'react';
import { Bloom } from './Bloom';

const VARIANTS = {
  // Primary: the sindoor->marigold gradient, reserved for the ONE main
  // action per screen - not diluted by using it everywhere.
  primary:
    'bg-gradient-to-r from-sindoor to-marigold text-ink font-semibold shadow-[0_8px_24px_-8px_rgba(230,57,80,0.6)] hover:shadow-[0_12px_32px_-8px_rgba(230,57,80,0.75)] hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-dusk-light text-cream border border-cream/15 hover:border-marigold/50 hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'text-cream-dim hover:text-cream underline-offset-4 hover:underline',
};

export function Button({ children, variant = 'primary', className = '', onClick, type = 'button', disabled, showBloom = false, ...props }) {
  const [bloomTrigger, setBloomTrigger] = useState(0);

  const handleClick = (e) => {
    if (showBloom) setBloomTrigger((n) => n + 1);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`relative overflow-hidden rounded-full px-7 py-3.5 text-[15px] transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {showBloom && bloomTrigger > 0 && <Bloom trigger={bloomTrigger} size={180} />}
      <span className="relative">{children}</span>
    </button>
  );
}

'use client';

import { useState } from 'react';
import { Bloom } from './Bloom';

const VARIANTS = {
  primary:
    'bg-[#e95161] text-white font-semibold shadow-[0_18px_35px_-24px_rgba(233,81,97,0.75)] hover:bg-[#d94355] active:scale-[0.985]',
  secondary:
    'border border-[#eadfd8] bg-white text-[#655d58] hover:bg-[#f8f4f0] active:scale-[0.985]',
  ghost: 'text-[#827871] hover:text-[#292321]',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled,
  showBloom = false,
  ...props
}) {
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
      className={`relative inline-flex min-h-11 items-center justify-center rounded-2xl px-6 text-[15px] tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {showBloom && bloomTrigger > 0 && <Bloom trigger={bloomTrigger} size={180} />}
      <span className="relative">{children}</span>
    </button>
  );
}
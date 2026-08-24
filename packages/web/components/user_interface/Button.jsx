'use client';

import { useState } from 'react';
import { Bloom } from './Bloom';

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-[#f3b75b] via-[#e0a13a] to-[#c9861b] text-[#1f140e] font-semibold shadow-[0_18px_35px_-24px_rgba(240,162,2,0.9)] hover:brightness-105 active:scale-[0.985]',
  secondary:
    'border border-cream/15 bg-[#2d201d]/80 text-cream hover:bg-[#382a28] active:scale-[0.985]',
  ghost: 'text-cream-dim hover:text-cream',
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
      className={`relative overflow-hidden inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {showBloom && bloomTrigger > 0 && <Bloom trigger={bloomTrigger} size={180} />}
      <span className="relative">{children}</span>
    </button>
  );
}
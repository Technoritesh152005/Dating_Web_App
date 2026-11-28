'use client';

import { cloneElement, isValidElement, useId, useState, useRef, useEffect } from 'react';

export function ActionMenu({ trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuId = useId();

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger, {
        type: trigger.type === 'button' ? 'button' : undefined,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': menuId,
        onClick: (event) => {
          trigger.props.onClick?.(event);
          if (!event.defaultPrevented) setOpen((current) => !current);
        },
      })
    : trigger;

  return (
    <div ref={ref} className={`relative ${open ? 'z-50' : ''}`}>
      {triggerElement}
      {open && (
        <div
          id={menuId}
          role="menu"
          onClick={() => setOpen(false)}
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#eadfd8] bg-white p-1.5 shadow-[0_18px_44px_-18px_rgba(41,35,33,0.35)]"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function ActionMenuItem({ onClick, danger, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors hover:bg-[#fff0f1] ${
        danger ? 'text-[#b73946] hover:bg-[#fff0f1]' : 'text-[#514944] hover:text-[#e95161]'
      }`}
    >
      {children}
    </button>
  );
}

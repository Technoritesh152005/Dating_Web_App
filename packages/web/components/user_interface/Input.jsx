'use client';

export function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-cream-dim/80"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-2xl border border-cream/10 bg-[#2a1f1d]/80 px-4 py-3.5 text-[15px] text-cream outline-none transition-all placeholder:text-cream-dim/45 focus:border-marigold/60 focus:shadow-[0_0_0_1px_rgba(240,162,2,0.3)] ${error ? 'border-sindoor/70' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-[12px] text-cream-dim/70">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
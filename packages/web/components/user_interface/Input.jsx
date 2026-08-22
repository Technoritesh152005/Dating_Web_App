'use client';

export function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-cream-dim"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-2xl border border-cream/10 bg-dusk px-5 py-3.5 text-[15px] text-cream outline-none transition-colors placeholder:text-cream-dim/50 focus:border-marigold/60 ${error ? 'border-sindoor/70' : ''} ${className}`}
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
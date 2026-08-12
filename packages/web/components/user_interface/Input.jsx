'use client';

export function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-2xl border border-cream/10 bg-dusk-light px-5 py-3.5 text-[15px] text-cream placeholder:text-cream-dim/60 outline-none transition-colors focus:border-marigold/60 ${error ? 'border-sindoor/70' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-[13px] text-sindoor-light">{error}</p>}
    </div>
  );
}
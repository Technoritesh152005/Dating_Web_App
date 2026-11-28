'use client';

export function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || props.name;
  const isRange = props.type === 'range';

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block font-mono text-[11px] uppercase tracking-[0.16em] text-[#827871]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full ${isRange ? 'h-2 cursor-pointer rounded-lg border-0 bg-[#eadfd8] px-0 py-0 focus:shadow-none' : 'rounded-2xl border border-[#eadfd8] bg-[#faf7f2] px-4 py-3.5 text-[15px] text-[#292321] outline-none placeholder:text-[#a39a94] focus:border-[#edc0c3] focus:shadow-[0_0_0_1px_rgba(233,81,97,0.16)]'} transition-all disabled:cursor-not-allowed disabled:opacity-60 ${error && !isRange ? 'border-[#d96770]' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p         role="alert"
        className="mt-1.5 text-[12px] text-[#b73946]">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
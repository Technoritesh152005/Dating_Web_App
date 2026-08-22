'use client';

export function ChoicePills({ options, value, onChange, multiple = false }) {
  const isSelected = (opt) => (multiple ? value.includes(opt) : value === opt);

  const toggle = (opt) => {
    if (multiple) {
      onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    } else {
      onChange(opt);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value: optValue, label }) => {
        const selected = isSelected(optValue);
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => toggle(optValue)}
            className={`rounded-full border px-4 py-2 text-[13.5px] transition-all duration-200 active:scale-95 ${
              selected
                ? 'animate-pop-in border-marigold/70 bg-marigold/15 text-marigold'
                : 'border-cream/10 bg-cream/[0.03] text-cream-dim hover:border-cream/25 hover:text-cream'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
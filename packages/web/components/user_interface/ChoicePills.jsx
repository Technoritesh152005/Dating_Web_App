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
    <div className="flex flex-wrap gap-2.5">
      {options.map(({ value: optValue, label }) => {
        const selected = isSelected(optValue);
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => toggle(optValue)}
            className={`rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] ${
              selected
                ? 'border-marigold/70 bg-marigold/20 text-marigold shadow-[0_0_0_1px_rgba(240,162,2,0.3)]'
                : 'border-cream/12 bg-cream/[0.02] text-cream-dim hover:border-cream/20 hover:text-cream'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
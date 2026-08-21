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
            className={`rounded-full border px-4 py-2 text-[14px] transition-all duration-150 ${
              selected
                ? 'border-transparent bg-gradient-to-r from-sindoor to-marigold text-ink font-medium'
                : 'border-cream/15 bg-dusk-light text-cream-dim hover:border-marigold/40 hover:text-cream'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
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
            className={`min-h-11 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] ${
              selected
              ? 'border-[#edc0c3] bg-[#fff0f1] text-[#c34450] shadow-[0_0_0_1px_rgba(233,81,97,0.12)]'
              : 'border-[#eadfd8] bg-white text-[#655d58] hover:border-[#edc0c3] hover:text-[#292321]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
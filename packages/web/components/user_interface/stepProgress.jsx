export function StepProgress({ current, total }) {
    return (
      <div className="mb-8 flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-marigold' : i < current ? 'w-4 bg-marigold/50' : 'w-4 bg-cream/15'
            }`}
          />
        ))}
      </div>
    );
  }
  
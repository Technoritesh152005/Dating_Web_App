export function StepProgress({ current, total }) {
  const percentage = Math.round(((current + 1) / total) * 100);

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Header Info */}
      <div className="flex items-center justify-between font-mono text-xs mb-2.5">
        <span className="text-pearl-dim uppercase tracking-wider font-semibold">
          Step {current + 1} of {total}
        </span>
        <span className="text-gold font-bold bg-gold/10 border border-gold/30 px-2.5 py-0.5 rounded-full">
          {percentage}% Complete
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-plum-night border border-plum-border/60">
        <div
          className="h-full rounded-full bg-saffron-gradient shadow-saffron-glow transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Milestone Segment Indicators */}
      <div className="mt-3 flex items-center justify-between">
        {Array.from({ length: total }).map((_, i) => {
          const isDone = i < current;
          const isActive = i === current;
          return (
            <div key={i} className="flex flex-col items-center">
              <span
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  isDone
                    ? 'bg-gold shadow-gold-glow scale-110'
                    : isActive
                    ? 'bg-saffron shadow-saffron-glow scale-125'
                    : 'bg-plum-border'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

  
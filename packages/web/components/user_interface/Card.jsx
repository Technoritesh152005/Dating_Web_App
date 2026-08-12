export function Card({ children, className = '' }) {
    return (
      <div className={`rounded-card border border-cream/8 bg-dusk shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] ${className}`}>
        {children}
      </div>
    );
  }
  
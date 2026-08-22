export function Card({ children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-cream/10 bg-dusk-light/70 p-6 backdrop-blur-xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-marigold/50 to-transparent" />
      {children}
    </div>
  );
}

export default Card;
import Link from 'next/link';

export function AuthScreen({ eyebrow, title, subtitle, children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-plum-night px-6 py-12 text-pearl selection:bg-saffron selection:text-pearl">
      {/* Background Animated Romantic Mesh & Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-10 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,_rgba(240,162,2,0.22)_0%,_rgba(230,57,80,0.14)_50%,_transparent_70%)] blur-[120px] animate-pulse-glow" />
        <div
          className="absolute -right-32 bottom-10 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,_rgba(119,58,73,0.45)_0%,_rgba(240,79,101,0.18)_50%,_transparent_70%)] blur-[140px] animate-float-slow"
          style={{ animationDelay: '2.5s' }}
        />
        <div
          className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(240,162,2,0.15)_0%,_transparent_70%)] blur-[100px] animate-pulse-glow"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="w-full max-w-xl">
        {/* Navigation & Brand Logo */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 font-mono text-xs text-pearl-muted transition-colors hover:text-pearl"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-gradient text-pearl font-bold font-display text-sm shadow-saffron-glow">
              M
            </div>
            <span className="font-display text-xl font-bold text-pearl">
              Melodis<span className="text-saffron">.</span>
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-8 text-center">
          {eyebrow && (
            <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 font-mono text-xs uppercase tracking-[0.2em] font-bold text-gold mb-3 shadow-gold-glow">
              {eyebrow}
            </span>
          )}
          <h1 className="font-display text-3xl font-bold text-pearl sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2.5 text-sm text-pearl-dim">{subtitle}</p>}
        </div>

        {/* Main Glassmorphic Card Container with Romantic Border Glow */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-saffron/30 bg-plum-surface/85 p-8 sm:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-500 hover:border-saffron/60 hover:shadow-[0_30px_90px_rgba(240,79,101,0.25)]">
          {/* Subtle Inner Glow Highlight */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-saffron/10 blur-3xl" />
          {children}
        </div>
      </div>
    </main>
  );
}

export function Divider({ children }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-plum-border/60" />
      <span className="font-mono text-xs uppercase tracking-widest text-pearl-muted">{children}</span>
      <span className="h-px flex-1 bg-plum-border/60" />
    </div>
  );
}

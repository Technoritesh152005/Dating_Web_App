import Link from 'next/link';

export function AuthScreen({ eyebrow, title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        {/* Top Nav Bar */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-1.5 font-mono text-xs text-taupe transition-colors hover:text-espresso"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span>Home</span>
          </Link>
          <span className="font-display text-lg text-espresso italic">Melodis</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          {eyebrow && (
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-taupe">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl text-espresso sm:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-taupe leading-relaxed">{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-sand bg-paper p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}

export function Divider({ children }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-sand" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-taupe">{children}</span>
      <span className="h-px flex-1 bg-sand" />
    </div>
  );
}

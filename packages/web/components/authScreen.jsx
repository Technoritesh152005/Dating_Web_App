import { Card } from '@/components/user_interface/Card';

export function AuthScreen({ eyebrow, title, subtitle, children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-bloom-soft blur-3xl animate-float-slow" />
        <div
          className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-bloom-soft blur-3xl animate-float-slow"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {eyebrow && <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">{eyebrow}</p>}
          <h1 className="font-display text-3xl text-cream">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-cream-dim">{subtitle}</p>}
        </div>

        <Card className="p-8">{children}</Card>
      </div>
    </main>
  );
}

export function Divider({ children }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-cream/10" />
      <span className="font-mono text-[11px] uppercase tracking-wide text-cream-dim">{children}</span>
      <span className="h-px flex-1 bg-cream/10" />
    </div>
  );
}

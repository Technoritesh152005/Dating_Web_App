'use client';

import { Button } from '@/components/ui/Button';

// App Router convention: this catches any unhandled error thrown while
// rendering a page and shows this instead of a blank white screen or a
// raw stack trace - the single most basic production-readiness gap a
// portfolio project can have if skipped.
export default function GlobalError({ error, reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-sindoor">Something went wrong</p>
        <h1 className="font-display text-2xl text-cream">That didn't work</h1>
        <p className="mt-3 text-[15px] text-cream-dim">
          Give it another try — if this keeps happening, it's on us, not you.
        </p>
        <Button variant="primary" onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </main>
  );
}

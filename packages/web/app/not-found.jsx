import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-marigold">404</p>
        <h1 className="font-display text-2xl text-cream">Nothing here</h1>
        <p className="mt-3 text-[15px] text-cream-dim">This page doesn't exist, or moved somewhere else.</p>
        <Link href="/discover" className="mt-6 inline-block text-marigold hover:underline">
          Back to Discover
        </Link>
      </div>
    </main>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-[1600px] flex-col justify-center px-4 py-24 sm:px-6 lg:px-10">
      <TriangleAlert className="size-8 text-wedge" aria-hidden="true" />
      <h1 className="fx-display mt-6 text-4xl">Something failed on our side</h1>
      <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-ink-muted">
        This is not your doing. Try again, and if it keeps happening, tell us what you were doing
        and we will look at it.
      </p>
      {error.digest && (
        <p className="fx-num mt-3 text-xs text-ink-faint">Reference: {error.digest}</p>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="fx-wedge">
          Try again
        </button>
        <Link href="/contact" className="fx-wedge-ghost">
          Report it
        </Link>
      </div>
    </div>
  );
}

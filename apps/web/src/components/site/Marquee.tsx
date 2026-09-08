import { cn } from '@/lib/utils';

/**
 * The banding on the railcar. A continuous run edge to edge — the world's
 * rule is that continuous elements never break mid-travel, so the track is
 * duplicated exactly and translated by half its width.
 */
export function Marquee({
  text,
  className,
  tone = 'ink',
  seconds = 34,
}: {
  text: string;
  className?: string;
  tone?: 'ink' | 'wedge';
  seconds?: number;
}) {
  const copies = Array.from({ length: 8 });

  return (
    <div
      className={cn(
        'relative overflow-hidden border-y py-3.5',
        tone === 'wedge'
          ? 'border-wedge-deep bg-wedge text-wedge-ink'
          : 'border-rule bg-ground-sunk text-ink',
        className
      )}
      aria-hidden="true"
    >
      <div
        className="fx-marquee-track"
        style={{ ['--fx-marquee-duration' as string]: `${seconds}s` }}
      >
        {[0, 1].map((track) => (
          <div key={track} className="flex shrink-0">
            {copies.map((_, i) => (
              <span
                key={i}
                className="fx-stencil flex shrink-0 items-center gap-8 px-8 text-sm sm:text-base"
              >
                {text}
                <svg viewBox="0 0 12 12" className="size-2 shrink-0" aria-hidden="true">
                  <path d="M0 0h12L8 12H0z" fill="currentColor" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

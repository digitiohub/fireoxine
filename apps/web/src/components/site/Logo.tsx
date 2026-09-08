import { cn } from '@/lib/utils';

/**
 * The wordmark. A stencilled FIREOXINE with the wedge cut into the O —
 * the same notch the primary action carries, so the mark and the button
 * are visibly the same system.
 */
export function Logo({ className, showMark = true }: { className?: string; showMark?: boolean }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5 leading-none', className)}>
      {showMark && (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-[0.85em] shrink-0 translate-y-[0.06em]"
          fill="none"
        >
          <path d="M2 2h20L18 22H2z" className="fill-wedge" />
          <path d="M8 8h8l-1.6 8H8z" className="fill-ground" />
        </svg>
      )}
      <span className="fx-display tracking-[0.02em]">FireOxine</span>
    </span>
  );
}

import { cn } from '@/lib/utils';

/**
 * The launch condition, designed.
 *
 * No product photography exists until the client uploads it through /admin,
 * so "no image" is not an edge case here — it is what every product looks
 * like on day one. This renders a stencilled newsprint plate carrying the
 * product's SKU, so the space reads as a plate awaiting its photograph
 * rather than as a broken box, and it holds its own beside a real photo
 * once one lands.
 */
export function PendingImage({
  sku,
  label,
  className,
}: {
  sku: string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        '@container fx-newsprint relative grid size-full place-items-center overflow-hidden bg-ground-sunk',
        className
      )}
    >
      {/* Registration corners, the way a print plate is marked up. */}
      <svg
        className="absolute inset-0 size-full text-ink/20"
        aria-hidden="true"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M4 12V4h8M88 4h8v8M96 88v8h-8M12 96H4v-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* The plate is used at every scale, from a 5.5rem cart thumbnail to a
          full product gallery. Container queries drop the wording rather than
          letting it clip, so a small plate reads as deliberate at any size. */}
      <div className="relative flex flex-col items-center gap-2 px-3 text-center">
        <svg
          viewBox="0 0 32 32"
          className="size-5 text-ink/30 @[9rem]:size-7"
          aria-hidden="true"
          fill="none"
        >
          <rect x="2" y="6" width="28" height="20" stroke="currentColor" strokeWidth="1.5" />
          <path d="m2 21 7-7 6 6 5-5 12 12" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="22" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="fx-stencil hidden text-[0.6rem] text-ink-faint @[9rem]:block">
          Photograph pending
        </p>
        <p className="fx-num hidden text-[0.65rem] text-ink-faint/80 @[13rem]:block">{sku}</p>
        {label && <span className="sr-only">{label}</span>}
      </div>
    </div>
  );
}

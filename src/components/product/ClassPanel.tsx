import { cn } from '@/lib/utils';

export type ClassCell = {
  code: string;
  label: string;
  covers: boolean;
};

const ALL_CODES = ['A', 'B', 'C', 'D', 'K'];

/**
 * The class panel row: A B C D K.
 *
 * Three states, and every one of them is carried by shape and letter, never
 * by colour alone:
 *   covered    — ink-filled cell, letter reversed out
 *   prohibited — struck through with a diagonal, letter dimmed
 *   unstated   — empty cell, faint letter
 *
 * "Unstated" is deliberately different from "prohibited". A product that
 * simply does not mention Class D is not the same as one that tells you it
 * must never be used on it, and flattening those two together is how a
 * catalogue gets someone hurt.
 */
export function ClassPanel({
  cells,
  size = 'md',
  className,
}: {
  cells: ClassCell[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const byCode = new Map(cells.map((c) => [c.code, c]));

  const dims = {
    sm: 'size-5 text-[0.6rem]',
    md: 'size-7 text-xs',
    lg: 'size-11 text-base',
  }[size];

  return (
    <ul className={cn('flex gap-1', className)}>
      {ALL_CODES.map((code) => {
        const cell = byCode.get(code);
        const state = !cell ? 'unstated' : cell.covers ? 'covered' : 'prohibited';

        const description =
          state === 'covered'
            ? `Rated for Class ${code} — ${cell!.label}`
            : state === 'prohibited'
              ? `Must NOT be used on Class ${code} — ${cell!.label}`
              : `Not rated for Class ${code}`;

        return (
          <li key={code}>
            <span
              title={description}
              className={cn(
                'fx-display relative grid place-items-center border tabular-nums',
                dims,
                state === 'covered' && 'border-ink bg-ink text-ground',
                state === 'prohibited' && 'border-wedge text-wedge',
                state === 'unstated' && 'border-rule text-ink-faint/60'
              )}
            >
              <span className="sr-only">{description}</span>
              <span aria-hidden="true">{code}</span>
              {state === 'prohibited' && (
                <svg
                  viewBox="0 0 24 24"
                  className="absolute inset-0 size-full"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  <line
                    x1="1"
                    y1="23"
                    x2="23"
                    y2="1"
                    stroke="currentColor"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** The full-width legend, used on product detail and the hazard pages. */
export function ClassLegend({ className }: { className?: string }) {
  return (
    <dl className={cn('flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-muted', className)}>
      <div className="flex items-center gap-2">
        <span className="grid size-4 place-items-center border border-ink bg-ink" aria-hidden="true" />
        <dt className="sr-only">Filled cell</dt>
        <dd>Rated for this class</dd>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="relative grid size-4 place-items-center border border-wedge"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" preserveAspectRatio="none">
            <line
              x1="1"
              y1="23"
              x2="23"
              y2="1"
              stroke="var(--wedge)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
        <dt className="sr-only">Struck cell</dt>
        <dd>Must not be used on this class</dd>
      </div>
      <div className="flex items-center gap-2">
        <span className="grid size-4 place-items-center border border-rule" aria-hidden="true" />
        <dt className="sr-only">Empty cell</dt>
        <dd>Not rated</dd>
      </div>
    </dl>
  );
}

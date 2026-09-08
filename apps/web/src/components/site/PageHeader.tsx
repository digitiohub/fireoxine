import { cn } from '@/lib/utils';

/**
 * The page head as a railcar: the wedge drives in behind the title, the rule
 * closes the car underneath. Shared by every non-home page so the site reads
 * as one train rather than a set of pages.
 */
export function PageHeader({
  title,
  lede,
  action,
  eyebrowLinks,
  className,
}: {
  title: React.ReactNode;
  lede?: string;
  action?: React.ReactNode;
  eyebrowLinks?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('relative overflow-hidden border-b border-rule', className)}>
      <div
        aria-hidden="true"
        className="fx-drive pointer-events-none absolute inset-y-0 left-0 w-[26%] bg-wedge/12"
        style={{ clipPath: 'polygon(0 0, 100% 0, 55% 100%, 0 100%)' }}
      />
      <div className="relative mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        {eyebrowLinks}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="fx-display text-[clamp(2.75rem,8vw,6rem)] leading-[0.9]">{title}</h1>
            {lede && (
              <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-ink-muted sm:text-lg">
                {lede}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </section>
  );
}

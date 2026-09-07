import { cn } from '@/lib/utils';

/**
 * A railcar head: the stencilled label riding a rule, with the section title
 * beneath it. No eyebrow above the heading — the label IS the rule's cargo,
 * and the heading carries its own weight.
 */
export function SectionHead({
  title,
  lede,
  action,
  align = 'left',
  className,
}: {
  title: React.ReactNode;
  lede?: string;
  action?: React.ReactNode;
  align?: 'left' | 'centre';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'centre' && 'sm:flex-col sm:items-center sm:text-center',
        className
      )}
    >
      <div
        className={cn('max-w-2xl', align === 'centre' && 'mx-auto')}
        data-fx="arrive"
      >
        <h2 className="fx-display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
        {lede && (
          <p
            className={cn(
              'mt-4 max-w-[68ch] text-base leading-relaxed text-ink-muted',
              align === 'centre' && 'mx-auto'
            )}
          >
            {lede}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0" data-fx="arrive">
          {action}
        </div>
      )}
    </div>
  );
}

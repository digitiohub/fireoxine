'use client';

import { useCallback, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterOption = { value: string; label: string; count: number };

export type FilterGroups = {
  fireClass: FilterOption[];
  medium: FilterOption[];
  category: FilterOption[];
};

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'name', label: 'Name, A–Z' },
];

/**
 * Filters are URL state, not component state. That makes a filtered view
 * shareable, bookmarkable and survivable across a back button — all three of
 * which a client-state filter quietly breaks.
 */
export function ProductFilters({
  groups,
  total,
  showCategory = true,
}: {
  groups: FilterGroups;
  total: number;
  showCategory?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const selected = useCallback(
    (key: string) => new Set(params.getAll(key)),
    [params]
  );

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll(key);
    next.delete(key);
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    for (const v of updated) next.append(key, v);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const setSort = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const activeCount =
    params.getAll('class').length +
    params.getAll('medium').length +
    params.getAll('category').length +
    (params.get('isi') ? 1 : 0) +
    (params.get('electrical') ? 1 : 0);

  const clearAll = () => router.replace(pathname, { scroll: false });

  const groupBlock = (title: string, key: string, options: FilterOption[]) => {
    if (options.length === 0) return null;
    const chosen = selected(key);
    return (
      <fieldset className="border-t border-rule py-5">
        <legend className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">{title}</legend>
        <ul className="space-y-2">
          {options.map((option) => (
            <li key={option.value}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted transition-colors hover:text-ink">
                <input
                  type="checkbox"
                  checked={chosen.has(option.value)}
                  onChange={() => toggle(key, option.value)}
                  className="size-4 shrink-0 appearance-none border border-rule-strong bg-ground-raised checked:border-wedge checked:bg-wedge"
                />
                <span className="flex-1">{option.label}</span>
                <span className="fx-num text-xs text-ink-faint">{option.count}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    );
  };

  const panel = (
    <div>
      <fieldset className="pb-5">
        <legend className="fx-stencil mb-3 text-[0.65rem] text-ink-faint">Certification</legend>
        <ul className="space-y-2">
          <li>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted transition-colors hover:text-ink">
              <input
                type="checkbox"
                checked={params.get('isi') === '1'}
                onChange={() => {
                  const next = new URLSearchParams(params.toString());
                  if (next.get('isi')) next.delete('isi');
                  else next.set('isi', '1');
                  router.replace(`${pathname}?${next.toString()}`, { scroll: false });
                }}
                className="size-4 shrink-0 appearance-none border border-rule-strong bg-ground-raised checked:border-wedge checked:bg-wedge"
              />
              ISI marked only
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted transition-colors hover:text-ink">
              <input
                type="checkbox"
                checked={params.get('electrical') === '1'}
                onChange={() => {
                  const next = new URLSearchParams(params.toString());
                  if (next.get('electrical')) next.delete('electrical');
                  else next.set('electrical', '1');
                  router.replace(`${pathname}?${next.toString()}`, { scroll: false });
                }}
                className="size-4 shrink-0 appearance-none border border-rule-strong bg-ground-raised checked:border-wedge checked:bg-wedge"
              />
              Safe on live electrical
            </label>
          </li>
        </ul>
      </fieldset>

      {groupBlock('Fire class', 'class', groups.fireClass)}
      {groupBlock('Extinguishing medium', 'medium', groups.medium)}
      {showCategory && groupBlock('Product family', 'category', groups.category)}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fx-wedge-ghost text-xs"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
        <SortSelect value={params.get('sort') ?? 'featured'} onChange={setSort} />
      </div>

      {/* Desktop rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="flex items-center justify-between gap-3 pb-4">
            <h2 className="fx-display text-lg">Filters</h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="fx-stencil text-[0.65rem] text-wedge underline decoration-wedge/40 underline-offset-4"
              >
                Clear all
              </button>
            )}
          </div>
          <p className="fx-num mb-2 text-xs text-ink-faint">
            {total} {total === 1 ? 'product' : 'products'}
          </p>
          {panel}
        </div>
      </aside>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="flex-1 bg-ink/50"
          />
          <div className="flex w-[85vw] max-w-sm flex-col border-l border-rule-strong bg-ground">
            <div className="flex shrink-0 items-center justify-between border-b border-rule px-5 py-4">
              <h2 className="fx-display text-lg">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="grid size-9 place-items-center text-ink-muted hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">{panel}</div>
            <div className="flex shrink-0 gap-3 border-t border-rule p-5">
              {activeCount > 0 && (
                <button type="button" onClick={clearAll} className="fx-wedge-ghost flex-1 justify-center text-xs">
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="fx-wedge flex-1 justify-center text-xs"
              >
                Show {total}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      <span className="fx-stencil text-[0.65rem] text-ink-faint">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'border border-rule-strong bg-ground-raised px-2.5 py-1.5 text-xs text-ink',
          'focus:border-wedge focus:outline-2 focus:outline-wedge'
        )}
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SortBar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setSort = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="mb-6 hidden items-center justify-between gap-4 border-b border-rule pb-4 lg:flex">
      <p className="fx-num text-sm text-ink-muted">
        {total} {total === 1 ? 'product' : 'products'}
      </p>
      <SortSelect value={params.get('sort') ?? 'featured'} onChange={setSort} />
    </div>
  );
}

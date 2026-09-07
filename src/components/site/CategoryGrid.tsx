'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  imageUrl: string | null;
};

const INITIAL = 6;

/**
 * The category grid with the reference site's "load more" behaviour.
 * Everything is rendered server-side and merely hidden, so the extra cards
 * cost no request and stay in the document for search and for anyone who
 * lands with JavaScript still loading.
 */
export function CategoryGrid({
  categories,
  className,
}: {
  categories: Category[];
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const hasMore = categories.length > INITIAL;

  // The collapsed cells are display:none, so the scroll choreography leaves
  // them pending rather than marking them arrived while invisible. Expanding
  // is a click, not a scroll, so this component is what tells them they have
  // arrived — otherwise "load more" would reveal six permanently blank cells.
  useEffect(() => {
    if (!expanded || !listRef.current) return;
    const frame = requestAnimationFrame(() => {
      listRef.current
        ?.querySelectorAll('[data-fx]')
        .forEach((el) => el.classList.add('fx-in'));
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded]);

  return (
    <div className={className}>
      <ul
        ref={listRef}
        className="fx-stagger grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3"
      >
        {categories.map((category, index) => (
          <li
            key={category.id}
            hidden={!expanded && index >= INITIAL}
            className="bg-ground-raised"
            data-fx="car"
          >
            <Link
              href={`/shop/${category.slug}`}
              className="group flex h-full flex-col overflow-hidden"
            >
              <div className="relative aspect-[16/10] overflow-hidden border-b border-rule bg-ground-sunk">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    // The first row is above the fold and holds the LCP.
                    priority={index < 3}
                    className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                ) : (
                  <div
                    className="fx-newsprint grid size-full place-items-center"
                    aria-hidden="true"
                  >
                    <span className="fx-display px-6 text-center text-3xl leading-[0.9] text-ink/15">
                      {category.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 items-start justify-between gap-4 p-5">
                <div>
                  <h3 className="fx-display text-xl leading-tight transition-colors group-hover:text-wedge">
                    {category.name}
                  </h3>
                  {category.tagline && (
                    <p className="fx-stencil mt-1.5 text-[0.6rem] text-ink-faint">
                      {category.tagline}
                    </p>
                  )}
                </div>
                <ArrowUpRight
                  className="mt-1 size-4 shrink-0 text-ink-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-wedge"
                  aria-hidden="true"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn('fx-wedge-ghost')}
            aria-expanded={expanded}
          >
            {expanded
              ? 'Show fewer'
              : `Load ${categories.length - INITIAL} more collections`}
          </button>
        </div>
      )}
    </div>
  );
}

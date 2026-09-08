import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';

/**
 * The horizontal product rail the reference site runs per category.
 * Native scroll-snap rather than a JS carousel: it keeps keyboard and
 * touch behaviour the browser already gets right, and it degrades to a
 * plain scrolling list with no script at all.
 */
export function ProductRail({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: ProductCardData[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="py-10" aria-labelledby={`rail-${href.replace(/\W/g, '')}`}>
      <div className="relative mb-6 flex items-end justify-between gap-4 pb-3">
        <h3
          id={`rail-${href.replace(/\W/g, '')}`}
          className="fx-display text-2xl sm:text-3xl"
        >
          {title}
        </h3>
        <Link
          href={href}
          className="fx-stencil group inline-flex shrink-0 items-center gap-2 text-[0.7rem] text-ink-muted transition-colors hover:text-wedge"
        >
          See all
          <ArrowRight
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>

        {/* The rule the head rides on. It was a bottom border; it is now an
            element so the draw can reach it. Identical at rest. */}
        <span
          aria-hidden="true"
          data-fx="rule"
          className="absolute inset-x-0 bottom-0 h-px bg-rule"
        />
      </div>

      {/*
        A scroll-snap rail below lg, a wrapping grid above it. A pure rail
        leaves a short range stranded beside a wide empty gutter on desktop,
        which reads as a failed load rather than as a small collection.
      */}
      <ul className="-mx-4 grid auto-cols-[74vw] grid-flow-col gap-4 overflow-x-auto px-4 pb-3 [scroll-snap-type:x_mandatory] sm:-mx-6 sm:auto-cols-[46vw] sm:px-6 lg:mx-0 lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {products.slice(0, 8).map((product) => (
          <li key={product.id} className="[scroll-snap-align:start]">
            <ProductCard product={product} className="h-full" />
          </li>
        ))}
      </ul>
    </section>
  );
}

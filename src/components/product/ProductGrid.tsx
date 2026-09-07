import Link from 'next/link';
import { PackageOpen } from 'lucide-react';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';

export function ProductGrid({
  products,
  emptyAction,
}: {
  products: ProductCardData[];
  emptyAction?: React.ReactNode;
}) {
  if (products.length === 0) {
    return (
      <div className="border border-rule bg-ground-raised px-6 py-20 text-center">
        <PackageOpen className="mx-auto size-8 text-ink-faint" aria-hidden="true" />
        <h2 className="fx-display mt-5 text-2xl">Nothing matches that combination</h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-ink-muted">
          Filtering for several fire classes at once asks for a single unit rated for all of them,
          which not many products are. Try removing a class, or start from the hazard instead.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {emptyAction ?? (
            <>
              <Link href="/shop/all" className="fx-wedge-ghost">
                Clear filters
              </Link>
              <Link href="/hazard" className="fx-wedge">
                Shop by hazard
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product, i) => (
        <li key={product.id}>
          {/* The first row is above the fold on every breakpoint. */}
          <ProductCard product={product} className="h-full" priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}

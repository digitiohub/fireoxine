import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { apiGetOr } from '@/lib/api';
import { PageHeader } from '@/components/site/PageHeader';
import type { CategoryDto } from '@fireoxine/types';

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Every FireOxine product family: portable extinguishers, fixed installations, detection, signage and accessories.',
};

export default async function ShopPage() {
  const categories = await apiGetOr<CategoryDto[]>('/api/catalogue/categories', [], {
    anonymous: true,
    revalidate: 60,
  });

  return (
    <>
      <PageHeader
        title="Collections"
        lede="Seven product families. If you already know what you need, start here; if you do not, start from the hazard instead."
        action={
          <Link href="/hazard" className="fx-wedge-ghost">
            Shop by hazard
          </Link>
        }
      />

      <div className="mx-auto max-w-[1600px] px-4 py-14 pb-24 sm:px-6 lg:px-10">
        <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          <li className="bg-ground-raised">
            <Link
              href="/shop/all"
              className="group flex h-full flex-col justify-between gap-6 p-7 transition-colors hover:bg-ground-sunk"
            >
              <div>
                <h2 className="fx-display text-2xl leading-tight text-wedge">All products</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  The complete catalogue in one filterable list — by fire class, by medium, by
                  certification and by price.
                </p>
              </div>
              <span className="fx-stencil inline-flex items-center gap-2 text-[0.65rem]">
                Browse everything
                <ArrowRight
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>

          {categories.map((category) => (
            <li key={category.id} className="bg-ground-raised">
              <Link
                href={`/shop/${category.slug}`}
                className="group flex h-full flex-col justify-between gap-6 p-7 transition-colors hover:bg-ground-sunk"
              >
                <div>
                  <h2 className="fx-display text-2xl leading-tight transition-colors group-hover:text-wedge">
                    {category.name}
                  </h2>
                  {category.tagline && (
                    <p className="fx-stencil mt-2 text-[0.6rem] text-wedge">{category.tagline}</p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {category.description}
                  </p>
                </div>
                <span className="fx-stencil fx-num flex items-center justify-between gap-2 text-[0.65rem] text-ink-faint">
                  {category.productCount ?? 0}{' '}
                  {category.productCount === 1 ? 'product' : 'products'}
                  <ArrowRight
                    className="size-3.5 text-ink transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

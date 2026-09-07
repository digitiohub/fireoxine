import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getProductCards } from '@/lib/queries';
import {
  buildProductWhere,
  buildProductOrder,
  buildFilterGroups,
  sortByPrice,
  type SearchParams,
} from '@/lib/catalogue';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/site/PageHeader';
import { ProductFilters, SortBar } from '@/components/product/ProductFilters';
import { ProductGrid } from '@/components/product/ProductGrid';

export const metadata: Metadata = {
  title: 'All products',
  description:
    'The complete FireOxine catalogue, filterable by fire class, extinguishing medium, certification and product family.',
};

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const where = buildProductWhere(params);

  const [rawProducts, groups] = await Promise.all([
    db.product
      .findMany({
        where,
        orderBy: buildProductOrder(params),
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          medium: true,
          isIsiMarked: true,
          standardCode: true,
          safeOnLiveElectrical: true,
          images: {
            orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
            take: 1,
            select: { url: true, alt: true },
          },
          variants: {
            orderBy: { position: 'asc' },
            select: { id: true, label: true, pricePaise: true, mrpPaise: true, stock: true },
          },
          fireClasses: {
            orderBy: { fireClass: { position: 'asc' } },
            select: { covers: true, fireClass: { select: { code: true, label: true } } },
          },
        },
      })
      .then((rows) => rows.filter((r) => r.variants.length > 0)),
    buildFilterGroups(),
  ]);

  const products = sortByPrice(rawProducts, params.sort as string | undefined);

  return (
    <>
      <PageHeader
        title="All products"
        lede="Filter by what you need it to stop, not by what it is called. Every card states the classes the unit is rated for and the ones it must never touch."
      />

      <div className="mx-auto max-w-[1600px] px-4 py-12 pb-24 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
          <Suspense fallback={<div className="hidden lg:block" />}>
            <ProductFilters groups={groups} total={products.length} />
          </Suspense>

          <div>
            <Suspense fallback={null}>
              <SortBar total={products.length} />
            </Suspense>
            <ProductGrid products={products} />
          </div>
        </div>
      </div>
    </>
  );
}

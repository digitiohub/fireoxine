import type { Metadata } from 'next';
import { Suspense } from 'react';
import { apiGetOr, queryString } from '@/lib/api';
import { PageHeader } from '@/components/site/PageHeader';
import { ProductFilters, SortBar } from '@/components/product/ProductFilters';
import { ProductGrid } from '@/components/product/ProductGrid';
import type { ProductListDto } from '@fireoxine/types';

type SearchParams = Record<string, string | string[] | undefined>;

const EMPTY: ProductListDto = {
  products: [],
  filters: { fireClass: [], medium: [], category: [] },
  total: 0,
};

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

  const list = await apiGetOr<ProductListDto>(
    `/api/catalogue/products${queryString(params)}`,
    EMPTY,
    { anonymous: true }
  );

  // A product with no variant has no price, so it cannot be listed or bought.
  const products = list.products.filter((p) => p.variants.length > 0);
  const groups = list.filters;

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

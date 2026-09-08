import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronRight } from 'lucide-react';
import { apiGet, apiGetOr, queryString } from '@/lib/api';
import { PageHeader } from '@/components/site/PageHeader';
import { ProductFilters, SortBar } from '@/components/product/ProductFilters';
import { ProductGrid } from '@/components/product/ProductGrid';
import type { CategoryDto, FilterGroups, ProductCardDto } from '@fireoxine/types';

type SearchParams = Record<string, string | string[] | undefined>;
type CategoryPayload = {
  category: CategoryDto;
  products: ProductCardDto[];
  filters: FilterGroups;
  total: number;
};

export async function generateStaticParams() {
  const categories = await apiGetOr<CategoryDto[]>('/api/catalogue/categories', [], {
    anonymous: true,
  });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await apiGet<CategoryPayload>(`/api/catalogue/categories/${slug}`, {
    anonymous: true,
  });
  if (!res.ok) return { title: 'Collection not found' };
  return {
    title: res.data.category.name,
    description: res.data.category.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  // Products, facet counts and the category itself come back together: the
  // filtering rules live in the API so both clients cannot disagree on them.
  const res = await apiGet<CategoryPayload>(
    `/api/catalogue/categories/${slug}${queryString(query)}`,
    { anonymous: true }
  );
  if (!res.ok) notFound();

  const { category, products, filters: groups } = res.data;

  return (
    <>
      <PageHeader
        title={category.name}
        lede={category.description ?? undefined}
        eyebrowLinks={
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
              <li>
                <Link href="/shop" className="transition-colors hover:text-ink">
                  Collections
                </Link>
              </li>
              <ChevronRight className="size-3 text-ink-faint" aria-hidden="true" />
              <li aria-current="page" className="text-ink">
                {category.name}
              </li>
            </ol>
          </nav>
        }
      />

      <div className="mx-auto max-w-[1600px] px-4 py-12 pb-24 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
          <Suspense fallback={<div className="hidden lg:block" />}>
            <ProductFilters groups={groups} total={products.length} showCategory={false} />
          </Suspense>
          <div>
            <Suspense fallback={null}>
              <SortBar total={products.length} />
            </Suspense>
            <ProductGrid
              products={products}
              emptyAction={
                <Link href={`/shop/${category.slug}`} className="fx-wedge-ghost">
                  Clear filters
                </Link>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import {
  buildProductWhere,
  buildProductOrder,
  buildFilterGroups,
  sortByPrice,
  type SearchParams,
} from '@/lib/catalogue';
import { PageHeader } from '@/components/site/PageHeader';
import { ProductFilters, SortBar } from '@/components/product/ProductFilters';
import { ProductGrid } from '@/components/product/ProductGrid';

export async function generateStaticParams() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) return { title: 'Collection not found' };
  return {
    title: category.name,
    description: category.description ?? undefined,
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

  const category = await db.category.findUnique({ where: { slug } });
  if (!category || !category.isActive) notFound();

  const base = { categoryId: category.id };
  const [rawProducts, groups] = await Promise.all([
    db.product.findMany({
      where: buildProductWhere(query, base),
      orderBy: buildProductOrder(query),
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
    }),
    buildFilterGroups(base),
  ]);

  const products = sortByPrice(rawProducts, query.sort as string | undefined);

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

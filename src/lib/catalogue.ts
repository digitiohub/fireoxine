import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { mediumLabel } from '@/lib/utils';
import type { FilterGroups } from '@/components/product/ProductFilters';

export type SearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Turns the URL's filter state into a Prisma where clause.
 *
 * Fire class filtering deliberately matches `covers: true` only. Someone
 * filtering for Class B wants units rated for Class B — never units that
 * carry an explicit Class B prohibition, which is the opposite of the ask.
 */
export function buildProductWhere(
  params: SearchParams,
  base: Prisma.ProductWhereInput = {}
): Prisma.ProductWhereInput {
  const classes = toArray(params.class);
  const mediums = toArray(params.medium);
  const categories = toArray(params.category);

  const where: Prisma.ProductWhereInput = { isActive: true, ...base };
  const and: Prisma.ProductWhereInput[] = [];

  if (classes.length) {
    // AND across classes: picking A and B means "rated for both", which is
    // what someone covering a mixed risk actually needs.
    for (const code of classes) {
      and.push({ fireClasses: { some: { covers: true, fireClass: { code } } } });
    }
  }
  if (mediums.length) {
    and.push({ medium: { in: mediums as Prisma.ProductWhereInput['medium'][] as never } });
  }
  if (categories.length) {
    and.push({ category: { slug: { in: categories } } });
  }
  if (params.isi === '1') and.push({ isIsiMarked: true });
  if (params.electrical === '1') and.push({ safeOnLiveElectrical: true });

  if (and.length) where.AND = and;
  return where;
}

export function buildProductOrder(
  params: SearchParams
): Prisma.ProductOrderByWithRelationInput[] {
  switch (params.sort) {
    case 'name':
      return [{ name: 'asc' }];
    // Price sorting is applied in memory after load, because the sort key is
    // the default variant's price and Prisma cannot order a parent by a
    // filtered child. The catalogue is small enough that this is honest and
    // fast; if it grows past a few thousand rows, denormalise a
    // `fromPricePaise` column onto Product and sort in SQL.
    case 'price-asc':
    case 'price-desc':
      return [{ position: 'asc' }];
    default:
      return [{ isFeatured: 'desc' }, { position: 'asc' }];
  }
}

export function sortByPrice<T extends { variants: { pricePaise: number }[] }>(
  products: T[],
  sort: string | undefined
): T[] {
  if (sort !== 'price-asc' && sort !== 'price-desc') return products;
  const priceOf = (p: T) => Math.min(...p.variants.map((v) => v.pricePaise));
  return [...products].sort((a, b) =>
    sort === 'price-asc' ? priceOf(a) - priceOf(b) : priceOf(b) - priceOf(a)
  );
}

/**
 * Facet counts are computed against the base scope (the category or hazard
 * you are inside), not against the current filter selection. Counting against
 * the selection makes every option read "0" the moment you pick one, which is
 * the classic filter bug.
 */
export async function buildFilterGroups(
  base: Prisma.ProductWhereInput = {}
): Promise<FilterGroups> {
  const scope: Prisma.ProductWhereInput = { isActive: true, ...base };

  const [classRows, products, categories] = await Promise.all([
    db.fireClass.findMany({
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { products: { where: { covers: true, product: scope } } } },
      },
    }),
    db.product.findMany({ where: scope, select: { medium: true } }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: { where: scope } } } },
    }),
  ]);

  const mediumCounts = new Map<string, number>();
  for (const p of products) {
    mediumCounts.set(p.medium, (mediumCounts.get(p.medium) ?? 0) + 1);
  }

  return {
    fireClass: classRows
      .filter((c) => c._count.products > 0)
      .map((c) => ({
        value: c.code,
        label: `Class ${c.code} — ${c.label}`,
        count: c._count.products,
      })),
    medium: [...mediumCounts.entries()]
      .filter(([value]) => value !== 'NOT_APPLICABLE')
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, label: mediumLabel(value), count })),
    category: categories
      .filter((c) => c._count.products > 0)
      .map((c) => ({ value: c.slug, label: c.name, count: c._count.products })),
  };
}

import { db } from '@/lib/db';
import { notFound, ok } from '@/lib/http';
import { productCardSelect, toCategory, toProductCard } from '@/lib/serialize';
import {
  buildFilterGroups,
  buildProductOrder,
  buildProductWhere,
  paramsFrom,
  sortByPrice,
} from '@/lib/catalogue';

/** A category page in one round trip: the category, its products, its facets. */
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category || !category.isActive) return notFound('That collection does not exist.');

  const params = paramsFrom(new URL(request.url));
  const base = { categoryId: category.id };

  const [rows, filters] = await Promise.all([
    db.product.findMany({
      where: buildProductWhere(params, base),
      select: productCardSelect,
      orderBy: buildProductOrder(params),
    }),
    buildFilterGroups(base),
  ]);

  const products = sortByPrice(rows.map(toProductCard), params.sort as string | undefined);
  return ok({ category: toCategory(category), products, filters, total: products.length });
}

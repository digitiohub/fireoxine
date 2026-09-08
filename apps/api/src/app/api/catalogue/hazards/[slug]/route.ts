import { db } from '@/lib/db';
import { notFound, ok } from '@/lib/http';
import { productCardSelect, toHazard, toProductCard } from '@/lib/serialize';
import {
  buildFilterGroups,
  buildProductOrder,
  buildProductWhere,
  paramsFrom,
  sortByPrice,
} from '@/lib/catalogue';

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const hazard = await db.hazard.findUnique({ where: { slug } });
  if (!hazard || !hazard.isActive) return notFound('That hazard page does not exist.');

  const params = paramsFrom(new URL(request.url));
  const base = { hazards: { some: { hazardId: hazard.id } } };

  const [rows, filters] = await Promise.all([
    db.product.findMany({
      where: buildProductWhere(params, base),
      select: productCardSelect,
      orderBy: buildProductOrder(params),
    }),
    buildFilterGroups(base),
  ]);

  const products = sortByPrice(rows.map(toProductCard), params.sort as string | undefined);
  return ok({ hazard: toHazard(hazard), products, filters, total: products.length });
}

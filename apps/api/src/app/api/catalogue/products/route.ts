import { db } from '@/lib/db';
import { ok } from '@/lib/http';
import { productCardSelect, toProductCard } from '@/lib/serialize';
import {
  buildFilterGroups,
  buildProductOrder,
  buildProductWhere,
  paramsFrom,
  sortByPrice,
} from '@/lib/catalogue';
import type { ProductListDto } from '@fireoxine/types';

/** The whole catalogue, filtered and faceted. Backs /shop/all and search. */
export async function GET(request: Request) {
  const params = paramsFrom(new URL(request.url));

  const [rows, filters] = await Promise.all([
    db.product.findMany({
      where: buildProductWhere(params),
      select: productCardSelect,
      orderBy: buildProductOrder(params),
    }),
    buildFilterGroups(),
  ]);

  const products = sortByPrice(rows.map(toProductCard), params.sort as string | undefined);
  return ok<ProductListDto>({ products, filters, total: products.length });
}

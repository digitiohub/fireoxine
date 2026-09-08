import { db } from '@/lib/db';
import { notFound, ok } from '@/lib/http';
import { getClaims } from '@/lib/guard';
import {
  productCardSelect,
  productDetailInclude,
  toProductCard,
  toProductDetail,
} from '@/lib/serialize';

/** Product detail plus the related rail, so the page needs one call. */
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const product = await db.product.findUnique({
    where: { slug },
    include: productDetailInclude,
  });
  if (!product || !product.isActive) return notFound('That product does not exist.');

  const related = await db.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    select: productCardSelect,
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    take: 6,
  });

  // Whether this viewer has saved it, so the buy box renders correctly on
  // first paint instead of flickering after a second request.
  const claims = await getClaims(request);
  const saved = claims
    ? Boolean(
        await db.wishlistItem.findUnique({
          where: { userId_productId: { userId: claims.sub, productId: product.id } },
        })
      )
    : false;

  return ok({
    product: toProductDetail(product),
    related: related.map(toProductCard),
    saved,
  });
}

import { db } from '@/lib/db';
import { ok, unauthorized } from '@/lib/http';
import { getClaims } from '@/lib/guard';
import { productCardSelect, toProductCard } from '@/lib/serialize';

export async function GET(request: Request) {
  const claims = await getClaims(request);
  if (!claims) return unauthorized();

  const rows = await db.wishlistItem.findMany({
    where: { userId: claims.sub },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: productCardSelect } },
  });
  return ok(rows.map((r) => toProductCard(r.product)));
}

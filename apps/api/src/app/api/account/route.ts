import { db } from '@/lib/db';
import { ok, unauthorized } from '@/lib/http';
import { getClaims } from '@/lib/guard';
import { orderInclude, productCardSelect, toOrder, toProductCard } from '@/lib/serialize';

/** Everything /account renders: the user, their orders, their saved items. */
export async function GET(request: Request) {
  const claims = await getClaims(request);
  if (!claims) return unauthorized();

  const [user, orders, wishlist, addresses] = await Promise.all([
    db.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    }),
    db.order.findMany({
      where: { userId: claims.sub },
      include: orderInclude,
      orderBy: { placedAt: 'desc' },
    }),
    db.wishlistItem.findMany({
      where: { userId: claims.sub },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: productCardSelect } },
    }),
    db.address.findMany({
      where: { userId: claims.sub },
      orderBy: { isDefault: 'desc' },
    }),
  ]);

  if (!user) return unauthorized();

  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    orders: orders.map(toOrder),
    wishlist: wishlist.map((w) => toProductCard(w.product)),
    addresses,
  });
}

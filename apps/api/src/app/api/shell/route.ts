import { db } from '@/lib/db';
import { ok } from '@/lib/http';
import { getUser } from '@/lib/guard';
import { loadCart } from '@/lib/cart';
import { getSettings } from '@/lib/settings';

/**
 * Everything the storefront's root layout needs, in one call.
 *
 * The layout runs on every page, so asking for settings, nav, cart and user
 * separately would put four extra round trips on every single request. This
 * is the one place where bundling is worth the coupling.
 */
export async function GET(request: Request) {
  const [settings, categories, hazards, cart, user] = await Promise.all([
    getSettings(),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      select: { name: true, slug: true },
    }),
    db.hazard.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      select: { name: true, slug: true },
    }),
    loadCart(request),
    getUser(request),
  ]);

  return ok({ settings, categories, hazards, cartCount: cart.count, user });
}

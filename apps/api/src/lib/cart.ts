import { db } from '@/lib/db';
import { getSettings, settingNumber } from '@/lib/settings';
import { cartItemInclude, emptyCart, toCartItem } from '@/lib/serialize';
import { getClaims } from '@/lib/guard';
import type { CartDto } from '@fireoxine/types';

/**
 * A cart belongs to a signed-in user, or to a guest session id. Both are real
 * rows: a guest who signs in later has their cart merged rather than dropped,
 * because losing a cart at the sign-in step is the commonest way a store
 * loses an order it had already won.
 *
 * The guest id used to be an httpOnly cookie read here. Now the storefront
 * owns that cookie and forwards the id as `x-cart-session`, because the API
 * is a different origin and cannot set a cookie for it.
 */
export const CART_SESSION_HEADER = 'x-cart-session';

export async function cartOwner(request: Request) {
  const claims = await getClaims(request);
  if (claims) return { userId: claims.sub, sessionId: null };
  const sessionId = request.headers.get(CART_SESSION_HEADER);
  return { userId: null, sessionId: sessionId && sessionId.length > 0 ? sessionId : null };
}

export async function loadCart(request: Request): Promise<CartDto> {
  const settings = await getSettings();
  const freeAbovePaise = settingNumber(settings, 'shipping.freeAbovePaise', 500000);
  const flat = settingNumber(settings, 'shipping.flatPaise', 15000);

  const { userId, sessionId } = await cartOwner(request);
  if (!userId && !sessionId) return emptyCart(freeAbovePaise);

  const rows = await db.cartItem.findMany({
    where: userId ? { userId } : { sessionId: sessionId! },
    include: cartItemInclude,
    orderBy: { createdAt: 'asc' },
  });

  const items = rows.map(toCartItem);
  const subtotalPaise = items.reduce((sum, i) => sum + i.variant.pricePaise * i.quantity, 0);
  const shippingPaise = items.length === 0 || subtotalPaise >= freeAbovePaise ? 0 : flat;

  return {
    items,
    subtotalPaise,
    shippingPaise,
    totalPaise: subtotalPaise + shippingPaise,
    count: items.reduce((n, i) => n + i.quantity, 0),
    freeAbovePaise,
  };
}

/** Called on sign-in: fold the guest cart into the user's own. */
export async function mergeGuestCart(userId: string, sessionId: string) {
  const guestItems = await db.cartItem.findMany({ where: { sessionId } });
  for (const item of guestItems) {
    const existing = await db.cartItem.findUnique({
      where: { userId_variantId: { userId, variantId: item.variantId } },
    });
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
      await db.cartItem.delete({ where: { id: item.id } });
    } else {
      await db.cartItem.update({
        where: { id: item.id },
        data: { userId, sessionId: null },
      });
    }
  }
}

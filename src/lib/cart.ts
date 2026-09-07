import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSettings, setting } from '@/lib/settings';

const GUEST_COOKIE = 'fx_cart';

/**
 * A cart belongs to a signed-in user, or to a guest cookie. Both are real
 * rows: a guest who signs in later has their cart merged rather than dropped,
 * because losing a cart at the sign-in step is the commonest way a store
 * loses an order it had already won.
 */
export async function getCartOwner() {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id, sessionId: null };

  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value ?? null;
  return { userId: null, sessionId: existing };
}

export async function ensureGuestSession(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
  });
  return id;
}

export type CartSummary = Awaited<ReturnType<typeof getCart>>;

export async function getCart() {
  const { userId, sessionId } = await getCartOwner();
  if (!userId && !sessionId) {
    return {
      items: [] as Awaited<ReturnType<typeof loadItems>>,
      subtotalPaise: 0,
      shippingPaise: 0,
      totalPaise: 0,
      count: 0,
      freeAbovePaise: 500000,
    };
  }

  const items = await loadItems(userId, sessionId);
  const subtotalPaise = items.reduce((sum, i) => sum + i.variant.pricePaise * i.quantity, 0);
  const settings = await getSettings();
  const freeAbovePaise = Number(setting(settings, 'shipping.freeAbovePaise'));
  const flat = Number(setting(settings, 'shipping.flatPaise'));
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

async function loadItems(userId: string | null, sessionId: string | null) {
  return db.cartItem.findMany({
    where: userId ? { userId } : { sessionId: sessionId! },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: { orderBy: { position: 'asc' }, take: 1 },
              category: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/** Called on sign-in: fold the guest cart into the user's own. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const sessionId = jar.get(GUEST_COOKIE)?.value;
  if (!sessionId) return;

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
  jar.delete(GUEST_COOKIE);
}

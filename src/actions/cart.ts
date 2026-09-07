'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCartOwner, ensureGuestSession } from '@/lib/cart';
import { auth } from '@/lib/auth';

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export async function addToCart(variantId: string, quantity = 1): Promise<ActionResult> {
  const parsed = addSchema.safeParse({ variantId, quantity });
  if (!parsed.success) return { ok: false, error: 'That item could not be added.' };

  const variant = await db.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    include: { product: { select: { name: true, isActive: true } } },
  });
  if (!variant || !variant.product.isActive) {
    return { ok: false, error: 'That product is no longer available.' };
  }
  if (variant.stock < 1) {
    return { ok: false, error: 'That size is out of stock.' };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const sessionId = userId ? null : await ensureGuestSession();

  const where = userId
    ? { userId_variantId: { userId, variantId: variant.id } }
    : { sessionId_variantId: { sessionId: sessionId!, variantId: variant.id } };

  const existing = await db.cartItem.findUnique({ where });
  // Never let the cart exceed what we can actually ship.
  const desired = (existing?.quantity ?? 0) + parsed.data.quantity;
  const capped = Math.min(desired, variant.stock);

  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: capped } });
  } else {
    await db.cartItem.create({
      data: { userId, sessionId, variantId: variant.id, quantity: capped },
    });
  }

  revalidatePath('/', 'layout');

  if (capped < desired) {
    return { ok: true, message: `Only ${variant.stock} left — cart set to ${capped}.` };
  }
  return { ok: true, message: `${variant.product.name} added to cart.` };
}

export async function updateCartQuantity(itemId: string, quantity: number): Promise<ActionResult> {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    return { ok: false, error: 'Invalid quantity.' };
  }

  const { userId, sessionId } = await getCartOwner();
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { variant: true },
  });
  // Ownership check: a cart item id is guessable, so never trust it alone.
  if (!item || (userId ? item.userId !== userId : item.sessionId !== sessionId)) {
    return { ok: false, error: 'That item is not in your cart.' };
  }

  if (quantity === 0) {
    await db.cartItem.delete({ where: { id: itemId } });
  } else {
    const capped = Math.min(quantity, item.variant.stock);
    await db.cartItem.update({ where: { id: itemId }, data: { quantity: capped } });
    if (capped < quantity) {
      revalidatePath('/', 'layout');
      return { ok: true, message: `Only ${item.variant.stock} in stock.` };
    }
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  return updateCartQuantity(itemId, 0);
}

export async function toggleWishlist(productId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'Sign in to save products for later.' };
  }

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath('/account');
    return { ok: true, message: 'Removed from saved items.' };
  }

  await db.wishlistItem.create({ data: { userId: session.user.id, productId } });
  revalidatePath('/account');
  return { ok: true, message: 'Saved for later.' };
}

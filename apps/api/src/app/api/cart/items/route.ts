import { z } from 'zod';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/http';
import { cartOwner, loadCart } from '@/lib/cart';

const schema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err('That item could not be added.');

  const variant = await db.productVariant.findUnique({
    where: { id: parsed.data.variantId },
    include: { product: { select: { name: true, isActive: true } } },
  });
  if (!variant || !variant.product.isActive) {
    return err('That product is no longer available.', 404);
  }
  if (variant.stock < 1) return err('That size is out of stock.', 409);

  const { userId, sessionId } = await cartOwner(request);
  if (!userId && !sessionId) return err('No cart session. Reload and try again.', 400);

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

  const cart = await loadCart(request);
  const message =
    capped < desired
      ? `Only ${variant.stock} left — cart set to ${capped}.`
      : `${variant.product.name} added to cart.`;
  return ok({ cart, message });
}

import { z } from 'zod';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/http';
import { cartOwner, loadCart } from '@/lib/cart';

const schema = z.object({ quantity: z.number().int().min(0).max(99) });

async function setQuantity(request: Request, id: string, quantity: number) {
  const { userId, sessionId } = await cartOwner(request);
  const item = await db.cartItem.findUnique({ where: { id }, include: { variant: true } });

  // Ownership check: a cart item id is guessable, so never trust it alone.
  if (!item || (userId ? item.userId !== userId : item.sessionId !== sessionId)) {
    return err('That item is not in your cart.', 404);
  }

  let message: string | undefined;
  if (quantity === 0) {
    await db.cartItem.delete({ where: { id } });
  } else {
    const capped = Math.min(quantity, item.variant.stock);
    await db.cartItem.update({ where: { id }, data: { quantity: capped } });
    if (capped < quantity) message = `Only ${item.variant.stock} in stock.`;
  }

  return ok({ cart: await loadCart(request), message });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err('Invalid quantity.');
  return setQuantity(request, id, parsed.data.quantity);
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return setQuantity(request, id, 0);
}

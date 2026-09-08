import { db } from '@/lib/db';
import { notFound, ok } from '@/lib/http';
import { getClaims } from '@/lib/guard';
import { orderInclude, toOrder } from '@/lib/serialize';

/**
 * The confirmation page is reachable by order number straight after checkout,
 * including for guests, so this is not gated on a session. It is gated on
 * ownership when the order HAS an owner: a signed-in customer's order must not
 * be readable by anyone who guesses the number.
 */
export async function GET(request: Request, ctx: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await ctx.params;
  const order = await db.order.findUnique({ where: { orderNumber }, include: orderInclude });
  if (!order) return notFound('No such order.');

  if (order.userId) {
    const claims = await getClaims(request);
    if (claims?.sub !== order.userId && claims?.role !== 'ADMIN') {
      return notFound('No such order.');
    }
  }

  return ok(toOrder(order));
}

import { z } from 'zod';
import { db } from '@/lib/db';
import { err, forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import { ORDER_STATUSES } from '@fireoxine/types';

const schema = z.object({ status: z.enum(ORDER_STATUSES) });

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err('Unknown order status.');

  await db.order.update({ where: { id }, data: { status: parsed.data.status } });
  return ok({ message: `Order marked ${parsed.data.status.toLowerCase()}.` });
}

import { db } from '@/lib/db';
import { err, forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import { saveVariant } from '@/lib/admin-write';

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;
  const result = await saveVariant({ ...(await request.json().catch(() => ({}))), id });
  if (result.error) return err(result.error);
  return ok({ message: result.message });
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  const inOrders = await db.orderItem.count({ where: { variantId: id } });
  if (inOrders > 0) {
    await db.productVariant.update({ where: { id }, data: { stock: 0 } });
    return ok({ message: 'Variant has order history. Stock set to zero instead of deleting.' });
  }

  await db.productVariant.delete({ where: { id } });
  return ok({ message: 'Variant deleted.' });
}

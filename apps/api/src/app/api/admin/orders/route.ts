import { db } from '@/lib/db';
import { forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import { orderInclude, toOrder } from '@/lib/serialize';

/**
 * Full orders, not summary rows: the admin list shows the shipping address,
 * the line items and the customer's note inline, so there is no detail page
 * to click into and no second request to make.
 */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const rows = await db.order.findMany({
    orderBy: { placedAt: 'desc' },
    include: orderInclude,
  });
  return ok(rows.map(toOrder));
}

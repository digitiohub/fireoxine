import { db } from '@/lib/db';
import { ok } from '@/lib/http';
import { toHazard } from '@/lib/serialize';

/**
 * Hazard cards show the union of classes their recommended units cover, so
 * that union is computed here rather than by shipping every product's class
 * table to the client and folding it there.
 */
export async function GET() {
  const rows = await db.hazard.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
    include: {
      _count: { select: { products: { where: { product: { isActive: true } } } } },
      products: {
        orderBy: { rank: 'asc' },
        include: {
          product: {
            select: {
              isActive: true,
              fireClasses: {
                orderBy: { fireClass: { position: 'asc' } },
                select: { covers: true, fireClass: { select: { code: true, label: true } } },
              },
            },
          },
        },
      },
    },
  });

  return ok(
    rows.map((h) => {
      const covered = new Map<string, { code: string; label: string }>();
      for (const ph of h.products) {
        if (!ph.product.isActive) continue;
        for (const fc of ph.product.fireClasses) {
          if (fc.covers) covered.set(fc.fireClass.code, fc.fireClass);
        }
      }
      return { ...toHazard(h), coveredClasses: [...covered.values()] };
    })
  );
}

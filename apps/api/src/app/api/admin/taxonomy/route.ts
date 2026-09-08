import { db } from '@/lib/db';
import { forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';

/**
 * The option lists the product form needs: families, hazards and the five
 * fire classes. Separate from /admin/categories because the New Product form
 * wants the choices, not the artwork or the counts.
 */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const [categories, hazards, fireClasses] = await Promise.all([
    db.category.findMany({ orderBy: { position: 'asc' }, select: { id: true, name: true } }),
    db.hazard.findMany({ orderBy: { position: 'asc' }, select: { id: true, name: true } }),
    db.fireClass.findMany({ orderBy: { position: 'asc' } }),
  ]);

  return ok({ categories, hazards, fireClasses });
}

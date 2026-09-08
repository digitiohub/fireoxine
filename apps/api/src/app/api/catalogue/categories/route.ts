import { db } from '@/lib/db';
import { ok } from '@/lib/http';
import { toCategory } from '@/lib/serialize';

export async function GET() {
  const rows = await db.category.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return ok(rows.map(toCategory));
}

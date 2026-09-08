import { db } from '@/lib/db';
import { forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';

/**
 * Both taxonomies together: product families and the hazard axis. The
 * Collections screen manages artwork for the first and lists the second.
 */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const [categories, hazards] = await Promise.all([
    db.category.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
    db.hazard.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const shape = <T extends { id: string; name: string; slug: string; imageUrl: string | null; isActive: boolean; _count: { products: number } }>(
    row: T
  ) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.imageUrl,
    isActive: row.isActive,
    productCount: row._count.products,
  });

  return ok({
    categories: categories.map((c) => ({
      ...shape(c),
      tagline: c.tagline,
      description: c.description,
    })),
    hazards: hazards.map((h) => ({ ...shape(h), summary: h.summary, pictogram: h.pictogram })),
  });
}

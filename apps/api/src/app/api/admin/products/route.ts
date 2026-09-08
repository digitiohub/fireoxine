import { db } from '@/lib/db';
import { err, forbidden, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import { upsertProduct } from '@/lib/admin-write';
import type { AdminProductRowDto, Medium } from '@fireoxine/types';

/**
 * The admin list shows inactive products too — that is the point of it.
 * `?filter=no-image` is the dashboard's "needs a photograph" queue.
 */
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const filter = new URL(request.url).searchParams.get('filter');

  const rows = await db.product.findMany({
    where: filter === 'no-image' ? { images: { none: {} } } : {},
    orderBy: [{ isActive: 'desc' }, { position: 'asc' }],
    include: {
      category: { select: { name: true } },
      images: {
        orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        take: 1,
        select: { url: true, alt: true },
      },
      variants: { select: { stock: true, pricePaise: true } },
      _count: { select: { images: true } },
    },
  });

  const products: AdminProductRowDto[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    medium: p.medium as Medium,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    categoryName: p.category.name,
    image: p.images[0] ?? null,
    imageCount: p._count.images,
    variantCount: p.variants.length,
    stock: p.variants.reduce((n, v) => n + v.stock, 0),
    fromPricePaise: p.variants.length
      ? Math.min(...p.variants.map((v) => v.pricePaise))
      : null,
  }));

  return ok(products);
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();

  const result = await upsertProduct(await request.json().catch(() => ({})));
  if (result.error) return err(result.error);

  return ok(
    { id: result.id, message: result.created ? 'Product created.' : 'Product saved.' },
    { status: result.created ? 201 : 200 }
  );
}

import { db } from '@/lib/db';
import { err, forbidden, notFound, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/guard';
import { productDetailInclude, toProductDetail } from '@/lib/serialize';
import { upsertProduct } from '@/lib/admin-write';

/** The edit form's whole payload: the product plus every option it offers. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  const [product, categories, hazards, fireClasses] = await Promise.all([
    db.product.findUnique({ where: { id }, include: productDetailInclude }),
    db.category.findMany({ orderBy: { position: 'asc' } }),
    db.hazard.findMany({ orderBy: { position: 'asc' } }),
    db.fireClass.findMany({ orderBy: { position: 'asc' } }),
  ]);
  if (!product) return notFound('No such product.');

  const images = await db.productImage.findMany({
    where: { productId: id },
    orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
  });

  return ok({
    product: toProductDetail(product),
    // The form needs the raw rows, not the public DTO, for ids and flags.
    images: images.map((i) => ({
      id: i.id,
      url: i.url,
      alt: i.alt,
      isPrimary: i.isPrimary,
      position: i.position,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      label: v.label,
      capacity: v.capacity,
      capacityUnit: v.capacityUnit,
      sku: v.sku,
      pricePaise: v.pricePaise,
      mrpPaise: v.mrpPaise,
      stock: v.stock,
      isDefault: v.isDefault,
    })),
    selectedFireClasses: Object.fromEntries(
      product.fireClasses.map((fc) => [fc.fireClass.code, fc.covers ? 'covers' : 'prohibited'])
    ),
    selectedHazardIds: product.hazards.map((h) => h.hazardId),
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    hazards: hazards.map((h) => ({ id: h.id, name: h.name })),
    fireClasses: fireClasses.map((f) => ({ code: f.code, label: f.label })),
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  const body = { ...(await request.json().catch(() => ({}))), id };
  const result = await upsertProduct(body);
  if (result.error) return err(result.error);
  return ok({ id: result.id, message: 'Product saved.' });
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return forbidden();
  const { id } = await ctx.params;

  // Orders reference variants, so a product with order history is archived
  // rather than deleted — an invoice must stay readable years later.
  const orderCount = await db.orderItem.count({ where: { variant: { productId: id } } });
  if (orderCount > 0) {
    await db.product.update({ where: { id }, data: { isActive: false } });
    return ok({
      archived: true,
      message: 'Product has order history, so it was archived rather than deleted.',
    });
  }

  await db.product.delete({ where: { id } });
  return ok({ archived: false, message: 'Product deleted.' });
}

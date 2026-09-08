import { z } from 'zod';
import { db } from '@/lib/db';
import { slugify, type Medium } from '@fireoxine/types';

/**
 * Create/update logic shared by the collection routes and the by-id routes.
 *
 * It lives here rather than in a route file because Next only permits HTTP
 * handlers to be exported from a route module — exporting a helper from one
 * makes the build reject the file.
 */

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, 'Enter a product name.'),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(2, 'Enter a SKU.'),
  categoryId: z.string().min(1, 'Choose a product family.'),
  shortDescription: z.string().trim().min(10, 'Write a one-line summary.'),
  description: z.string().trim().min(20, 'Write a full description.'),
  medium: z.string().min(1),
  standardCode: z.string().trim().optional().or(z.literal('')),
  warrantyNote: z.string().trim().optional().or(z.literal('')),
  refillMonths: z.union([z.number(), z.string()]).optional().nullable(),
  electricalRatingKv: z.union([z.number(), z.string()]).optional().nullable(),
  isIsiMarked: z.boolean().default(false),
  safeOnLiveElectrical: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  /** code -> 'covers' | 'prohibited' | 'unstated'. Absent means unstated. */
  fireClasses: z.record(z.string(), z.enum(['covers', 'prohibited', 'unstated'])).default({}),
  hazardIds: z.array(z.string()).default([]),
});

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type UpsertResult =
  | { error: string; id?: undefined; created?: undefined }
  | { error?: undefined; id: string; created: boolean };

export async function upsertProduct(body: unknown): Promise<UpsertResult> {
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const data = {
    name: d.name,
    slug: slugify(d.slug || d.name),
    sku: d.sku.toUpperCase(),
    categoryId: d.categoryId,
    shortDescription: d.shortDescription,
    description: d.description,
    medium: d.medium as Medium,
    standardCode: d.standardCode || null,
    warrantyNote: d.warrantyNote || null,
    refillMonths: num(d.refillMonths),
    electricalRatingKv: num(d.electricalRatingKv),
    isIsiMarked: d.isIsiMarked,
    safeOnLiveElectrical: d.safeOnLiveElectrical,
    isFeatured: d.isFeatured,
    isActive: d.isActive,
  };

  try {
    const product = d.id
      ? await db.product.update({ where: { id: d.id }, data })
      : await db.product.create({ data });

    // Fire classes are replaced wholesale: a class left out means "no claim
    // made", which is a different statement from a prohibition and must not
    // survive from a previous save.
    const classes = await db.fireClass.findMany();
    await db.productFireClass.deleteMany({ where: { productId: product.id } });
    for (const fc of classes) {
      const value = d.fireClasses[fc.code];
      if (value === 'covers' || value === 'prohibited') {
        await db.productFireClass.create({
          data: { productId: product.id, fireClassId: fc.id, covers: value === 'covers' },
        });
      }
    }

    await db.productHazard.deleteMany({ where: { productId: product.id } });
    for (const [rank, hazardId] of d.hazardIds.entries()) {
      await db.productHazard.create({ data: { productId: product.id, hazardId, rank } });
    }

    return { id: product.id, created: !d.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save.';
    if (message.includes('Unique constraint')) {
      return { error: 'That slug or SKU is already used by another product.' };
    }
    return { error: message };
  }
}

export const variantSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  label: z.string().trim().min(1, 'Enter a capacity label, e.g. 4 kg.'),
  capacity: z.union([z.number(), z.string()]),
  capacityUnit: z.string().trim().min(1),
  sku: z.string().trim().min(2),
  /** Entered in rupees by the admin; stored in paise. */
  price: z.union([z.number(), z.string()]),
  mrp: z.union([z.number(), z.string()]).optional().nullable(),
  stock: z.union([z.number(), z.string()]),
});

export async function saveVariant(
  body: unknown
): Promise<{ error: string; message?: undefined } | { error?: undefined; message: string }> {
  const parsed = variantSchema.safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const pricePaise = Math.round(Number(d.price) * 100);
  const mrpPaise =
    d.mrp === null || d.mrp === undefined || d.mrp === '' ? null : Math.round(Number(d.mrp) * 100);

  if (!Number.isFinite(pricePaise) || pricePaise <= 0) {
    return { error: 'Enter a price greater than zero.' };
  }
  if (mrpPaise !== null && mrpPaise < pricePaise) {
    return { error: 'MRP cannot be lower than the selling price.' };
  }

  const count = await db.productVariant.count({ where: { productId: d.productId } });
  const data = {
    productId: d.productId,
    label: d.label,
    capacity: Number(d.capacity),
    capacityUnit: d.capacityUnit,
    sku: d.sku.toUpperCase(),
    pricePaise,
    mrpPaise,
    stock: Math.max(0, Number(d.stock)),
    isDefault: count === 0,
    position: count,
  };

  try {
    if (d.id) {
      await db.productVariant.update({
        where: { id: d.id },
        // Order and default status are managed by the editor, not this form.
        data: { ...data, isDefault: undefined, position: undefined },
      });
    } else {
      await db.productVariant.create({ data });
    }
    return { message: 'Variant saved.' };
  } catch {
    return { error: 'That variant SKU is already in use.' };
  }
}

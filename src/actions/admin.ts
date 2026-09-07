'use server';

import { revalidatePath } from 'next/cache';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import type { Medium, OrderStatus, EnquiryStatus } from '@prisma/client';

export type AdminState = { ok?: boolean; error?: string; message?: string };

async function guard(): Promise<AdminState | null> {
  const admin = await requireAdmin();
  return admin ? null : { error: 'Not authorised.' };
}

/* --------------------------------------------------------------- products */

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, 'Enter a product name.'),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(2, 'Enter a SKU.'),
  categoryId: z.string().min(1, 'Choose a product family.'),
  shortDescription: z.string().trim().min(10, 'Write a one-line summary.'),
  description: z.string().trim().min(20, 'Write a full description.'),
  medium: z.string().min(1),
  standardCode: z.string().trim().optional(),
  warrantyNote: z.string().trim().optional(),
  refillMonths: z.string().optional(),
  electricalRatingKv: z.string().optional(),
});

export async function saveProduct(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const slug = slugify(d.slug || d.name);

  const data = {
    name: d.name,
    slug,
    sku: d.sku.toUpperCase(),
    categoryId: d.categoryId,
    shortDescription: d.shortDescription,
    description: d.description,
    medium: d.medium as Medium,
    standardCode: d.standardCode || null,
    warrantyNote: d.warrantyNote || null,
    refillMonths: d.refillMonths ? Number(d.refillMonths) : null,
    electricalRatingKv: d.electricalRatingKv ? Number(d.electricalRatingKv) : null,
    isIsiMarked: formData.get('isIsiMarked') === 'on',
    safeOnLiveElectrical: formData.get('safeOnLiveElectrical') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isActive: formData.get('isActive') === 'on',
  };

  try {
    const product = d.id
      ? await db.product.update({ where: { id: d.id }, data })
      : await db.product.create({ data });

    // Fire classes arrive as `class:<code>` = covers | prohibited | unstated.
    const classes = await db.fireClass.findMany();
    await db.productFireClass.deleteMany({ where: { productId: product.id } });
    for (const fc of classes) {
      const value = formData.get(`class:${fc.code}`);
      if (value === 'covers' || value === 'prohibited') {
        await db.productFireClass.create({
          data: { productId: product.id, fireClassId: fc.id, covers: value === 'covers' },
        });
      }
    }

    // Hazards arrive as repeated `hazard` values.
    const hazardIds = formData.getAll('hazard').map(String).filter(Boolean);
    await db.productHazard.deleteMany({ where: { productId: product.id } });
    for (const [rank, hazardId] of hazardIds.entries()) {
      await db.productHazard.create({ data: { productId: product.id, hazardId, rank } });
    }

    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
    return { ok: true, message: d.id ? 'Product saved.' : 'Product created.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save.';
    if (message.includes('Unique constraint')) {
      return { error: 'That slug or SKU is already used by another product.' };
    }
    return { error: message };
  }
}

export async function deleteProduct(id: string): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  // Orders reference variants, so a product with order history is archived
  // rather than deleted — an invoice must stay readable years later.
  const orderCount = await db.orderItem.count({ where: { variant: { productId: id } } });
  if (orderCount > 0) {
    await db.product.update({ where: { id }, data: { isActive: false } });
    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Product has order history, so it was archived rather than deleted.' };
  }

  await db.product.delete({ where: { id } });
  revalidatePath('/admin/products');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Product deleted.' };
}

/* --------------------------------------------------------------- variants */

const variantSchema = z.object({
  productId: z.string().min(1),
  id: z.string().optional(),
  label: z.string().trim().min(1, 'Enter a capacity label, e.g. 4 kg.'),
  capacity: z.string().min(1),
  capacityUnit: z.string().trim().min(1),
  sku: z.string().trim().min(2),
  price: z.string().min(1),
  mrp: z.string().optional(),
  stock: z.string().min(1),
});

export async function saveVariant(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = variantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  // Prices are entered in rupees and stored in paise.
  const pricePaise = Math.round(Number(d.price) * 100);
  const mrpPaise = d.mrp ? Math.round(Number(d.mrp) * 100) : null;

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
        data: { ...data, isDefault: undefined, position: undefined },
      });
    } else {
      await db.productVariant.create({ data });
    }
    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Variant saved.' };
  } catch {
    return { error: 'That variant SKU is already in use.' };
  }
}

export async function deleteVariant(id: string): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  const inOrders = await db.orderItem.count({ where: { variantId: id } });
  if (inOrders > 0) {
    await db.productVariant.update({ where: { id }, data: { stock: 0 } });
    return { ok: true, message: 'Variant has order history. Stock set to zero instead of deleting.' };
  }

  await db.productVariant.delete({ where: { id } });
  revalidatePath('/admin/products');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Variant deleted.' };
}

/* ----------------------------------------------------------------- images */

export async function deleteProductImage(imageId: string): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  const image = await db.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { error: 'Image not found.' };

  await db.productImage.delete({ where: { id: imageId } });

  // Remove the file too, but only from our own uploads directory.
  if (image.url.startsWith('/uploads/')) {
    const file = path.join(process.cwd(), 'public', 'uploads', path.basename(image.url));
    await unlink(file).catch(() => {});
  }

  // Promote the next image so a product never loses its primary silently.
  if (image.isPrimary) {
    const next = await db.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { position: 'asc' },
    });
    if (next) await db.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  revalidatePath('/admin/products');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Image removed.' };
}

export async function setPrimaryImage(imageId: string): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  const image = await db.productImage.findUnique({ where: { id: imageId } });
  if (!image) return { error: 'Image not found.' };

  await db.productImage.updateMany({
    where: { productId: image.productId },
    data: { isPrimary: false },
  });
  await db.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });

  revalidatePath('/admin/products');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Primary image set.' };
}

export async function setCategoryImage(
  categoryId: string,
  url: string | null
): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  await db.category.update({ where: { id: categoryId }, data: { imageUrl: url } });
  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
  return { ok: true, message: url ? 'Collection image set.' : 'Collection image removed.' };
}

/* ----------------------------------------------------------------- orders */

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  await db.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath('/admin/orders');
  revalidatePath('/account');
  return { ok: true, message: `Order marked ${status.toLowerCase()}.` };
}

export async function updateEnquiryStatus(
  kind: 'partner' | 'contact',
  id: string,
  status: EnquiryStatus
): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  if (kind === 'partner') await db.partnerEnquiry.update({ where: { id }, data: { status } });
  else await db.contactMessage.update({ where: { id }, data: { status } });

  revalidatePath('/admin/enquiries');
  return { ok: true, message: 'Status updated.' };
}

/* --------------------------------------------------------------- settings */

export async function saveSettings(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const denied = await guard();
  if (denied) return denied;

  const rows = await db.siteSetting.findMany();
  for (const row of rows) {
    const value = formData.get(row.key);
    if (typeof value === 'string' && value !== row.value) {
      await db.siteSetting.update({ where: { key: row.key }, data: { value } });
    }
  }

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Settings saved.' };
}

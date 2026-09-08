'use server';

import { revalidatePath } from 'next/cache';
import { apiDelete, apiPatch, apiPost, apiPut } from '@/lib/api';
import type { EnquiryStatus, OrderStatus } from '@fireoxine/types';

export type AdminState = { ok?: boolean; error?: string; message?: string };

/**
 * Thin wrappers over the API. Every rule — validation, the archive-instead-of-
 * delete behaviour, the paise conversion — lives in apps/api, so the back
 * office cannot drift from what the storefront sees.
 */
function done(
  res: { ok: true; data: { message?: string } } | { ok: false; error: string },
  paths: string[]
): AdminState {
  if (!res.ok) return { error: res.error };
  for (const path of paths) revalidatePath(path);
  return { ok: true, message: res.data.message };
}

/* --------------------------------------------------------------- products */

/** Reads the product form and hands the API structured JSON. */
export async function saveProduct(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const id = String(formData.get('id') ?? '');

  // Fire classes arrive as `class:<code>` = covers | prohibited | unstated.
  const fireClasses: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('class:')) fireClasses[key.slice(6)] = String(value);
  }

  const body = {
    name: formData.get('name'),
    slug: formData.get('slug') || '',
    sku: formData.get('sku'),
    categoryId: formData.get('categoryId'),
    shortDescription: formData.get('shortDescription'),
    description: formData.get('description'),
    medium: formData.get('medium'),
    standardCode: formData.get('standardCode') || '',
    warrantyNote: formData.get('warrantyNote') || '',
    refillMonths: formData.get('refillMonths') || null,
    electricalRatingKv: formData.get('electricalRatingKv') || null,
    isIsiMarked: formData.get('isIsiMarked') === 'on',
    safeOnLiveElectrical: formData.get('safeOnLiveElectrical') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isActive: formData.get('isActive') === 'on',
    fireClasses,
    hazardIds: formData.getAll('hazard').map(String).filter(Boolean),
  };

  const res = id
    ? await apiPatch<{ id: string; message: string }>(`/api/admin/products/${id}`, body)
    : await apiPost<{ id: string; message: string }>('/api/admin/products', body);

  return done(res, ['/products', `/products/${id}`]);
}

export async function deleteProduct(id: string): Promise<AdminState> {
  return done(await apiDelete<{ message: string }>(`/api/admin/products/${id}`), ['/products']);
}

/* --------------------------------------------------------------- variants */

export async function saveVariant(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const id = String(formData.get('id') ?? '');
  const body = {
    productId: formData.get('productId'),
    label: formData.get('label'),
    capacity: formData.get('capacity'),
    capacityUnit: formData.get('capacityUnit'),
    sku: formData.get('sku'),
    price: formData.get('price'),
    mrp: formData.get('mrp') || null,
    stock: formData.get('stock'),
  };

  const res = id
    ? await apiPatch<{ message: string }>(`/api/admin/variants/${id}`, body)
    : await apiPost<{ message: string }>('/api/admin/variants', body);

  return done(res, ['/products', `/products/${body.productId}`]);
}

export async function deleteVariant(id: string): Promise<AdminState> {
  return done(await apiDelete<{ message: string }>(`/api/admin/variants/${id}`), ['/products']);
}

/* ----------------------------------------------------------------- images */

export async function deleteProductImage(imageId: string): Promise<AdminState> {
  return done(await apiDelete<{ message: string }>(`/api/admin/images/${imageId}`), ['/products']);
}

export async function setPrimaryImage(imageId: string): Promise<AdminState> {
  return done(
    await apiPost<{ message: string }>(`/api/admin/images/${imageId}/primary`),
    ['/products']
  );
}

export async function setCategoryImage(
  categoryId: string,
  url: string | null
): Promise<AdminState> {
  return done(
    await apiPatch<{ message: string }>(`/api/admin/categories/${categoryId}`, { imageUrl: url }),
    ['/categories']
  );
}

/* --------------------------------------------------------- orders, inbox */

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<AdminState> {
  return done(
    await apiPatch<{ message: string }>(`/api/admin/orders/${orderId}`, { status }),
    ['/orders']
  );
}

export async function updateEnquiryStatus(
  kind: 'partner' | 'contact',
  id: string,
  status: EnquiryStatus
): Promise<AdminState> {
  return done(
    await apiPatch<{ message: string }>(`/api/admin/enquiries/${id}`, { kind, status }),
    ['/enquiries']
  );
}

/* --------------------------------------------------------------- settings */

export async function saveSettings(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value;
  }
  return done(
    await apiPut<{ changed: number; message: string }>('/api/admin/settings', { values }),
    ['/settings']
  );
}

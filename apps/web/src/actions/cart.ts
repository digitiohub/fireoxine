'use server';

import { revalidatePath } from 'next/cache';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import { ensureCartSessionId, getToken } from '@/lib/session';
import type { CartDto } from '@fireoxine/types';

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * A guest needs a cart id before the API can hold anything for them, and only
 * a server action may set the cookie. So the id is minted here and forwarded;
 * the API itself never sets cookies, because it is on another origin.
 */
async function ensureCartIdentity() {
  const token = await getToken();
  if (!token) await ensureCartSessionId();
}

export async function addToCart(variantId: string, quantity = 1): Promise<ActionResult> {
  await ensureCartIdentity();
  const res = await apiPost<{ cart: CartDto; message?: string }>('/api/cart/items', {
    variantId,
    quantity,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/', 'layout');
  return { ok: true, message: res.data.message };
}

export async function updateCartQuantity(itemId: string, quantity: number): Promise<ActionResult> {
  const res =
    quantity === 0
      ? await apiDelete<{ cart: CartDto; message?: string }>(`/api/cart/items/${itemId}`)
      : await apiPatch<{ cart: CartDto; message?: string }>(`/api/cart/items/${itemId}`, {
          quantity,
        });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/', 'layout');
  return { ok: true, message: res.data.message };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  return updateCartQuantity(itemId, 0);
}

export async function toggleWishlist(productId: string): Promise<ActionResult> {
  const token = await getToken();
  if (!token) return { ok: false, error: 'Sign in to save products for later.' };

  const res = await apiPost<{ saved: boolean; message: string }>('/api/wishlist/toggle', {
    productId,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath('/account');
  return { ok: true, message: res.data.message };
}

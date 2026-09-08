'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { apiPost } from '@/lib/api';
import type { OrderDto } from '@fireoxine/types';

export type CheckoutState = { error?: string };

/**
 * The stock re-check, the transaction and the cart clear all happen inside the
 * API now. This action only carries the form across and follows the redirect,
 * so there is exactly one implementation of "place an order" in the system.
 */
export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const res = await apiPost<OrderDto>('/api/orders', {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    line1: formData.get('line1'),
    line2: formData.get('line2') || '',
    city: formData.get('city'),
    state: formData.get('state'),
    pincode: formData.get('pincode'),
    notes: formData.get('notes') || '',
    saveAddress: formData.get('saveAddress') === 'on',
  });

  if (!res.ok) return { error: res.error };

  revalidatePath('/', 'layout');
  redirect(`/order/${res.data.orderNumber}`);
}

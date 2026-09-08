'use server';

import { apiPost } from '@/lib/api';

export type FormState = { ok?: boolean; error?: string; message?: string };

async function submit(path: string, body: Record<string, unknown>): Promise<FormState> {
  const res = await apiPost<{ message: string }>(path, body, { anonymous: true });
  return res.ok ? { ok: true, message: res.data.message } : { error: res.error };
}

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return submit('/api/forms/contact', Object.fromEntries(formData));
}

export async function partnerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return submit('/api/forms/partner', Object.fromEntries(formData));
}

export async function newsletterAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return submit('/api/forms/newsletter', { email: formData.get('email') });
}

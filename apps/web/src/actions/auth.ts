'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { apiPost } from '@/lib/api';
import {
  clearCartSessionId,
  clearToken,
  getCartSessionId,
  setToken,
} from '@/lib/session';
import type { AuthTokenDto } from '@fireoxine/types';

export type AuthState = { error?: string; ok?: boolean };

/**
 * Sign-in is a server action rather than a browser fetch on purpose: the API's
 * token has to land in an httpOnly cookie, which JavaScript cannot set. The
 * action calls the API, stores the token, and the browser never handles it.
 */
async function completeSignIn(result: AuthTokenDto) {
  await setToken(result.token, result.expiresIn);
  // The guest cart was merged into the account by the API, so the guest id has
  // no further use and keeping it would risk a stale second cart.
  await clearCartSessionId();
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const res = await apiPost<AuthTokenDto>('/api/auth/register', {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    cartSessionId: (await getCartSessionId()) ?? undefined,
  });

  if (!res.ok) return { error: res.error };

  await completeSignIn(res.data);
  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const res = await apiPost<AuthTokenDto>('/api/auth/login', {
    email: formData.get('email'),
    password: formData.get('password'),
    scope: 'web',
    cartSessionId: (await getCartSessionId()) ?? undefined,
  });

  if (!res.ok) return { error: res.error };

  await completeSignIn(res.data);
  revalidatePath('/', 'layout');
  redirect('/account');
}

export async function logoutAction() {
  // Nothing to revoke server-side: the token is stateless and short-lived, so
  // dropping the cookie is the sign-out.
  await clearToken();
  revalidatePath('/', 'layout');
  redirect('/');
}

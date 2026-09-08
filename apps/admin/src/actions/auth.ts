'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { apiPost } from '@/lib/api';
import { clearToken, setToken } from '@/lib/session';
import type { AuthTokenDto } from '@fireoxine/types';

export type AuthState = { error?: string };

/**
 * The back office has its own sign-in, on its own origin. The API refuses to
 * mint an admin-scoped token for a non-admin, so a customer's credentials
 * fail here even though they work perfectly on the storefront.
 */
export async function adminLoginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const res = await apiPost<AuthTokenDto>(
    '/api/auth/login',
    {
      email: formData.get('email'),
      password: formData.get('password'),
      scope: 'admin',
    },
    { anonymous: true }
  );

  if (!res.ok) return { error: res.error };

  await setToken(res.data.token, res.data.expiresIn);
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function adminLogoutAction() {
  await clearToken();
  revalidatePath('/', 'layout');
  redirect('/login');
}

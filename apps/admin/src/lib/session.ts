import { cookies } from 'next/headers';
import type { SessionUserDto } from '@fireoxine/types';

/**
 * The back office's own session, deliberately separate from the storefront's.
 *
 * Different cookie name, different origin, and the API only mints this token
 * for a user whose role is ADMIN. A customer session from the storefront
 * cannot be replayed here, and this cookie is never sent to the public site —
 * which is the security argument for splitting the two apps in the first
 * place. The admin app can then sit behind a VPN or an IP allowlist without
 * touching the storefront.
 */
export const SESSION_COOKIE = 'fx_admin_session';

export async function getToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function setToken(token: string, maxAge: number) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
}

export async function clearToken() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Null when there is no valid admin session. Every page checks this. */
export async function getAdmin(): Promise<SessionUserDto | null> {
  const token = await getToken();
  if (!token) return null;
  const { apiGet } = await import('@/lib/api');
  const res = await apiGet<SessionUserDto>('/api/auth/me');
  if (!res.ok || res.data.role !== 'ADMIN') return null;
  return res.data;
}

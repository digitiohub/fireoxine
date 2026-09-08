import { cookies } from 'next/headers';
import type { SessionUserDto } from '@fireoxine/types';

/**
 * The storefront's own session, independent of the back office.
 *
 * The API issues a signed token; this app keeps it in an httpOnly cookie that
 * JavaScript cannot read, and attaches it to server-side calls. The browser
 * never holds the token and never talks to the API directly, so there is no
 * CORS surface and no token sitting in localStorage. The admin app uses a
 * different cookie name on a different origin, so the two sessions cannot be
 * confused for one another.
 */
export const SESSION_COOKIE = 'fx_web_session';

/** The guest cart id. Carts outlive sessions, so this is separate. */
export const CART_COOKIE = 'fx_cart';

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

export async function getCartSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value ?? null;
}

/** Mints the guest cart id on first use. Server actions only — it writes. */
export async function ensureCartSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  jar.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
  });
  return id;
}

export async function clearCartSessionId() {
  const jar = await cookies();
  jar.delete(CART_COOKIE);
}

/** Cached per request so a page with several calls resolves the user once. */
export async function getSessionUser(): Promise<SessionUserDto | null> {
  const token = await getToken();
  if (!token) return null;
  const { apiGet } = await import('@/lib/api');
  const res = await apiGet<SessionUserDto>('/api/auth/me');
  return res.ok ? res.data : null;
}

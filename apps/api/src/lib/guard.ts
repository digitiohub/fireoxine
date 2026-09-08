import { verifyToken, type TokenClaims, type TokenScope } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SessionUserDto } from '@fireoxine/types';

function bearer(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Claims only — no database round trip. Null when there is no valid token. */
export async function getClaims(request: Request): Promise<TokenClaims | null> {
  const token = bearer(request);
  if (!token) return null;
  return verifyToken(token);
}

/** Resolves the token to a live user row, so a deleted account stops working. */
export async function getUser(request: Request): Promise<SessionUserDto | null> {
  const claims = await getClaims(request);
  if (!claims) return null;
  const user = await db.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, name: true, email: true, role: true },
  });
  return user ?? null;
}

/**
 * Admin routes demand BOTH an ADMIN role and a token minted for the admin app.
 * A customer token from the storefront is rejected even if that customer were
 * somehow an admin, which keeps the two sessions from bleeding into each other.
 */
export async function requireAdmin(request: Request): Promise<SessionUserDto | null> {
  const claims = await getClaims(request);
  if (!claims || claims.role !== 'ADMIN' || claims.scope !== 'admin') return null;
  const user = await db.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

export function scopeFrom(value: unknown): TokenScope {
  return value === 'admin' ? 'admin' : 'web';
}

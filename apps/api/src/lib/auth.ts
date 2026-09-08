import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import type { Role, SessionUserDto } from '@fireoxine/types';

/**
 * Auth lives here because the API owns the database, and web and admin are
 * separate origins that must not share a session.
 *
 * The API verifies the password and issues a short-lived signed JWT. Each
 * client stores that token in its OWN httpOnly cookie (fx_web / fx_admin) and
 * sends it back as a bearer token. Nothing about one app's cookie is readable
 * or replayable by the other, and the admin token is scoped so a customer
 * token can never satisfy an admin route even if it were stolen.
 */

/**
 * Resolved on first use, never at import.
 *
 * Throwing at module scope took the BUILD down: `next build` imports every
 * route module to collect page data, so an unset variable in CI failed the
 * image rather than the request. A missing secret must still be fatal — it
 * just has to be fatal at the point where a token is actually signed.
 */
let cachedKey: Uint8Array | null = null;

function signingKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set. The API refuses to issue tokens without it.');
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

/** Twelve hours. Long enough for a working day, short enough to matter. */
export const TOKEN_TTL_SECONDS = 60 * 60 * 12;

/**
 * Which app asked for the token. An `admin` token is only issued to a user
 * whose role is ADMIN, and a `web` token is never accepted on an admin route,
 * so the two sessions stay genuinely independent.
 */
export type TokenScope = 'web' | 'admin';

export type TokenClaims = {
  sub: string;
  role: Role;
  scope: TokenScope;
};

export async function issueToken(user: SessionUserDto, scope: TokenScope): Promise<string> {
  return new SignJWT({ role: user.role, scope })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer('fireoxine-api')
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(signingKey());
}

export async function verifyToken(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), { issuer: 'fireoxine-api' });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      role: (payload.role as Role) ?? 'CUSTOMER',
      scope: (payload.scope as TokenScope) ?? 'web',
    };
  } catch {
    return null;
  }
}

/** A dummy hash, so a missing account and a wrong password take the same time. */
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUserDto | null> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  const okPassword = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !okPassword) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

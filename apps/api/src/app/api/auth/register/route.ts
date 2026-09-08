import { z } from 'zod';
import { db } from '@/lib/db';
import { err, ok } from '@/lib/http';
import { hashPassword, issueToken, TOKEN_TTL_SECONDS } from '@/lib/auth';
import { mergeGuestCart } from '@/lib/cart';
import type { AuthTokenDto } from '@fireoxine/types';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Enter a 10-digit mobile number.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  cartSessionId: z.string().optional(),
});

/** Storefront registration only. It never mints an admin token or an admin role. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return err('An account with that email already exists. Sign in instead.', 409);
  }

  const created = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  if (parsed.data.cartSessionId) await mergeGuestCart(created.id, parsed.data.cartSessionId);

  const token = await issueToken(created, 'web');
  return ok<AuthTokenDto>({ token, user: created, expiresIn: TOKEN_TTL_SECONDS }, { status: 201 });
}

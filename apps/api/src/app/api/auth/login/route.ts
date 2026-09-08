import { z } from 'zod';
import { err, ok } from '@/lib/http';
import { issueToken, verifyCredentials, TOKEN_TTL_SECONDS } from '@/lib/auth';
import { scopeFrom } from '@/lib/guard';
import { mergeGuestCart } from '@/lib/cart';
import type { AuthTokenDto } from '@fireoxine/types';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  scope: z.enum(['web', 'admin']).default('web'),
  /** Guest cart to fold in on success. */
  cartSessionId: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err(parsed.error.issues[0].message);

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  // One message for both wrong-email and wrong-password, so the form is not a
  // tool for discovering which addresses have accounts.
  if (!user) return err('Those details did not match an account.', 401);

  const scope = scopeFrom(parsed.data.scope);
  // The admin app only ever issues admin-scoped tokens, and only to admins.
  if (scope === 'admin' && user.role !== 'ADMIN') {
    return err('That account does not have admin access.', 403);
  }

  if (scope === 'web' && parsed.data.cartSessionId) {
    await mergeGuestCart(user.id, parsed.data.cartSessionId);
  }

  const token = await issueToken(user, scope);
  return ok<AuthTokenDto>({ token, user, expiresIn: TOKEN_TTL_SECONDS });
}

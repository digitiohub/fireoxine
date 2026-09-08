import { z } from 'zod';
import { err, ok, unauthorized } from '@/lib/http';
import { getClaims } from '@/lib/guard';
import { loadCart, mergeGuestCart } from '@/lib/cart';

const schema = z.object({ sessionId: z.string().min(1) });

/** Folds a guest cart into the signed-in user's own after sign-in. */
export async function POST(request: Request) {
  const claims = await getClaims(request);
  if (!claims) return unauthorized();

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err('No guest cart to merge.');

  await mergeGuestCart(claims.sub, parsed.data.sessionId);
  return ok(await loadCart(request));
}

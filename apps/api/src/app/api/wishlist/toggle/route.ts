import { z } from 'zod';
import { db } from '@/lib/db';
import { err, ok, unauthorized } from '@/lib/http';
import { getClaims } from '@/lib/guard';

const schema = z.object({ productId: z.string().min(1) });

export async function POST(request: Request) {
  const claims = await getClaims(request);
  if (!claims) return unauthorized();

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return err('Unknown product.');

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: claims.sub, productId: parsed.data.productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    return ok({ saved: false, message: 'Removed from saved items.' });
  }

  await db.wishlistItem.create({
    data: { userId: claims.sub, productId: parsed.data.productId },
  });
  return ok({ saved: true, message: 'Saved for later.' });
}

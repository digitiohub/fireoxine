import { ok } from '@/lib/http';
import { db } from '@/lib/db';

/** Liveness plus a real database round trip, so a broken DSN fails loudly. */
export async function GET() {
  const products = await db.product.count();
  return ok({ service: 'fireoxine-api', products, at: new Date().toISOString() });
}

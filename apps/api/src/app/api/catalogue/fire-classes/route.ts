import { db } from '@/lib/db';
import { ok } from '@/lib/http';
import { toFireClass } from '@/lib/serialize';

export async function GET() {
  const rows = await db.fireClass.findMany({ orderBy: { position: 'asc' } });
  return ok(rows.map(toFireClass));
}
